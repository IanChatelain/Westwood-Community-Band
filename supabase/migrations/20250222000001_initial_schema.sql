-- Westwood Community Band CMS: initial schema
-- Run this in Supabase SQL Editor or via Supabase CLI (supabase db push)

-- Role enum for profiles (matches src/types.ts UserRole)
CREATE TYPE app_role AS ENUM ('ADMIN', 'EDITOR', 'MEMBER', 'GUEST');

-- Single-row site settings (id = 1)
CREATE TABLE site_settings (
  id int PRIMARY KEY DEFAULT 1,
  band_name text NOT NULL DEFAULT 'Westwood Community Band',
  logo_url text NOT NULL DEFAULT '/treble-clef.svg',
  primary_color text NOT NULL DEFAULT '#991b1b',
  secondary_color text NOT NULL DEFAULT '#1e3a8a',
  footer_text text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Pages (sections and sidebar_blocks stored as JSONB)
CREATE TABLE pages (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  layout text NOT NULL DEFAULT 'full' CHECK (layout IN ('full', 'sidebar-left', 'sidebar-right')),
  sidebar_width int NOT NULL DEFAULT 25,
  sections jsonb NOT NULL DEFAULT '[]',
  sidebar_blocks jsonb,
  show_in_nav boolean DEFAULT true,
  nav_order int DEFAULT 999,
  nav_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles: one row per Supabase Auth user with app role (RBAC)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  role app_role NOT NULL DEFAULT 'GUEST',
  email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read for site_settings and pages (public site)
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read pages" ON pages FOR SELECT TO anon, authenticated USING (true);

-- Authenticated editors/admins can update site_settings and pages
CREATE POLICY "Editors update site_settings" ON site_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'EDITOR')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'EDITOR')));

CREATE POLICY "Editors manage pages" ON pages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'EDITOR')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'EDITOR')));

-- Profiles: users can read own; admins can read/update all (for Edit Rights)
CREATE POLICY "Users read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));
CREATE POLICY "Admins update profiles" ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));
-- Insert own profile (e.g. on first sign-up or via trigger)
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger to refresh updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Storage: Create bucket "cms-uploads" in Supabase Dashboard (Storage > New bucket):
-- Name: cms-uploads, Public: yes, File size limit: 5MB, Allowed MIME: image/jpeg, image/png, image/gif, image/webp.
-- Then add policies in Storage > Policies for bucket cms-uploads: public read; authenticated insert/update/delete.
