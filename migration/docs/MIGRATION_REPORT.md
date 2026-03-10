# Migration Report

## Overview
Migration from Lovable Cloud (Supabase) to self-hosted PostgreSQL on Hostinger KVM VPS.

## Files That Reference Supabase (Must Be Modified)

### Core Integration Files (Replace Entirely)
| File | Action |
|------|--------|
| `src/integrations/supabase/client.ts` | Replace with REST API client |
| `src/integrations/supabase/types.ts` | Keep types, remove Supabase-specific wrappers |

### Authentication
| File | Action |
|------|--------|
| `src/contexts/AuthContext.tsx` | Replace Supabase Auth with JWT-based auth |
| `src/pages/Login.tsx` | Update to call `/api/auth/login` |
| `src/pages/ResetPassword.tsx` | Update to call `/api/auth/reset-password` |
| `src/components/ProtectedRoute.tsx` | Update auth check logic |

### Data Hooks (Replace Supabase queries with fetch calls)
| File | API Endpoint |
|------|-------------|
| `src/hooks/useInvoices.ts` | `/api/invoices` |
| `src/hooks/useCompanies.ts` | `/api/companies` |
| `src/hooks/useAdmin.ts` | `/api/admin/*` |
| `src/hooks/useTheme.ts` | `/api/theme-settings` |
| `src/hooks/useBranding.ts` | `/api/brand-settings` |

### Edge Functions Converted
| Original Edge Function | New API Endpoint |
|------------------------|-----------------|
| `supabase/functions/delete-user/index.ts` | `POST /api/admin/delete-user` |

### Files to Remove
- `supabase/` directory (entire folder)
- `.env` (replace with backend `.env`)

### NPM Packages to Remove
- `@supabase/supabase-js`

### NPM Packages to Add (Frontend)
- None required (uses native `fetch`)

## Database Tables Migrated
1. `users` (new, replaces `auth.users`)
2. `profiles`
3. `user_roles`
4. `companies`
5. `invoices`
6. `invoice_items`
7. `installments`
8. `theme_settings`
9. `global_brand_settings`

## Database Functions Migrated
1. `update_updated_at_column()` - Trigger function
2. `handle_new_user()` - Auto-create profile on signup
3. `has_role()` - Check user role
4. `is_user_approved()` - Check approval status
5. `check_user_access()` - Combined access check

## Security Notes
- RLS (Row Level Security) is replaced by server-side middleware checks
- Authentication uses JWT tokens instead of Supabase Auth
- Admin checks done via `requireAdmin` middleware
- User data isolation enforced by `WHERE user_id = $1` in all queries

## API Endpoints Summary

### Auth
| Method | Endpoint | Auth Required |
|--------|----------|--------------|
| POST | `/api/auth/signup` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/user` | Yes |
| POST | `/api/auth/reset-password` | No |
| POST | `/api/auth/update-password` | Yes |

### Companies
| Method | Endpoint | Auth Required |
|--------|----------|--------------|
| GET | `/api/companies` | Yes |
| GET | `/api/companies/:id` | Yes |
| POST | `/api/companies` | Yes |
| PUT | `/api/companies/:id` | Yes |
| DELETE | `/api/companies/:id` | Yes |

### Invoices
| Method | Endpoint | Auth Required |
|--------|----------|--------------|
| GET | `/api/invoices` | Yes |
| GET | `/api/invoices/:id` | Yes |
| GET | `/api/public/invoices/:id` | No |
| POST | `/api/invoices` | Yes |
| PUT | `/api/invoices/:id` | Yes |
| DELETE | `/api/invoices/:id` | Yes |
| GET | `/api/invoices/next-number` | Yes |

### Admin
| Method | Endpoint | Auth Required |
|--------|----------|--------------|
| GET | `/api/admin/users` | Admin |
| GET | `/api/admin/pending-users` | Admin |
| POST | `/api/admin/approve-user` | Admin |
| POST | `/api/admin/revoke-user` | Admin |
| POST | `/api/admin/delete-user` | Admin |
| GET | `/api/admin/check` | Yes |

### Settings
| Method | Endpoint | Auth Required |
|--------|----------|--------------|
| GET | `/api/theme-settings` | No |
| PUT | `/api/theme-settings` | Admin |
| GET | `/api/brand-settings` | No |
| PUT | `/api/brand-settings` | Admin |
| GET | `/api/profile` | Yes |
| GET | `/api/user-roles` | Yes |
