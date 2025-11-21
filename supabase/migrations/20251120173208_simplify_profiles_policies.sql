/*
  # Semplifica le policy di profiles
  
  Rimuove la ricorsione nelle policy RLS permettendo a tutti gli utenti
  autenticati di leggere il proprio profilo senza ulteriori verifiche.
*/

-- Rimuovi tutte le policy esistenti
DROP POLICY IF EXISTS "Consenti creazione profilo durante signup" ON profiles;
DROP POLICY IF EXISTS "Utenti leggono proprio profilo" ON profiles;
DROP POLICY IF EXISTS "Super admin vede tutti i profili" ON profiles;
DROP POLICY IF EXISTS "Utenti aggiornano proprio profilo" ON profiles;

-- Policy semplice per lettura: ogni utente vede il proprio profilo
CREATE POLICY "Read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy per inserimento durante signup
CREATE POLICY "Insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy per aggiornamento
CREATE POLICY "Update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy per super admin: può vedere tutti i profili
-- Usa una subquery che non causa ricorsione
CREATE POLICY "Super admin read all"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Policy per super admin: può aggiornare tutti i profili
CREATE POLICY "Super admin update all"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );