/*
  # Update analisi table schema for matrix-based evaluation

  1. Changes
    - Remove obsolete `conformita_ministeriale`, `obiettivi_coperti`, `gap_analysis` columns
    - Add `valutazione_programma` jsonb column for program evaluation against matrix
    - Keep `valutazioni_manuali` for manual evaluations
    - Add `motivazione_raccomandazione` text column for detailed recommendation

  2. Structure
    - valutazione_programma: stores program evaluation with criteria scores
    - valutazioni_manuali: stores manual evaluations with gap analysis
    - motivazione_raccomandazione: detailed recommendation text for Zanichelli manual
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analisi' AND column_name = 'valutazione_programma'
  ) THEN
    ALTER TABLE analisi ADD COLUMN valutazione_programma jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analisi' AND column_name = 'motivazione_raccomandazione'
  ) THEN
    ALTER TABLE analisi ADD COLUMN motivazione_raccomandazione text;
  END IF;
END $$;

-- Remove obsolete columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analisi' AND column_name = 'conformita_ministeriale'
  ) THEN
    ALTER TABLE analisi DROP COLUMN conformita_ministeriale;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analisi' AND column_name = 'obiettivi_coperti'
  ) THEN
    ALTER TABLE analisi DROP COLUMN obiettivi_coperti;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analisi' AND column_name = 'gap_analysis'
  ) THEN
    ALTER TABLE analisi DROP COLUMN gap_analysis;
  END IF;
END $$;
