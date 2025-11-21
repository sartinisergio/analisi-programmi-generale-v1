import { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MatriceViewer } from './MatriceViewer';

interface Materia {
  id: string;
  nome: string;
}

interface Matrice {
  id: string;
  materia_id: string;
  nome: string;
  descrizione: string;
  created_at: string;
}

interface Modulo {
  id: string;
  nome_modulo: string;
  ordine: number;
}

interface Requisito {
  classe_laurea_codice: string;
  livello: number;
  descrizione_contestuale: string;
}

export default function MatriciManager() {
  const [materie, setMaterie] = useState<Materia[]>([]);
  const [matrici, setMatrici] = useState<Matrice[]>([]);
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pastedData, setPastedData] = useState<string>('');
  const [showNewMatrixForm, setShowNewMatrixForm] = useState(false);
  const [newMatrixName, setNewMatrixName] = useState('');
  const [newMatrixDesc, setNewMatrixDesc] = useState('');
  const [viewingMatriceId, setViewingMatriceId] = useState<string | null>(null);

  useEffect(() => {
    loadMaterie();
  }, []);

  useEffect(() => {
    if (selectedMateriaId) {
      loadMatrici(selectedMateriaId);
    }
  }, [selectedMateriaId]);

  const loadMaterie = async () => {
    const { data, error } = await supabase
      .from('materie')
      .select('id, nome')
      .order('nome');

    if (error) {
      console.error('Error loading materie:', error);
      return;
    }

    setMaterie(data || []);
  };

  const loadMatrici = async (materiaId: string) => {
    const { data, error } = await supabase
      .from('materie_matrici')
      .select('*')
      .eq('materia_id', materiaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading matrici:', error);
      return;
    }

    setMatrici(data || []);
  };

  const parseTabDelimitedData = (text: string): { moduli: Array<{ nome: string; ordine: number; requisiti: Requisito[] }> } => {
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('Dati troppo corti o malformati');
    }

    const rows = lines.map(line => line.split('\t'));
    let headers = rows[0].map(h => h.trim());

    console.log('RAW HEADERS PRIMA DI TUTTO:', headers);
    console.log('NUMERO TOTALE HEADERS:', headers.length);
    console.log('PRIMA RIGA DATI:', rows[1]);

    if (headers[0].includes(',')) {
      const parts = headers[0].split(',').map(p => p.trim());
      headers = [...parts, ...headers.slice(1)];
    }

    console.log('Headers completi:', headers);

    let moduloColIndex = 0;
    let sottomoduloColIndex = -1;
    let dataStartIndex = 1;

    const firstHeaderLower = headers[0].toLowerCase();
    if (firstHeaderLower.includes('modulo')) {
      const secondHeaderLower = headers[1]?.toLowerCase() || '';
      if (secondHeaderLower.includes('sotto') || secondHeaderLower.includes('modulo')) {
        console.log('Rilevato formato con colonne separate: Modulo + Sottomodulo');
        moduloColIndex = 0;
        sottomoduloColIndex = 1;
        dataStartIndex = 2;
      }
    }

    const classiLaureaHeaders: string[] = [];
    const classiLaureaIndices: number[] = [];

    for (let i = dataStartIndex; i < headers.length; i++) {
      const h = headers[i];
      const lower = h.toLowerCase();

      console.log(`Header ${i}: "${h}" (lower: "${lower}")`);

      if (lower.includes('livello') || lower.includes('significato') || lower.includes('scala') || lower.includes('note')) {
        console.log('  -> STOP: trovata colonna legenda');
        break;
      }

      const matchL = h.match(/^L-\d+/);
      const matchLM = h.match(/^LM/);
      const hasModulo = h.toLowerCase().match(/modulo|sotto/);

      console.log(`  -> Match L-XX: ${!!matchL}, Match LM: ${!!matchLM}, Has modulo: ${!!hasModulo}`);

      if (h && h.length > 0 && (matchL || matchLM || !hasModulo)) {
        console.log(`  -> AGGIUNTO come classe di laurea`);
        classiLaureaHeaders.push(h);
        classiLaureaIndices.push(i);
      } else {
        console.log(`  -> SALTATO`);
      }
    }

    console.log('Colonne dati riconosciute:', classiLaureaHeaders);
    console.log('Indici colonne:', classiLaureaIndices);

    const moduli: Array<{ nome: string; ordine: number; requisiti: Requisito[] }> = [];
    let ordine = 0;

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].map(c => c.trim());

      const firstCell = cells[0] || '';
      if (firstCell.toLowerCase().includes('livello') || firstCell.toLowerCase().includes('significato')) {
        console.log('Fermato alla riga legenda');
        break;
      }

      let nomeModulo = cells[moduloColIndex] || '';

      if (sottomoduloColIndex >= 0) {
        const sottomodulo = cells[sottomoduloColIndex] || '';
        if (sottomodulo) {
          nomeModulo = nomeModulo ? `${nomeModulo} - ${sottomodulo}` : sottomodulo;
        }
      }

      if (!nomeModulo) continue;

      const requisiti: Requisito[] = [];

      for (let j = 0; j < classiLaureaIndices.length; j++) {
        const cellIndex = classiLaureaIndices[j];
        const cellValue = cells[cellIndex] || '';

        if (!cellValue) continue;

        if (cellValue.length > 200) {
          console.log(`  Cella [${classiLaureaHeaders[j]}]: "${cellValue.substring(0, 50)}..." (lunghezza: ${cellValue.length})`);
        }

        const cleanValue = cellValue.replace(/^["'\s]+|["'\s]+$/g, '');

        const patterns = [
          /^(\d+)\s*[-–—:]\s*(.+)$/,
          /^(\d+)\s+[-–—]\s*(.+)$/,
          /^(\d+)\.\s*(.+)$/,
          /^(\d+)\s{2,}(.+)$/,
          /^(\d+)\s+(.+)$/
        ];

        let matched = false;
        for (const pattern of patterns) {
          const match = cleanValue.match(pattern);
          if (match) {
            const livello = parseInt(match[1]);
            const descrizione = match[2].trim();

            if (livello >= 1 && livello <= 10 && descrizione.length > 0) {
              requisiti.push({
                classe_laurea_codice: classiLaureaHeaders[j],
                livello,
                descrizione_contestuale: descrizione
              });
              matched = true;
              break;
            }
          }
        }

        if (!matched && cleanValue.length < 100) {
          console.log(`  ✗ NON riconosciuto in [${classiLaureaHeaders[j]}]: "${cleanValue}"`);
        }
      }

      if (requisiti.length > 0) {
        console.log(`Modulo "${nomeModulo}": ${requisiti.length} requisiti trovati`);
        moduli.push({
          nome: nomeModulo,
          ordine: ordine++,
          requisiti
        });
      } else {
        console.log(`Modulo "${nomeModulo}": nessun requisito trovato`);
      }
    }

    console.log(`Totale moduli trovati: ${moduli.length}`);
    return { moduli };
  };

  const handleDataUpload = async () => {
    if (!pastedData.trim() || !selectedMateriaId || !newMatrixName.trim()) {
      alert('Seleziona una materia, inserisci un nome e incolla i dati da Excel');
      return;
    }

    setLoading(true);

    try {
      console.log('DATI INCOLLATI PRIME 500 CARATTERI:', pastedData.substring(0, 500));
      console.log('DATI LENGTH:', pastedData.length);

      const { moduli } = parseTabDelimitedData(pastedData);

      if (moduli.length === 0) {
        throw new Error('Nessun modulo valido trovato. Verifica il formato dei dati.');
      }

      const { data: matrice, error: matriceError } = await supabase
        .from('materie_matrici')
        .insert({
          materia_id: selectedMateriaId,
          nome: newMatrixName.trim(),
          descrizione: newMatrixDesc.trim() || null
        })
        .select()
        .single();

      if (matriceError) throw matriceError;

      for (const modulo of moduli) {
        const { data: moduloData, error: moduloError } = await supabase
          .from('materie_moduli')
          .insert({
            matrice_id: matrice.id,
            nome_modulo: modulo.nome,
            ordine: modulo.ordine
          })
          .select()
          .single();

        if (moduloError) throw moduloError;

        const requisitiToInsert = modulo.requisiti.map(req => ({
          modulo_id: moduloData.id,
          classe_laurea_codice: req.classe_laurea_codice,
          livello: req.livello,
          descrizione_contestuale: req.descrizione_contestuale
        }));

        const { error: requisitiError } = await supabase
          .from('materie_moduli_requisiti')
          .insert(requisitiToInsert);

        if (requisitiError) throw requisitiError;
      }

      alert(`Matrice caricata con successo! ${moduli.length} moduli importati.`);
      setCsvFile(null);
      setNewMatrixName('');
      setNewMatrixDesc('');
      setShowNewMatrixForm(false);
      loadMatrici(selectedMateriaId);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert(`Errore durante l'importazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatrice = async (matriceId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa matrice? Tutti i moduli e requisiti saranno eliminati.')) {
      return;
    }

    const { error } = await supabase
      .from('materie_matrici')
      .delete()
      .eq('id', matriceId);

    if (error) {
      console.error('Error deleting matrice:', error);
      alert('Errore durante l\'eliminazione');
      return;
    }

    loadMatrici(selectedMateriaId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestione Matrici di Valutazione</h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleziona Materia
            </label>
            <select
              value={selectedMateriaId}
              onChange={(e) => setSelectedMateriaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Seleziona una materia --</option>
              {materie.map(materia => (
                <option key={materia.id} value={materia.id}>
                  {materia.nome}
                </option>
              ))}
            </select>
          </div>

          {selectedMateriaId && (
            <>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNewMatrixForm(!showNewMatrixForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Nuova Matrice
                </button>
              </div>

              {showNewMatrixForm && (
                <div className="border border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Matrice
                    </label>
                    <input
                      type="text"
                      value={newMatrixName}
                      onChange={(e) => setNewMatrixName(e.target.value)}
                      placeholder="es. Matrice Standard 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrizione (opzionale)
                    </label>
                    <textarea
                      value={newMatrixDesc}
                      onChange={(e) => setNewMatrixDesc(e.target.value)}
                      placeholder="Descrizione della matrice..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Incolla i Dati da Excel
                    </label>
                    <p className="text-sm text-gray-600 mb-2">
                      Seleziona e copia l'intera tabella da Excel (CTRL+C), poi incollala qui sotto (CTRL+V)
                    </p>
                    <textarea
                      value={pastedData}
                      onChange={(e) => setPastedData(e.target.value)}
                      placeholder="Incolla qui i dati copiati da Excel..."
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    {pastedData && (
                      <p className="mt-2 text-sm text-gray-600">
                        {pastedData.split('\n').length} righe incollate
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setShowNewMatrixForm(false);
                        setPastedData('');
                        setNewMatrixName('');
                        setNewMatrixDesc('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDataUpload}
                      disabled={loading || !pastedData.trim() || !newMatrixName.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {loading ? 'Importazione...' : 'Importa Dati'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedMateriaId && matrici.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome Matrice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrizione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Creazione
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matrici.map(matrice => (
                <tr key={matrice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {matrice.nome}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {matrice.descrizione || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(matrice.created_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setViewingMatriceId(matrice.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Visualizza e modifica matrice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMatrice(matrice.id)}
                      className="text-red-600 hover:text-red-900 ml-4"
                      title="Elimina matrice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedMateriaId && matrici.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">Nessuna matrice trovata per questa materia.</p>
          <p className="text-sm text-gray-400 mt-2">Crea una nuova matrice caricando un file CSV.</p>
        </div>
      )}

      {viewingMatriceId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Gestione Matrice
              </h2>
              <button
                onClick={() => setViewingMatriceId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <MatriceViewer matriceId={viewingMatriceId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}