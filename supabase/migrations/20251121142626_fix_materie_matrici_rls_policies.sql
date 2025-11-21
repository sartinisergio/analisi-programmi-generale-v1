/*
  # Fix Materie Matrici RLS Policies

  ## Overview
  Fixes Row Level Security policies for the matrices schema tables.
  The issue was using both FOR ALL and FOR SELECT policies, which created conflicts.
  
  ## Changes
  - Drop existing conflicting policies
  - Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
  - Admin has full access to all operations
  - Promotori have read-only access (SELECT only)
  
  ## Security
  All three tables now have proper RLS policies:
  - `materie_matrici`
  - `materie_moduli`
  - `materie_moduli_requisiti`
*/

-- Drop existing policies for materie_matrici
DROP POLICY IF EXISTS "Admin can manage all matrices" ON materie_matrici;
DROP POLICY IF EXISTS "Promotori can read matrices" ON materie_matrici;

-- Create new policies for materie_matrici
CREATE POLICY "Admin can view all matrices"
  ON materie_matrici FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert matrices"
  ON materie_matrici FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update matrices"
  ON materie_matrici FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete matrices"
  ON materie_matrici FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Promotori can view matrices"
  ON materie_matrici FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'promotore'
    )
  );

-- Drop existing policies for materie_moduli
DROP POLICY IF EXISTS "Admin can manage all modules" ON materie_moduli;
DROP POLICY IF EXISTS "Promotori can read modules" ON materie_moduli;

-- Create new policies for materie_moduli
CREATE POLICY "Admin can view all modules"
  ON materie_moduli FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert modules"
  ON materie_moduli FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update modules"
  ON materie_moduli FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete modules"
  ON materie_moduli FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Promotori can view modules"
  ON materie_moduli FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'promotore'
    )
  );

-- Drop existing policies for materie_moduli_requisiti
DROP POLICY IF EXISTS "Admin can manage all requirements" ON materie_moduli_requisiti;
DROP POLICY IF EXISTS "Promotori can read requirements" ON materie_moduli_requisiti;

-- Create new policies for materie_moduli_requisiti
CREATE POLICY "Admin can view all requirements"
  ON materie_moduli_requisiti FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert requirements"
  ON materie_moduli_requisiti FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update requirements"
  ON materie_moduli_requisiti FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete requirements"
  ON materie_moduli_requisiti FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Promotori can view requirements"
  ON materie_moduli_requisiti FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'promotore'
    )
  );
