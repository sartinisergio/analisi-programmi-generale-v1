/*
  # Fix profiles read policy
  
  Permetti a tutti gli utenti autenticati di leggere il proprio profilo
  senza restrizioni aggiuntive.
*/

-- Rimuovi la policy esistente
DROP POLICY IF EXISTS "Utenti vedono proprio profilo" ON profiles;

-- Crea una policy più semplice per la lettura del proprio profilo
CREATE POLICY "Utenti leggono proprio profilo"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);