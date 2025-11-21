/*
  # Add descrizione_generale field to valutazione_programma

  No structural changes needed - the valutazione_programma field is already jsonb 
  and can contain any structure. This migration is just a marker to document 
  that we now expect the valutazione_programma json to include:
  - descrizione_generale: string (200+ words general description of the program)
  - obiettivi_formativi: string (100+ words detailed description of learning objectives)
  - Note fields increased from 3-5 lines to 5-8 lines for more detailed analysis
*/

-- No actual SQL changes needed since valutazione_programma is already jsonb
SELECT 1;
