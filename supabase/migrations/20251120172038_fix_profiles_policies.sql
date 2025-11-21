-- Rimuovi le policy esistenti per profiles
DROP POLICY IF EXISTS "Super admin accesso completo profili" ON profiles;
DROP POLICY IF EXISTS "Utenti vedono proprio profilo" ON profiles;

-- Policy corretta: permetti inserimento durante signup
CREATE POLICY "Consenti creazione profilo durante signup"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy per lettura del proprio profilo
CREATE POLICY "Utenti vedono proprio profilo"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy per super admin (senza ricorsione)
CREATE POLICY "Super admin vede tutti i profili"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Policy per aggiornamento
CREATE POLICY "Utenti aggiornano proprio profilo"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);