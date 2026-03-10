// ============================================
// Express Backend Server
// Replaces Supabase SDK + Edge Functions
// ============================================

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sm_elite_hajj',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
});

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-secure-secret';
const PORT = process.env.PORT || 3001;

// ============================================
// Auth Middleware
// ============================================
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = async (req, res, next) => {
  const { rows } = await pool.query(
    'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2',
    [req.user.id, 'admin']
  );
  if (rows.length === 0) return res.status(403).json({ error: 'Admin access required' });
  next();
};

// ============================================
// AUTH ROUTES
// ============================================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, raw_user_meta_data)
       VALUES ($1, $2, $3) RETURNING id, email, created_at`,
      [email, passwordHash, JSON.stringify({ full_name })]
    );

    // Profile is auto-created by trigger
    res.json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

// Sign In
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      session: { access_token: token },
      user: { id: user.id, email: user.email, user_metadata: user.raw_user_meta_data }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
app.get('/api/auth/user', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT id, email, raw_user_meta_data, created_at FROM users WHERE id = $1', [req.user.id]);
  res.json({ user: rows[0] || null });
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  // In production, send email with reset link
  res.json({ success: true, message: 'Password reset email sent (implement email sending)' });
});

// Update password
app.post('/api/auth/update-password', authenticate, async (req, res) => {
  const { password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);
  res.json({ success: true });
});

// ============================================
// COMPANIES ROUTES
// ============================================
app.get('/api/companies', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

app.get('/api/companies/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json(rows[0] || null);
});

app.post('/api/companies', authenticate, async (req, res) => {
  const { name, tagline, email, phone, address, logo_url, address_line1, address_line2, website, thank_you_text, show_qr_code, footer_alignment } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO companies (user_id, name, tagline, email, phone, address, logo_url, address_line1, address_line2, website, thank_you_text, show_qr_code, footer_alignment)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [req.user.id, name, tagline, email, phone, address, logo_url, address_line1, address_line2, website, thank_you_text, show_qr_code, footer_alignment]
  );
  res.json(rows[0]);
});

app.put('/api/companies/:id', authenticate, async (req, res) => {
  const fields = req.body;
  const sets = Object.keys(fields).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const vals = Object.values(fields);
  const { rows } = await pool.query(
    `UPDATE companies SET ${sets} WHERE id = $1 AND user_id = $${vals.length + 2} RETURNING *`,
    [req.params.id, ...vals, req.user.id]
  );
  res.json(rows[0]);
});

app.delete('/api/companies/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM companies WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ============================================
// INVOICES ROUTES
// ============================================
app.get('/api/invoices', authenticate, async (req, res) => {
  const { rows: invoices } = await pool.query(
    'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );

  // Fetch items and installments for each invoice
  for (const inv of invoices) {
    const { rows: items } = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [inv.id]);
    const { rows: installments } = await pool.query('SELECT * FROM installments WHERE invoice_id = $1', [inv.id]);
    inv.items = items;
    inv.installments = installments;
  }

  res.json(invoices);
});

app.get('/api/invoices/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const invoice = rows[0];
  const { rows: items } = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
  const { rows: installments } = await pool.query('SELECT * FROM installments WHERE invoice_id = $1', [invoice.id]);
  invoice.items = items;
  invoice.installments = installments;

  res.json(invoice);
});

// Public invoice view (no auth required)
app.get('/api/public/invoices/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const invoice = rows[0];
  const { rows: items } = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
  const { rows: installments } = await pool.query('SELECT * FROM installments WHERE invoice_id = $1', [invoice.id]);
  invoice.items = items;
  invoice.installments = installments;

  // Also fetch the company
  const { rows: companies } = await pool.query('SELECT * FROM companies WHERE id = $1', [invoice.company_id]);
  invoice.company = companies[0] || null;

  res.json(invoice);
});

app.post('/api/invoices', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { items, installments, ...invoiceData } = req.body;

    const { rows } = await client.query(
      `INSERT INTO invoices (user_id, company_id, invoice_number, client_name, client_email, client_phone, client_address, notes, invoice_date, due_date, subtotal, vat_rate, vat_amount, total_amount, paid_amount, due_amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [req.user.id, invoiceData.company_id, invoiceData.invoice_number, invoiceData.client_name, invoiceData.client_email, invoiceData.client_phone, invoiceData.client_address, invoiceData.notes, invoiceData.invoice_date, invoiceData.due_date, invoiceData.subtotal, invoiceData.vat_rate, invoiceData.vat_amount, invoiceData.total_amount, invoiceData.paid_amount, invoiceData.due_amount, invoiceData.status]
    );

    const invoice = rows[0];

    if (items?.length > 0) {
      for (const item of items) {
        await client.query(
          'INSERT INTO invoice_items (invoice_id, title, qty, unit_price, amount) VALUES ($1,$2,$3,$4,$5)',
          [invoice.id, item.title, item.qty, item.unit_price, item.amount]
        );
      }
    }

    if (installments?.length > 0) {
      for (const inst of installments) {
        await client.query(
          'INSERT INTO installments (invoice_id, amount, paid_date, payment_method) VALUES ($1,$2,$3,$4)',
          [invoice.id, inst.amount, inst.paid_date, inst.payment_method]
        );
      }
    }

    await client.query('COMMIT');
    res.json(invoice);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/invoices/:id', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { items, installments, ...invoiceData } = req.body;

    const { rows } = await client.query(
      `UPDATE invoices SET company_id=$1, invoice_number=$2, client_name=$3, client_email=$4, client_phone=$5, client_address=$6, notes=$7, invoice_date=$8, due_date=$9, subtotal=$10, vat_rate=$11, vat_amount=$12, total_amount=$13, paid_amount=$14, due_amount=$15, status=$16
       WHERE id=$17 AND user_id=$18 RETURNING *`,
      [invoiceData.company_id, invoiceData.invoice_number, invoiceData.client_name, invoiceData.client_email, invoiceData.client_phone, invoiceData.client_address, invoiceData.notes, invoiceData.invoice_date, invoiceData.due_date, invoiceData.subtotal, invoiceData.vat_rate, invoiceData.vat_amount, invoiceData.total_amount, invoiceData.paid_amount, invoiceData.due_amount, invoiceData.status, req.params.id, req.user.id]
    );

    // Replace items and installments
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    await client.query('DELETE FROM installments WHERE invoice_id = $1', [req.params.id]);

    if (items?.length > 0) {
      for (const item of items) {
        await client.query(
          'INSERT INTO invoice_items (invoice_id, title, qty, unit_price, amount) VALUES ($1,$2,$3,$4,$5)',
          [req.params.id, item.title, item.qty, item.unit_price, item.amount]
        );
      }
    }

    if (installments?.length > 0) {
      for (const inst of installments) {
        await client.query(
          'INSERT INTO installments (invoice_id, amount, paid_date, payment_method) VALUES ($1,$2,$3,$4)',
          [req.params.id, inst.amount, inst.paid_date, inst.payment_method]
        );
      }
    }

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/invoices/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM invoices WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// Invoice count for next number
app.get('/api/invoices/next-number', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM invoices WHERE user_id = $1', [req.user.id]);
  const year = new Date().getFullYear();
  const nextNumber = (parseInt(rows[0].count) || 0) + 1;
  res.json({ invoiceNumber: `INV-${year}-${nextNumber.toString().padStart(3, '0')}` });
});

// ============================================
// ADMIN ROUTES
// ============================================
app.get('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM profiles ORDER BY created_at DESC');
  res.json(rows);
});

app.get('/api/admin/pending-users', authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE is_approved = false ORDER BY created_at DESC');
  res.json(rows);
});

app.post('/api/admin/approve-user', authenticate, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  await pool.query('UPDATE profiles SET is_approved = true WHERE user_id = $1', [userId]);
  res.json({ success: true });
});

app.post('/api/admin/revoke-user', authenticate, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  await pool.query('UPDATE profiles SET is_approved = false WHERE user_id = $1', [userId]);
  res.json({ success: true });
});

app.post('/api/admin/delete-user', authenticate, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (userId === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  res.json({ success: true });
});

app.get('/api/admin/check', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2',
    [req.user.id, 'admin']
  );
  res.json({ isAdmin: rows.length > 0 });
});

// ============================================
// THEME SETTINGS ROUTES
// ============================================
app.get('/api/theme-settings', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM theme_settings WHERE id = $1', ['00000000-0000-0000-0000-000000000001']);
  res.json(rows[0] || null);
});

app.put('/api/theme-settings', authenticate, requireAdmin, async (req, res) => {
  const fields = req.body;
  const sets = Object.keys(fields).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const vals = Object.values(fields);
  const { rows } = await pool.query(
    `UPDATE theme_settings SET ${sets} WHERE id = $1 RETURNING *`,
    ['00000000-0000-0000-0000-000000000001', ...vals]
  );
  res.json(rows[0]);
});

// ============================================
// BRAND SETTINGS ROUTES
// ============================================
app.get('/api/brand-settings', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM global_brand_settings WHERE id = $1', ['00000000-0000-0000-0000-000000000002']);
  res.json(rows[0] || null);
});

app.put('/api/brand-settings', authenticate, requireAdmin, async (req, res) => {
  const fields = req.body;
  const sets = Object.keys(fields).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const vals = Object.values(fields);
  const { rows } = await pool.query(
    `UPDATE global_brand_settings SET ${sets} WHERE id = $1 RETURNING *`,
    ['00000000-0000-0000-0000-000000000002', ...vals]
  );
  res.json(rows[0]);
});

// ============================================
// USER PROFILE ROUTES
// ============================================
app.get('/api/profile', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);
  res.json(rows[0] || null);
});

app.get('/api/user-roles', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM user_roles WHERE user_id = $1', [req.user.id]);
  res.json(rows);
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`SM Elite Hajj API server running on port ${PORT}`);
});
