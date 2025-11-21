/*
  # Aggiungi campo editore alla tabella manuali

  1. Modifiche
    - Aggiungi colonna `editore` (text) alla tabella `manuali`
    - Il campo è opzionale per mantenere compatibilità con dati esistenti
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manuali' AND column_name = 'editore'
  ) THEN
    ALTER TABLE manuali ADD COLUMN editore text;
  END IF;
END $$;
