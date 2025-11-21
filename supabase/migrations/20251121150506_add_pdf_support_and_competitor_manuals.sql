/*
  # Aggiunta supporto PDF e manuali competitor

  1. Modifiche alla tabella `programmi_corso`
    - Aggiunta colonna `pdf_programma_url` per caricare il PDF del programma

  2. Modifiche alla tabella `manuali`
    - Aggiunta colonna `pdf_indice_url` per caricare il PDF dell'indice
    - Aggiunta colonna `tipo` per distinguere Zanichelli da Competitor
    - Rimossi campi obsoleti: `isbn`, `edizione`, `anno_pubblicazione`, `descrizione`

  3. Security
    - Mantenute le policy RLS esistenti
*/

-- Add PDF support to programmi_corso
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programmi_corso' AND column_name = 'pdf_programma_url'
  ) THEN
    ALTER TABLE programmi_corso ADD COLUMN pdf_programma_url text;
  END IF;
END $$;

-- Add tipo column to manuali to distinguish Zanichelli vs Competitor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manuali' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE manuali ADD COLUMN tipo text DEFAULT 'zanichelli' CHECK (tipo IN ('zanichelli', 'competitor'));
  END IF;
END $$;

-- Add pdf_indice_url to manuali
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manuali' AND column_name = 'pdf_indice_url'
  ) THEN
    ALTER TABLE manuali ADD COLUMN pdf_indice_url text;
  END IF;
END $$;

-- Drop obsolete columns from manuali (only if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manuali' AND column_name = 'isbn'
  ) THEN
    ALTER TABLE manuali DROP COLUMN isbn;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manuali' AND column_name = 'edizione'
  ) THEN
    ALTER TABLE manuali DROP COLUMN edizione;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manuali' AND column_name = 'anno_pubblicazione'
  ) THEN
    ALTER TABLE manuali DROP COLUMN anno_pubblicazione;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manuali' AND column_name = 'descrizione'
  ) THEN
    ALTER TABLE manuali DROP COLUMN descrizione;
  END IF;
END $$;