-- Contact form submissions
CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  subject text,
  message text NOT NULL,
  recipient_label text NOT NULL,
  recipient_id text NOT NULL,
  user_agent text,
  remote_ip text
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public (anon) can submit the form but not read
CREATE POLICY "Public submit contact form" ON contact_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admins can read/manage messages
CREATE POLICY "Admins read contact messages" ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins manage contact messages" ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins delete contact messages" ON contact_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

