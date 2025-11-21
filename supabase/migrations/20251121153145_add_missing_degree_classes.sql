/*
  # Add Missing Degree Classes

  1. New Entries
    - Add 9 missing degree classes that are referenced in materie_moduli_requisiti
    - Classes include: Biotechnology, Biological Sciences, Agricultural Sciences, etc.
  
  2. Details
    - All classes are set to 'triennale' (L-) or 'magistrale' (LM-) based on their code
    - Names are taken from the standard Italian university degree class nomenclature
*/

INSERT INTO classi_laurea (codice, nome, tipo) VALUES
  ('L-2', 'Biotecnologie', 'triennale'),
  ('L-7', 'Ingegneria Civile e Ambientale', 'triennale'),
  ('L-13', 'Scienze Biologiche', 'triennale'),
  ('L-25', 'Scienze e Tecnologie Agrarie e Forestali', 'triennale'),
  ('L-26', 'Scienze e Tecnologie Alimentari', 'triennale'),
  ('L-29', 'Scienze e Tecnologie Farmaceutiche', 'triennale'),
  ('L-32', 'Scienze e Tecnologie per l''Ambiente e la Natura', 'triennale'),
  ('L-34', 'Scienze Geologiche', 'triennale'),
  ('LM-13', 'Farmacia e Farmacia Industriale', 'magistrale')
ON CONFLICT (codice) DO NOTHING;
