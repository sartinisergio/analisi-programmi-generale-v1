/*
  # Fix profiles RLS policies properly
  
  Ricrea le policy RLS in modo corretto evitando loop ricorsivi.
  La chiave è usare una funzione che controlla il role direttamente
  senza passare attraverso altre policy.
*/

-- Riabilita RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Rimuovi tutte le policy esistenti
DROP POLICY IF EXISTS "Read own profile" ON profiles;
DROP POLICY IF EXISTS "Insert own profile" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admin read all" ON profiles;
DROP POLICY IF EXISTS "Super admin update all" ON profiles;

-- Crea una funzione che controlla se l'utente è super admin
-- Questa funzione usa SECURITY DEFINER per bypassare RLS
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
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

-- Policy per lettura: utente vede proprio profilo O è super admin
CREATE POLICY "Users read own or super admin reads all"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR is_super_admin()
  );

-- Policy per inserimento durante signup
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy per aggiornamento: utente aggiorna proprio profilo O super admin aggiorna tutti
CREATE POLICY "Users update own or super admin updates all"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR is_super_admin()
  )
  WITH CHECK (
    auth.uid() = id OR is_super_admin()
  );