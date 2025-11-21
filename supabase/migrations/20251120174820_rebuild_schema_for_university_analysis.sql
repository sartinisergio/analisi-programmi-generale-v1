/*
  # Ricostruisci schema per analisi programmi universitari
  
  1. Elimina vecchia tabella analisi incompatibile
  2. Crea nuove tabelle:
    - `classi_laurea`: Classi di laurea ministeriali italiane
    - `manuali`: Catalogo manuali Zanichelli per materia
    - `programmi_corso`: Programmi dei corsi universitari inseriti
    - `analisi`: Analisi con matrici di valutazione e raccomandazioni
    - `criteri_valutazione`: Criteri di valutazione per ogni materia
  
  3. Sicurezza
    - RLS abilitato su tutte le tabelle
    - Policies appropriate per ogni ruolo
*/

-- Elimina vecchia tabella analisi
DROP TABLE IF EXISTS analisi CASCADE;

-- Tabella Classi di Laurea
CREATE TABLE IF NOT EXISTS classi_laurea (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  codice text NOT NULL UNIQUE,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('triennale', 'magistrale')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classi_laurea ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti possono vedere classi di laurea"
  ON classi_laurea FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin gestisce classi di laurea"
  ON classi_laurea FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Tabella Manuali Zanichelli
CREATE TABLE IF NOT EXISTS manuali (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  materia_id uuid REFERENCES materie(id) ON DELETE CASCADE NOT NULL,
  titolo text NOT NULL,
  autori text NOT NULL,
  isbn text,
  edizione text,
  anno_pubblicazione integer,
  descrizione text,
  topics_coperti jsonb DEFAULT '[]'::jsonb,
  livello text CHECK (livello IN ('base', 'intermedio', 'avanzato')),
  link_zanichelli text,
  stato text DEFAULT 'attivo' CHECK (stato IN ('attivo', 'inattivo', 'fuori_catalogo')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE manuali ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti possono vedere manuali attivi"
  ON manuali FOR SELECT
  TO authenticated
  USING (stato = 'attivo');

CREATE POLICY "Super admin gestisce manuali"
  ON manuali FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Tabella Criteri di Valutazione per Materia
CREATE TABLE IF NOT EXISTS criteri_valutazione (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  materia_id uuid REFERENCES materie(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  descrizione text,
  peso numeric(3,2) DEFAULT 1.0 CHECK (peso >= 0 AND peso <= 1),
  ordine integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE criteri_valutazione ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti possono vedere criteri"
  ON criteri_valutazione FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin gestisce criteri"
  ON criteri_valutazione FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Tabella Programmi Corso
CREATE TABLE IF NOT EXISTS programmi_corso (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  materia_id uuid REFERENCES materie(id) ON DELETE CASCADE NOT NULL,
  universita text NOT NULL,
  corso_laurea text NOT NULL,
  classe_laurea_id uuid REFERENCES classi_laurea(id) ON DELETE SET NULL,
  anno_accademico text NOT NULL,
  docente text,
  contenuto_programma text NOT NULL,
  manuale_attuale text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE programmi_corso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utenti vedono propri programmi"
  ON programmi_corso FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_super_admin());

CREATE POLICY "Utenti creano programmi"
  ON programmi_corso FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Super admin gestisce tutti i programmi"
  ON programmi_corso FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Tabella Analisi con Matrici di Valutazione
CREATE TABLE IF NOT EXISTS analisi (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  programma_corso_id uuid REFERENCES programmi_corso(id) ON DELETE CASCADE NOT NULL,
  conformita_ministeriale numeric(5,2) DEFAULT 0,
  obiettivi_coperti jsonb DEFAULT '[]'::jsonb,
  gap_analysis jsonb DEFAULT '[]'::jsonb,
  valutazioni_manuali jsonb DEFAULT '[]'::jsonb,
  manuale_raccomandato_id uuid REFERENCES manuali(id) ON DELETE SET NULL,
  confidence_score numeric(5,2) DEFAULT 0,
  note_analisi text,
  stato text DEFAULT 'in_elaborazione' CHECK (stato IN ('in_elaborazione', 'completata', 'errore')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE analisi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utenti vedono proprie analisi"
  ON analisi FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM programmi_corso 
      WHERE programmi_corso.id = analisi.programma_corso_id 
      AND (programmi_corso.created_by = auth.uid() OR is_super_admin())
    )
  );

CREATE POLICY "Sistema crea analisi"
  ON analisi FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admin gestisce analisi"
  ON analisi FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_manuali_materia ON manuali(materia_id);
CREATE INDEX IF NOT EXISTS idx_criteri_materia ON criteri_valutazione(materia_id);
CREATE INDEX IF NOT EXISTS idx_programmi_materia ON programmi_corso(materia_id);
CREATE INDEX IF NOT EXISTS idx_programmi_created_by ON programmi_corso(created_by);
CREATE INDEX IF NOT EXISTS idx_analisi_programma ON analisi(programma_corso_id);
CREATE INDEX IF NOT EXISTS idx_analisi_manuale ON analisi(manuale_raccomandato_id);

-- Trigger per updated_at
CREATE TRIGGER update_manuali_updated_at
  BEFORE UPDATE ON manuali
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_criteri_updated_at
  BEFORE UPDATE ON criteri_valutazione
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programmi_updated_at
  BEFORE UPDATE ON programmi_corso
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analisi_updated_at
  BEFORE UPDATE ON analisi
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();