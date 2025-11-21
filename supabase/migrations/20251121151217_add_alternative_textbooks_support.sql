/*
  # Supporto per manuali alternativi

  1. Modifiche alla tabella `programmi_corso`
    - Aggiunta colonna `manuali_alternativi` per memorizzare una lista di manuali alternativi (JSONB array)

  2. Note
    - Il campo accetta un array di stringhe con i nomi dei manuali alternativi
    - Esempio: ["Manuale 2", "Manuale 3"]
*/

-- Add manuali_alternativi column to programmi_corso
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programmi_corso' AND column_name = 'manuali_alternativi'
  ) THEN
    ALTER TABLE programmi_corso ADD COLUMN manuali_alternativi jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;