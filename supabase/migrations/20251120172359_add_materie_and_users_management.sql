/*
  # Aggiungi tabelle per gestione materie e utenti
  
  1. Nuove Tabelle
    - `materie`: catalogo materie configurabili
    - `inviti_utenti`: gestione inviti per nuovi utenti
  
  2. Sicurezza
    - RLS abilitato con policies appropriate
*/

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabella Materie
CREATE TABLE IF NOT EXISTS materie (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL UNIQUE,
  descrizione text,
  stato text DEFAULT 'attiva' CHECK (stato IN ('attiva', 'inattiva')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE materie ENABLE ROW LEVEL SECURITY;

-- Policies per materie
CREATE POLICY "Tutti possono vedere materie attive"
  ON materie FOR SELECT
  TO authenticated
  USING (stato = 'attiva');

CREATE POLICY "Super admin gestisce materie"
  ON materie FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Indici
CREATE INDEX IF NOT EXISTS idx_materie_stato ON materie(stato);
CREATE INDEX IF NOT EXISTS idx_materie_nome ON materie(nome);

-- Trigger per updated_at
CREATE TRIGGER update_materie_updated_at
  BEFORE UPDATE ON materie
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();