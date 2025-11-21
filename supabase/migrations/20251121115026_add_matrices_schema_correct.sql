/*
  # Add Matrices Schema for Multi-Class Support

  ## Overview
  Adds comprehensive schema for managing subject matrices with multi-class degree requirements.
  Each matrix contains modules (topics) with specific requirements per degree class.

  ## New Tables
  
  ### `materie_matrici`
  - `id` (uuid, primary key)
  - `materia_id` (uuid, foreign key to materie)
  - `nome` (text) - Matrix name/version
  - `descrizione` (text) - Description
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `materie_moduli`
  - `id` (uuid, primary key)
  - `matrice_id` (uuid, foreign key to materie_matrici)
  - `nome_modulo` (text) - Module/topic name
  - `ordine` (integer) - Display order
  - `created_at` (timestamptz)
  
  ### `materie_moduli_requisiti`
  - `id` (uuid, primary key)
  - `modulo_id` (uuid, foreign key to materie_moduli)
  - `classe_laurea_codice` (text) - Degree class code
  - `livello` (integer) - Importance level 1-10
  - `descrizione_contestuale` (text) - Contextual description
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Admin users can manage all matrices
  - Promotori can read matrices
*/

-- Create materie_matrici table
CREATE TABLE IF NOT EXISTS materie_matrici (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id uuid REFERENCES materie(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descrizione text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create materie_moduli table
CREATE TABLE IF NOT EXISTS materie_moduli (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matrice_id uuid REFERENCES materie_matrici(id) ON DELETE CASCADE,
  nome_modulo text NOT NULL,
  ordine integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create materie_moduli_requisiti table
CREATE TABLE IF NOT EXISTS materie_moduli_requisiti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid REFERENCES materie_moduli(id) ON DELETE CASCADE,
  classe_laurea_codice text NOT NULL,
  livello integer NOT NULL CHECK (livello >= 1 AND livello <= 10),
  descrizione_contestuale text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(modulo_id, classe_laurea_codice)
);

-- Enable RLS
ALTER TABLE materie_matrici ENABLE ROW LEVEL SECURITY;
ALTER TABLE materie_moduli ENABLE ROW LEVEL SECURITY;
ALTER TABLE materie_moduli_requisiti ENABLE ROW LEVEL SECURITY;

-- RLS Policies for materie_matrici
CREATE POLICY "Admin can manage all matrices"
  ON materie_matrici FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Promotori can read matrices"
  ON materie_matrici FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'promotore')
    )
  );

-- RLS Policies for materie_moduli
CREATE POLICY "Admin can manage all modules"
  ON materie_moduli FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Promotori can read modules"
  ON materie_moduli FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'promotore')
    )
  );

-- RLS Policies for materie_moduli_requisiti
CREATE POLICY "Admin can manage all requirements"
  ON materie_moduli_requisiti FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Promotori can read requirements"
  ON materie_moduli_requisiti FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'promotore')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_materie_matrici_materia_id ON materie_matrici(materia_id);
CREATE INDEX IF NOT EXISTS idx_materie_moduli_matrice_id ON materie_moduli(matrice_id);
CREATE INDEX IF NOT EXISTS idx_materie_moduli_requisiti_modulo_id ON materie_moduli_requisiti(modulo_id);
CREATE INDEX IF NOT EXISTS idx_materie_moduli_requisiti_classe ON materie_moduli_requisiti(classe_laurea_codice);