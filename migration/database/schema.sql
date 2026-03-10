-- ============================================
-- SM Elite Hajj Invoice System - Database Schema
-- PostgreSQL Compatible (No Supabase Dependencies)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ============================================
-- TABLES
-- ============================================

-- Users table (replaces Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    raw_user_meta_data JSONB DEFAULT '{}',
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tagline TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    website TEXT,
    thank_you_text TEXT DEFAULT 'Thank you for staying with us.',
    show_qr_code BOOLEAN DEFAULT true,
    footer_alignment TEXT DEFAULT 'center',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    notes TEXT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    vat_rate NUMERIC NOT NULL DEFAULT 0,
    vat_amount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    due_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice items table
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Installments table
CREATE TABLE public.installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Theme settings table
CREATE TABLE public.theme_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_color TEXT NOT NULL DEFAULT '#1e3a8a',
    secondary_color TEXT NOT NULL DEFAULT '#f3f4f6',
    accent_color TEXT NOT NULL DEFAULT '#0f766e',
    header_text_color TEXT NOT NULL DEFAULT '#1e3a8a',
    invoice_title_color TEXT NOT NULL DEFAULT '#1e3a8a',
    subtotal_text_color TEXT NOT NULL DEFAULT '#374151',
    paid_text_color TEXT NOT NULL DEFAULT '#15803d',
    balance_bg_color TEXT NOT NULL DEFAULT '#166534',
    balance_text_color TEXT NOT NULL DEFAULT '#ffffff',
    table_header_bg TEXT NOT NULL DEFAULT '#f9fafb',
    table_header_text TEXT NOT NULL DEFAULT '#374151',
    border_color TEXT NOT NULL DEFAULT '#e5e7eb',
    badge_paid_color TEXT NOT NULL DEFAULT '#16a34a',
    badge_partial_color TEXT NOT NULL DEFAULT '#f59e0b',
    badge_unpaid_color TEXT NOT NULL DEFAULT '#dc2626',
    footer_text_color TEXT NOT NULL DEFAULT '#6b7280',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Global brand settings table
CREATE TABLE public.global_brand_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'S M Elite Hajj Limited',
    company_logo TEXT,
    tagline TEXT DEFAULT 'Excellence in Every Step',
    address_line1 TEXT DEFAULT 'B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340',
    address_line2 TEXT,
    phone TEXT DEFAULT '+8801867666888',
    email TEXT DEFAULT 'info@smelitehajj.com',
    website TEXT DEFAULT 'www.smelitehajj.com',
    thank_you_text TEXT DEFAULT 'Thank you for staying with us.',
    show_qr_code BOOLEAN NOT NULL DEFAULT true,
    footer_alignment TEXT NOT NULL DEFAULT 'center',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
