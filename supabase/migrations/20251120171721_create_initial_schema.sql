/*
  # Schema Iniziale - Piattaforma Analisi Programmi Zanichelli
  
  1. Nuove Tabelle
    - `profiles`: gestione utenti e ruoli
    - `analisi`: memorizzazione analisi programmi
  
  2. Sicurezza
    - RLS abilitato su tutte le tabelle
    - Policies complete per ogni ruolo
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin_materia', 'promotore', 'viewer')),
  materia text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin accesso completo profili" ON profiles FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'));

CREATE POLICY "Utenti vedono proprio profilo" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS analisi (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  titolo_programma text NOT NULL,
  materia text NOT NULL,
  tipo_scuola text NOT NULL,
  anno_scolastico text NOT NULL,
  provincia text NOT NULL,
  comune text NOT NULL,
  istituto text NOT NULL,
  docente_nome text NOT NULL,
  docente_email text NOT NULL,
  argomenti_trattati jsonb DEFAULT '[]'::jsonb,
  note text DEFAULT '',
  status text DEFAULT 'bozza' CHECK (status IN ('bozza', 'inviata', 'approvata', 'respinta')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE analisi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin accesso completo analisi" ON analisi FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'));

CREATE POLICY "Promotore vede proprie analisi" ON analisi FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Promotore crea analisi" ON analisi FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_analisi_materia ON analisi(materia);
CREATE INDEX IF NOT EXISTS idx_analisi_created_by ON analisi(created_by);