// ============================================
// Express Backend Server
// Replaces Supabase SDK + Edge Functions
// ============================================

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();

// CORS - allow your domain
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Static files for uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sm_elite_hajj',
  user: process.env.DB_USER || 'sm_elite_user',
  password: process.env.DB_PASSWORD,
  max: 20,
});

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-secure-secret';
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

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
  try {
    const { rows } = await pool.query(
      'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.id, 'admin']
    );
    if (rows.length === 0) return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserAccessState = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
      u.id,
      u.email,
      COALESCE(p.full_name, u.raw_user_meta_data->>'full_name') AS full_name,
      COALESCE(p.is_approved, false) AS is_approved,
      EXISTS(
        SELECT 1
        FROM user_roles ur
        WHERE ur.user_id = u.id
          AND ur.role = 'admin'
      ) AS is_admin
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// ============================================
// AUTH ROUTES
// ============================================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, encrypted_password, raw_user_meta_data, email_confirmed_at)
       VALUES ($1, $2, $2, $3, now()) RETURNING id, email, created_at`,
      [email, passwordHash, JSON.stringify({ full_name: full_name || '' })]
    );

    // Profile is auto-created by trigger
    res.json({ user: rows[0], message: 'Account created. Waiting for admin approval.' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

// Sign In
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const storedHash = user.password_hash || user.encrypted_password;
    if (!storedHash) return res.status(400).json({ error: 'Password not set for this account' });

    const valid = await bcrypt.compare(password, storedHash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const accessUser = await getUserAccessState(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      data: {
        token,
        user: accessUser || {
          id: user.id,
          email: user.email,
          full_name: user.raw_user_meta_data?.full_name || null,
          is_approved: false,
          is_admin: false,
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile (token validation)
app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const userProfile = await getUserAccessState(req.user.id);
    if (!userProfile) return res.status(404).json({ error: 'User not found' });
    res.json({ data: userProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
app.get('/api/auth/user', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, email, raw_user_meta_data, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json({ user: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update password
app.post('/api/auth/update-password', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password_hash = $1, encrypted_password = $1 WHERE id = $2', [passwordHash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password (simplified - no email sending)
app.post('/api/auth/reset-password', async (req, res) => {
  res.json({ success: true, message: 'Contact admin to reset your password.' });
});

// ============================================
// FILE UPLOAD
// ============================================
app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `${BASE_URL}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// ============================================
// COMPANIES ROUTES
// ============================================
app.get('/api/companies', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/companies/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies', authenticate, async (req, res) => {
  try {
    const { name, tagline, email, phone, address, logo_url, address_line1, address_line2, website, thank_you_text, show_qr_code, footer_alignment } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO companies (user_id, name, tagline, email, phone, address, logo_url, address_line1, address_line2, website, thank_you_text, show_qr_code, footer_alignment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.user.id, name, tagline, email, phone, address, logo_url, address_line1, address_line2, website, thank_you_text, show_qr_code, footer_alignment]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/companies/:id', authenticate, async (req, res) => {
  try {
    const fields = req.body;
    const keys = Object.keys(fields).filter(k => k !== 'id' && k !== 'user_id' && k !== 'created_at');
    if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const vals = keys.map(k => fields[k]);
    const { rows } = await pool.query(
      `UPDATE companies SET ${sets} WHERE id = $1 AND user_id = $${keys.length + 2} RETURNING *`,
      [req.params.id, ...vals, req.user.id]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/companies/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM companies WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ data: { success: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// INVOICES ROUTES
// ============================================
app.get('/api/invoices', authenticate, async (req, res) => {
  try {
    const { rows: invoices } = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    // Batch fetch items and installments
    const invoiceIds = invoices.map(i => i.id);
    if (invoiceIds.length > 0) {
      const { rows: allItems } = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = ANY($1)', [invoiceIds]);
      const { rows: allInstallments } = await pool.query('SELECT * FROM installments WHERE invoice_id = ANY($1)', [invoiceIds]);
      
      for (const inv of invoices) {
        inv.items = allItems.filter(item => item.invoice_id === inv.id);
        inv.installments = allInstallments.filter(inst => inst.invoice_id === inv.id);
      }
    }

    res.json({ data: invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/next-number', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM invoices WHERE user_id = $1', [req.user.id]);
    const year = new Date().getFullYear();
    const nextNumber = (parseInt(rows[0].count) || 0) + 1;
    res.json({ data: { next_number: `INV-${year}-${nextNumber.toString().padStart(3, '0')}` } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const invoice = rows[0];
    const { rows: items } = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
    const { rows: installments } = await pool.query('SELECT * FROM installments WHERE invoice_id = $1', [invoice.id]);
    invoice.items = items;
    invoice.installments = installments;

    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public invoice view (no auth required)
app.get('/api/public/invoices/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const invoice = rows[0];
    const { rows: items } = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
    const { rows: installments } = await pool.query('SELECT * FROM installments WHERE invoice_id = $1', [invoice.id]);
    const { rows: companies } = await pool.query('SELECT * FROM companies WHERE id = $1', [invoice.company_id]);
    
    invoice.items = items;
    invoice.installments = installments;
    invoice.company = companies[0] || null;

    res.json({ data: invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    res.json({ data: invoice });
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
    res.json({ data: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/invoices/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM invoices WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ data: { success: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================
app.get('/api/admin/check', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.id, 'admin']
    );
    res.json({ data: { is_admin: rows.length > 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/check-approval', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT is_approved FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ data: { is_approved: rows[0]?.is_approved ?? false } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.email 
      FROM profiles p 
      LEFT JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/pending-users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.email 
      FROM profiles p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.is_approved = false 
      ORDER BY p.created_at DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/approve-user', authenticate, requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;
    await pool.query('UPDATE profiles SET is_approved = true WHERE user_id = $1', [user_id]);
    res.json({ data: { success: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/revoke-user', authenticate, requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;
    await pool.query('UPDATE profiles SET is_approved = false WHERE user_id = $1', [user_id]);
    res.json({ data: { success: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.params.userId === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.userId]);
    res.json({ data: { success: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quick edit invoice (PATCH)
app.patch('/api/invoices/:id/quick-edit', authenticate, async (req, res) => {
  try {
    const { client_name, client_email, client_phone, client_address, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE invoices SET client_name=$1, client_email=$2, client_phone=$3, client_address=$4, notes=$5 
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [client_name, client_email, client_phone, client_address, notes, req.params.id, req.user.id]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public company view (no auth)
app.get('/api/public/companies/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    res.json({ data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// THEME SETTINGS ROUTES (frontend calls /api/theme)
// ============================================
app.get('/api/theme', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM theme_settings WHERE id = $1', ['00000000-0000-0000-0000-000000000001']);
    res.json({ data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/theme', authenticate, async (req, res) => {
  try {
    const fields = req.body;
    const keys = Object.keys(fields).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const vals = keys.map(k => fields[k]);
    const { rows } = await pool.query(
      `UPDATE theme_settings SET ${sets} WHERE id = $1 RETURNING *`,
      ['00000000-0000-0000-0000-000000000001', ...vals]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/theme/reset', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE theme_settings SET 
        primary_color='#1B2B5B', secondary_color='#C8A951', accent_color='#2563eb',
        header_text_color='#1B2B5B', invoice_title_color='#1B2B5B', subtotal_text_color='#374151',
        paid_text_color='#16a34a', balance_bg_color='#1B2B5B', balance_text_color='#FFFFFF',
        table_header_bg='#1B2B5B', table_header_text='#FFFFFF', border_color='#e5e7eb',
        badge_paid_color='#16a34a', badge_partial_color='#f59e0b', badge_unpaid_color='#ef4444',
        footer_text_color='#6b7280'
       WHERE id = $1 RETURNING *`,
      ['00000000-0000-0000-0000-000000000001']
    );
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// BRAND SETTINGS ROUTES (frontend calls /api/branding)
// ============================================
app.get('/api/branding', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM global_brand_settings WHERE id = $1', ['00000000-0000-0000-0000-000000000002']);
    res.json({ data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/branding', authenticate, async (req, res) => {
  try {
    const fields = req.body;
    const keys = Object.keys(fields).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const vals = keys.map(k => fields[k]);
    const { rows } = await pool.query(
      `UPDATE global_brand_settings SET ${sets} WHERE id = $1 RETURNING *`,
      ['00000000-0000-0000-0000-000000000002', ...vals]
    );
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/branding/reset', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE global_brand_settings SET 
        company_name='SM Elite Hajj Limited', tagline=NULL, address_line1=NULL, address_line2=NULL,
        phone=NULL, email=NULL, website=NULL, thank_you_text=NULL, show_qr_code=true,
        footer_alignment='center', company_logo=NULL
       WHERE id = $1 RETURNING *`,
      ['00000000-0000-0000-0000-000000000002']
    );
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SERVE FRONTEND (Production)
// ============================================
const frontendPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SM Elite Hajj API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
