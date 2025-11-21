/*
  # Fix is_super_admin function to prevent recursive RLS loop

  1. Changes
    - Drop existing is_super_admin function with CASCADE
    - Recreate function with SECURITY DEFINER to bypass RLS
    - Recreate all dependent policies with correct column names
  
  2. Security
    - SECURITY DEFINER is safe here as it only reads the current user's own role
    - All policies are recreated with the same logic
*/

DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;

CREATE POLICY "Users read own or super admin reads all"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_super_admin());

CREATE POLICY "Users update own or super admin updates all"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_super_admin())
  WITH CHECK (auth.uid() = id OR is_super_admin());

CREATE POLICY "Super admin gestisce classi di laurea"
  ON classi_laurea FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admin gestisce manuali"
  ON manuali FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admin gestisce criteri"
  ON criteri_valutazione FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Utenti vedono propri programmi"
  ON programmi_corso FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_super_admin());

CREATE POLICY "Super admin gestisce tutti i programmi"
  ON programmi_corso FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Utenti vedono proprie analisi"
  ON analisi FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programmi_corso 
      WHERE programmi_corso.id = analisi.programma_corso_id 
      AND programmi_corso.created_by = auth.uid()
    ) OR is_super_admin()
  );

CREATE POLICY "Super admin gestisce analisi"
  ON analisi FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());
