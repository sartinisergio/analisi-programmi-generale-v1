/*
  # Add Complete Ministerial Degree Classification

  1. Overview
    - Adds all Italian ministerial degree classes (Classi di Laurea)
    - Includes all triennale classes (L-1 to L-43)
    - Includes all magistrale a ciclo unico classes (LMG, LMCU)
  
  2. Schema Changes
    - Updates tipo check constraint to include 'magistrale_ciclo_unico'
  
  3. Classification Details
    - Triennale (L-): 43 classes covering all undergraduate programs
    - Magistrale a ciclo unico (LMG/LMCU): 6 classes for 5-6 year programs
  
  4. Data Source
    - Based on official MIUR classification
    - Names are official Italian degree class names
*/

-- Drop existing check constraint
ALTER TABLE classi_laurea DROP CONSTRAINT IF EXISTS classi_laurea_tipo_check;

-- Add new check constraint with magistrale_ciclo_unico
ALTER TABLE classi_laurea ADD CONSTRAINT classi_laurea_tipo_check 
  CHECK (tipo IN ('triennale', 'magistrale', 'magistrale_ciclo_unico'));

-- Clear existing data to avoid conflicts
TRUNCATE TABLE classi_laurea CASCADE;

-- Insert all Triennale classes (L-1 to L-43)
INSERT INTO classi_laurea (codice, nome, tipo) VALUES
  ('L-1', 'Beni Culturali', 'triennale'),
  ('L-2', 'Biotecnologie', 'triennale'),
  ('L-3', 'Discipline delle Arti Figurative, della Musica, dello Spettacolo e della Moda', 'triennale'),
  ('L-4', 'Disegno Industriale', 'triennale'),
  ('L-5', 'Filosofia', 'triennale'),
  ('L-6', 'Geografia', 'triennale'),
  ('L-7', 'Ingegneria Civile e Ambientale', 'triennale'),
  ('L-8', 'Ingegneria dell''Informazione', 'triennale'),
  ('L-9', 'Ingegneria Industriale', 'triennale'),
  ('L-10', 'Lettere', 'triennale'),
  ('L-11', 'Lingue e Culture Moderne', 'triennale'),
  ('L-12', 'Mediazione Linguistica', 'triennale'),
  ('L-13', 'Scienze Biologiche', 'triennale'),
  ('L-14', 'Scienze dei Servizi Giuridici', 'triennale'),
  ('L-15', 'Scienze del Turismo', 'triennale'),
  ('L-16', 'Scienze dell''Amministrazione e dell''Organizzazione', 'triennale'),
  ('L-17', 'Scienze dell''Architettura', 'triennale'),
  ('L-18', 'Scienze dell''Economia e della Gestione Aziendale', 'triennale'),
  ('L-19', 'Scienze dell''Educazione e della Formazione', 'triennale'),
  ('L-20', 'Scienze della Comunicazione', 'triennale'),
  ('L-21', 'Scienze della Pianificazione Territoriale, Urbanistica, Paesaggistica e Ambientale', 'triennale'),
  ('L-22', 'Scienze delle Attività Motorie e Sportive', 'triennale'),
  ('L-23', 'Scienze e Tecniche dell''Edilizia', 'triennale'),
  ('L-24', 'Scienze e Tecniche Psicologiche', 'triennale'),
  ('L-25', 'Scienze e Tecnologie Agrarie e Forestali', 'triennale'),
  ('L-26', 'Scienze e Tecnologie Alimentari', 'triennale'),
  ('L-27', 'Scienze e Tecnologie Chimiche', 'triennale'),
  ('L-28', 'Scienze e Tecnologie della Navigazione', 'triennale'),
  ('L-29', 'Scienze e Tecnologie Farmaceutiche', 'triennale'),
  ('L-30', 'Scienze e Tecnologie Fisiche', 'triennale'),
  ('L-31', 'Scienze e Tecnologie Informatiche', 'triennale'),
  ('L-32', 'Scienze e Tecnologie per l''Ambiente e la Natura', 'triennale'),
  ('L-33', 'Scienze Economiche', 'triennale'),
  ('L-34', 'Scienze Geologiche', 'triennale'),
  ('L-35', 'Scienze Matematiche', 'triennale'),
  ('L-36', 'Scienze Politiche e delle Relazioni Internazionali', 'triennale'),
  ('L-37', 'Scienze Sociali per la Cooperazione, lo Sviluppo e la Pace', 'triennale'),
  ('L-38', 'Scienze Zootecniche e Tecnologie delle Produzioni Animali', 'triennale'),
  ('L-39', 'Servizio Sociale', 'triennale'),
  ('L-40', 'Sociologia', 'triennale'),
  ('L-41', 'Statistica', 'triennale'),
  ('L-42', 'Storia', 'triennale'),
  ('L-43', 'Diagnostica per la Conservazione dei Beni Culturali', 'triennale'),

-- Insert Magistrale a Ciclo Unico classes
  ('LMG/01', 'Giurisprudenza', 'magistrale_ciclo_unico'),
  ('LM-41', 'Medicina e Chirurgia', 'magistrale_ciclo_unico'),
  ('LM-46', 'Odontoiatria e Protesi Dentaria', 'magistrale_ciclo_unico'),
  ('LM-4 c.u.', 'Architettura e Ingegneria Edile-Architettura', 'magistrale_ciclo_unico'),
  ('LM-85 bis', 'Scienze della Formazione Primaria', 'magistrale_ciclo_unico'),
  ('LM-13', 'Farmacia e Farmacia Industriale', 'magistrale_ciclo_unico');
