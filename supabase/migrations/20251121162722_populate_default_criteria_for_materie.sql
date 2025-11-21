/*
  # Populate Default Evaluation Criteria for Materie

  1. Overview
    - Adds default evaluation criteria (Opzione 2) for all 5 subjects
    - Criteria differentiate between scientific subjects and economic subjects
    - Weights are expressed as decimals (0.30 = 30%, 0.25 = 25%, etc.)
    
  2. Subjects and Criteria
    
    **Scientific Subjects (Chimica generale, Chimica organica, Fisica generale, Matematica):**
    - Presenza di formule e dimostrazioni (weight: 0.30 = 30%, order: 1)
    - Quantità di esercizi (weight: 0.25 = 25%, order: 2)
    - Presenza di grafici e tabelle (weight: 0.20 = 20%, order: 3)
    - Chiarezza espositiva (weight: 0.15 = 15%, order: 4)
    - Presenza di esempi pratici (weight: 0.10 = 10%, order: 5)
    
    **Economic Subject (Economia politica):**
    - Presenza di modelli matematici (weight: 0.25 = 25%, order: 1)
    - Approfondimento teorico (weight: 0.25 = 25%, order: 2)
    - Presenza di grafici e tabelle (weight: 0.20 = 20%, order: 3)
    - Chiarezza espositiva (weight: 0.15 = 15%, order: 4)
    - Presenza di esempi e casi di studio (weight: 0.15 = 15%, order: 5)
    
  3. Notes
    - Weights sum to 1.00 (100%) for each subject
    - Peso column has precision 3, scale 2 (max value 9.99)
    - Criteria reflect the analytical nature of these disciplines
    - Order determines display sequence in UI
*/

-- Insert criteria for Chimica generale
INSERT INTO criteri_valutazione (materia_id, nome, peso, ordine)
SELECT 
  id,
  criterio.nome,
  criterio.peso,
  criterio.ordine
FROM materie,
LATERAL (VALUES
  ('Presenza di formule e dimostrazioni', 0.30, 1),
  ('Quantità di esercizi', 0.25, 2),
  ('Presenza di grafici e tabelle', 0.20, 3),
  ('Chiarezza espositiva', 0.15, 4),
  ('Presenza di esempi pratici', 0.10, 5)
) AS criterio(nome, peso, ordine)
WHERE materie.nome = 'Chimica generale';

-- Insert criteria for Chimica organica
INSERT INTO criteri_valutazione (materia_id, nome, peso, ordine)
SELECT 
  id,
  criterio.nome,
  criterio.peso,
  criterio.ordine
FROM materie,
LATERAL (VALUES
  ('Presenza di formule e dimostrazioni', 0.30, 1),
  ('Quantità di esercizi', 0.25, 2),
  ('Presenza di grafici e tabelle', 0.20, 3),
  ('Chiarezza espositiva', 0.15, 4),
  ('Presenza di esempi pratici', 0.10, 5)
) AS criterio(nome, peso, ordine)
WHERE materie.nome = 'Chimica organica';

-- Insert criteria for Fisica generale
INSERT INTO criteri_valutazione (materia_id, nome, peso, ordine)
SELECT 
  id,
  criterio.nome,
  criterio.peso,
  criterio.ordine
FROM materie,
LATERAL (VALUES
  ('Presenza di formule e dimostrazioni', 0.30, 1),
  ('Quantità di esercizi', 0.25, 2),
  ('Presenza di grafici e tabelle', 0.20, 3),
  ('Chiarezza espositiva', 0.15, 4),
  ('Presenza di esempi pratici', 0.10, 5)
) AS criterio(nome, peso, ordine)
WHERE materie.nome = 'Fisica generale';

-- Insert criteria for Matematica
INSERT INTO criteri_valutazione (materia_id, nome, peso, ordine)
SELECT 
  id,
  criterio.nome,
  criterio.peso,
  criterio.ordine
FROM materie,
LATERAL (VALUES
  ('Presenza di formule e dimostrazioni', 0.30, 1),
  ('Quantità di esercizi', 0.25, 2),
  ('Presenza di grafici e tabelle', 0.20, 3),
  ('Chiarezza espositiva', 0.15, 4),
  ('Presenza di esempi pratici', 0.10, 5)
) AS criterio(nome, peso, ordine)
WHERE materie.nome = 'Matematica';

-- Insert criteria for Economia politica (different criteria for economics)
INSERT INTO criteri_valutazione (materia_id, nome, peso, ordine)
SELECT 
  id,
  criterio.nome,
  criterio.peso,
  criterio.ordine
FROM materie,
LATERAL (VALUES
  ('Presenza di modelli matematici', 0.25, 1),
  ('Approfondimento teorico', 0.25, 2),
  ('Presenza di grafici e tabelle', 0.20, 3),
  ('Chiarezza espositiva', 0.15, 4),
  ('Presenza di esempi e casi di studio', 0.15, 5)
) AS criterio(nome, peso, ordine)
WHERE materie.nome = 'Economia politica';
