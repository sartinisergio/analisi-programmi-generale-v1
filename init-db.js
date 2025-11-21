import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- Estensione per UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabella Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin_materia', 'promotore', 'viewer')),
  materia text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies per profiles
DROP POLICY IF EXISTS "Super admin ha accesso completo ai profili" ON profiles;
CREATE POLICY "Super admin ha accesso completo ai profili"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Admin materia può vedere profili della sua materia" ON profiles;
CREATE POLICY "Admin materia può vedere profili della sua materia"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin_materia'
      AND p.materia = profiles.materia
    )
  );

DROP POLICY IF EXISTS "Utenti possono vedere il proprio profilo" ON profiles;
CREATE POLICY "Utenti possono vedere il proprio profilo"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Utenti possono aggiornare il proprio profilo" ON profiles;
CREATE POLICY "Utenti possono aggiornare il proprio profilo"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Tabella Analisi
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

-- Policies per analisi
DROP POLICY IF EXISTS "Super admin ha accesso completo alle analisi" ON analisi;
CREATE POLICY "Super admin ha accesso completo alle analisi"
  ON analisi FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Admin materia può vedere analisi della sua materia" ON analisi;
CREATE POLICY "Admin materia può vedere analisi della sua materia"
  ON analisi FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin_materia'
      AND p.materia = analisi.materia
    )
  );

DROP POLICY IF EXISTS "Admin materia può modificare analisi della sua materia" ON analisi;
CREATE POLICY "Admin materia può modificare analisi della sua materia"
  ON analisi FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin_materia'
      AND p.materia = analisi.materia
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin_materia'
      AND p.materia = analisi.materia
    )
  );

DROP POLICY IF EXISTS "Promotore può vedere le proprie analisi" ON analisi;
CREATE POLICY "Promotore può vedere le proprie analisi"
  ON analisi FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Promotore può creare analisi" ON analisi;
CREATE POLICY "Promotore può creare analisi"
  ON analisi FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('promotore', 'admin_materia', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Promotore può modificare le proprie analisi in bozza" ON analisi;
CREATE POLICY "Promotore può modificare le proprie analisi in bozza"
  ON analisi FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status = 'bozza'
  )
  WITH CHECK (
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Promotore può eliminare le proprie analisi in bozza" ON analisi;
CREATE POLICY "Promotore può eliminare le proprie analisi in bozza"
  ON analisi FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status = 'bozza'
  );

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_analisi_materia ON analisi(materia);
CREATE INDEX IF NOT EXISTS idx_analisi_created_by ON analisi(created_by);
CREATE INDEX IF NOT EXISTS idx_analisi_status ON analisi(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_materia ON profiles(materia);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analisi_updated_at ON analisi;
CREATE TRIGGER update_analisi_updated_at
  BEFORE UPDATE ON analisi
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

console.log('Inizializzazione database...');
console.log('URL:', supabaseUrl);

// Nota: Supabase JS client non supporta DDL direttamente
// Questo script stampa l'SQL che deve essere eseguito manualmente
console.log('\n=== SQL DA ESEGUIRE NEL DASHBOARD SUPABASE ===\n');
console.log(sql);
console.log('\n=== FINE SQL ===\n');
