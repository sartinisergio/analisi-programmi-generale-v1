/*
  # Fix RLS Policies for Super Admin
  
  ## Overview
  Updates all RLS policies to accept both 'admin' and 'super_admin' roles.
  The current user has role 'super_admin' but policies only check for 'admin'.
  
  ## Changes
  - Update all policies on materie_matrici to accept super_admin
  - Update all policies on materie_moduli to accept super_admin
  - Update all policies on materie_moduli_requisiti to accept super_admin
  
  ## Security
  Super admins now have same permissions as admins for matrix management.
*/

-- Update policies for materie_matrici
DROP POLICY IF EXISTS "Admin can view all matrices" ON materie_matrici;
DROP POLICY IF EXISTS "Admin can insert matrices" ON materie_matrici;
DROP POLICY IF EXISTS "Admin can update matrices" ON materie_matrici;
DROP POLICY IF EXISTS "Admin can delete matrices" ON materie_matrici;

CREATE POLICY "Admin can view all matrices"
  ON materie_matrici FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert matrices"
  ON materie_matrici FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update matrices"
  ON materie_matrici FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete matrices"
  ON materie_matrici FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Update policies for materie_moduli
DROP POLICY IF EXISTS "Admin can view all modules" ON materie_moduli;
DROP POLICY IF EXISTS "Admin can insert modules" ON materie_moduli;
DROP POLICY IF EXISTS "Admin can update modules" ON materie_moduli;
DROP POLICY IF EXISTS "Admin can delete modules" ON materie_moduli;

CREATE POLICY "Admin can view all modules"
  ON materie_moduli FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert modules"
  ON materie_moduli FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update modules"
  ON materie_moduli FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete modules"
  ON materie_moduli FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Update policies for materie_moduli_requisiti
DROP POLICY IF EXISTS "Admin can view all requirements" ON materie_moduli_requisiti;
DROP POLICY IF EXISTS "Admin can insert requirements" ON materie_moduli_requisiti;
DROP POLICY IF EXISTS "Admin can update requirements" ON materie_moduli_requisiti;
DROP POLICY IF EXISTS "Admin can delete requirements" ON materie_moduli_requisiti;

CREATE POLICY "Admin can view all requirements"
  ON materie_moduli_requisiti FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can insert requirements"
  ON materie_moduli_requisiti FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can update requirements"
  ON materie_moduli_requisiti FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete requirements"
  ON materie_moduli_requisiti FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
