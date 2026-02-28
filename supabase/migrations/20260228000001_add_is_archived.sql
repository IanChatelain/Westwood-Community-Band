-- Add is_archived column to pages for non-public archive support
ALTER TABLE pages ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- Replace the old blanket public read policy with one that hides archived pages from anon
DROP POLICY IF EXISTS "Public read pages" ON pages;

CREATE POLICY "Anon read non-archived pages" ON pages
  FOR SELECT TO anon
  USING (is_archived = false);

CREATE POLICY "Authenticated read all pages" ON pages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'EDITOR')
    )
  );
