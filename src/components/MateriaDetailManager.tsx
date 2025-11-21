import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, BookOpen, CheckSquare, Upload, FileText, X, Edit2, Save } from 'lucide-react';

interface Criterio {
  id: string;
  nome: string;
  descrizione: string;
  peso: number;
  ordine: number;
}

interface Manuale {
  id: string;
  titolo: string;
  autori: string;
  editore?: string;
  pdf_indice_url?: string;
  indice_testo?: string;
  livello?: string;
  link_zanichelli?: string;
  stato: string;
  tipo: 'zanichelli' | 'competitor';
}

interface Props {
  materiaId: string;
  materiaNome: string;
  onBack: () => void;
}

export function MateriaDetailManager({ materiaId, materiaNome, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'criteri' | 'manuali-zanichelli' | 'manuali-competitor'>('criteri');
  const [criteri, setCriteri] = useState<Criterio[]>([]);
  const [manualiZanichelli, setManualiZanichelli] = useState<Manuale[]>([]);
  const [manualiCompetitor, setManualiCompetitor] = useState<Manuale[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [indiceText, setIndiceText] = useState('');
  const [editingManualeId, setEditingManualeId] = useState<string | null>(null);
  const [editingCriterioId, setEditingCriterioId] = useState<string | null>(null);

  const [newCriterio, setNewCriterio] = useState({ nome: '', descrizione: '', peso: 1.0 });
  const [editCriterio, setEditCriterio] = useState({ nome: '', descrizione: '', peso: 1.0 });
  const [newManuale, setNewManuale] = useState({
    titolo: '',
    autori: '',
    editore: '',
    livello: 'intermedio',
    link_zanichelli: '',
    pdf_indice_url: '',
    stato: 'attivo'
  });

  useEffect(() => {
    loadData();
  }, [materiaId]);

  async function loadData() {
    try {
      const [criteriRes, manualiRes] = await Promise.all([
        supabase.from('criteri_valutazione').select('*').eq('materia_id', materiaId).order('ordine'),
        supabase.from('manuali').select('id, materia_id, titolo, autori, editore, pdf_indice_url, indice_testo, livello, link_zanichelli, stato, tipo, created_at, updated_at').eq('materia_id', materiaId).order('titolo'),
      ]);

      if (criteriRes.error) throw criteriRes.error;
      if (manualiRes.error) throw manualiRes.error;

      setCriteri(criteriRes.data || []);

      const zanichelli = (manualiRes.data || []).filter(m => m.tipo === 'zanichelli');
      const competitor = (manualiRes.data || []).filter(m => m.tipo === 'competitor');

      setManualiZanichelli(zanichelli);
      setManualiCompetitor(competitor);
    } catch (error: any) {
      console.error('Errore caricamento:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCriterio(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('criteri_valutazione').insert([{
        materia_id: materiaId,
        ...newCriterio,
        ordine: criteri.length
      }]);

      if (error) throw error;

      setNewCriterio({ nome: '', descrizione: '', peso: 1.0 });
      await loadData();
    } catch (error: any) {
      alert('Errore: ' + error.message);
    }
  }

  async function handleAddManuale(e: React.FormEvent, tipo: 'zanichelli' | 'competitor') {
    e.preventDefault();
    try {
      let pdfUrl = newManuale.pdf_indice_url;
      let indiceTextoFinal = indiceText;

      // Handle text file upload
      if (textFile) {
        const reader = new FileReader();
        const textContent = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(textFile, 'UTF-8');
        });
        indiceTextoFinal = textContent;
      }

      // Sanitize text to avoid JSON encoding issues
      if (indiceTextoFinal) {
        indiceTextoFinal = indiceTextoFinal
          .replace(/\\/g, '\\\\')  // Escape backslashes
          .replace(/\u0000/g, '')  // Remove null characters
          .trim();
      }

      // Handle PDF upload
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);

        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-manual-pdf`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Errore durante l\'upload del PDF');
        }

        const { publicUrl } = await response.json();
        pdfUrl = publicUrl;
      }

      const updateData = {
        ...newManuale,
        pdf_indice_url: pdfUrl || newManuale.pdf_indice_url,
        ...(indiceTextoFinal && { indice_testo: indiceTextoFinal })
      };

      if (editingManualeId) {
        const { error } = await supabase.from('manuali')
          .update(updateData)
          .eq('id', editingManualeId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('manuali').insert([{
          materia_id: materiaId,
          ...updateData,
          tipo,
        }]);

        if (error) throw error;
      }

      setNewManuale({
        titolo: '',
        autori: '',
        editore: '',
        livello: 'intermedio',
        link_zanichelli: '',
        pdf_indice_url: '',
        stato: 'attivo'
      });
      setPdfFile(null);
      setTextFile(null);
      setIndiceText('');
      setEditingManualeId(null);
      await loadData();
    } catch (error: any) {
      alert('Errore: ' + error.message);
    }
  }

  function handleEditManuale(manuale: Manuale) {
    setNewManuale({
      titolo: manuale.titolo,
      autori: manuale.autori,
      editore: manuale.editore || '',
      livello: manuale.livello || 'intermedio',
      link_zanichelli: manuale.link_zanichelli || '',
      pdf_indice_url: manuale.pdf_indice_url || '',
      stato: manuale.stato
    });
    setIndiceText(manuale.indice_testo || '');
    setEditingManualeId(manuale.id);
    setActiveTab(manuale.tipo === 'zanichelli' ? 'manuali-zanichelli' : 'manuali-competitor');
  }

  function handleCancelEditManuale() {
    setNewManuale({
      titolo: '',
      autori: '',
      editore: '',
      livello: 'intermedio',
      link_zanichelli: '',
      pdf_indice_url: '',
      stato: 'attivo'
    });
    setPdfFile(null);
    setTextFile(null);
    setIndiceText('');
    setEditingManualeId(null);
  }

  function handleEditCriterio(criterio: Criterio) {
    setEditingCriterioId(criterio.id);
    setEditCriterio({
      nome: criterio.nome,
      descrizione: criterio.descrizione || '',
      peso: criterio.peso
    });
  }

  function handleCancelEditCriterio() {
    setEditingCriterioId(null);
    setEditCriterio({ nome: '', descrizione: '', peso: 1.0 });
  }

  async function handleUpdateCriterio(id: string) {
    try {
      const { error } = await supabase
        .from('criteri_valutazione')
        .update(editCriterio)
        .eq('id', id);

      if (error) throw error;

      setEditingCriterioId(null);
      setEditCriterio({ nome: '', descrizione: '', peso: 1.0 });
      await loadData();
    } catch (error: any) {
      alert('Errore: ' + error.message);
    }
  }

  async function handleDeleteCriterio(id: string) {
    if (!confirm('Eliminare questo criterio?')) return;
    try {
      const { error } = await supabase.from('criteri_valutazione').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      alert('Errore: ' + error.message);
    }
  }

  async function handleDeleteManuale(id: string) {
    if (!confirm('Eliminare questo manuale?')) return;
    try {
      const { error } = await supabase.from('manuali').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      alert('Errore: ' + error.message);
    }
  }

  async function handleExtractPdfText(manuale: Manuale) {
    if (!confirm(`Estrarre il testo dall'indice PDF di "${manuale.titolo}"? Questa operazione richiede l'API key di OpenAI e può richiedere alcuni secondi.`)) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('openai_api_key')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!profileData?.openai_api_key) {
      alert('Configura prima la tua API key di OpenAI nelle impostazioni del profilo!');
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          manualId: manuale.id,
          apiKey: profileData.openai_api_key
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante l\'estrazione');
      }

      const result = await response.json();
      alert(`Testo estratto con successo! (${result.textLength} caratteri)`);
      await loadData();
    } catch (error: any) {
      alert('Errore: ' + error.message);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{materiaNome}</h2>
          <p className="text-slate-600">Configurazione criteri e manuali</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('criteri')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'criteri'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          Criteri di Valutazione ({criteri.length})
        </button>
        <button
          onClick={() => setActiveTab('manuali-zanichelli')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'manuali-zanichelli'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          Manuali Zanichelli ({manualiZanichelli.length})
        </button>
        <button
          onClick={() => setActiveTab('manuali-competitor')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'manuali-competitor'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          Manuali Competitor ({manualiCompetitor.length})
        </button>
      </div>

      {activeTab === 'criteri' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Aggiungi Criterio</h3>
            <form onSubmit={handleAddCriterio} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Criterio *</label>
                  <input
                    type="text"
                    required
                    value={newCriterio.nome}
                    onChange={(e) => setNewCriterio({ ...newCriterio, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="es. Copertura argomenti ministeriali"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso (0-1) *</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0"
                    max="1"
                    value={newCriterio.peso}
                    onChange={(e) => setNewCriterio({ ...newCriterio, peso: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
                <textarea
                  value={newCriterio.descrizione}
                  onChange={(e) => setNewCriterio({ ...newCriterio, descrizione: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Criterio
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {criteri.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                Nessun criterio configurato. Aggiungi criteri per valutare i programmi.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Descrizione</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Peso</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {criteri.map((c) => (
                    <tr key={c.id}>
                      {editingCriterioId === c.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editCriterio.nome}
                              onChange={(e) => setEditCriterio({ ...editCriterio, nome: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editCriterio.descrizione}
                              onChange={(e) => setEditCriterio({ ...editCriterio, descrizione: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={editCriterio.peso}
                              onChange={(e) => setEditCriterio({ ...editCriterio, peso: parseFloat(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleUpdateCriterio(c.id)}
                                className="text-green-600 hover:text-green-700"
                                title="Salva"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEditCriterio}
                                className="text-slate-600 hover:text-slate-700"
                                title="Annulla"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{c.nome}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{c.descrizione || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{c.peso}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleEditCriterio(c)}
                                className="text-slate-600 hover:text-slate-900"
                                title="Modifica"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCriterio(c.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Elimina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {(activeTab === 'manuali-zanichelli' || activeTab === 'manuali-competitor') && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingManualeId ? 'Modifica' : 'Aggiungi'} Manuale {activeTab === 'manuali-zanichelli' ? 'Zanichelli' : 'Competitor'}
            </h3>
            <form onSubmit={(e) => handleAddManuale(e, activeTab === 'manuali-zanichelli' ? 'zanichelli' : 'competitor')} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titolo *</label>
                  <input
                    type="text"
                    required
                    value={newManuale.titolo}
                    onChange={(e) => setNewManuale({ ...newManuale, titolo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Autori *</label>
                  <input
                    type="text"
                    required
                    value={newManuale.autori}
                    onChange={(e) => setNewManuale({ ...newManuale, autori: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Editore</label>
                  <input
                    type="text"
                    value={newManuale.editore}
                    onChange={(e) => setNewManuale({ ...newManuale, editore: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="es. Pearson, McGraw-Hill, Mondadori..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Livello</label>
                  <select
                    value={newManuale.livello}
                    onChange={(e) => setNewManuale({ ...newManuale, livello: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="base">Base</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzato">Avanzato</option>
                  </select>
                </div>
                {activeTab === 'manuali-zanichelli' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link Zanichelli</label>
                    <input
                      type="url"
                      value={newManuale.link_zanichelli}
                      onChange={(e) => setNewManuale({ ...newManuale, link_zanichelli: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="https://www.zanichelli.it/..."
                    />
                  </div>
                )}
                {!editingManualeId && (
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        PDF del Manuale (opzionale)
                      </label>
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPdfFile(file);
                                setNewManuale({ ...newManuale, pdf_indice_url: '' });
                              }
                            }}
                            className="hidden"
                            id="pdf-indice-upload"
                          />
                          <label htmlFor="pdf-indice-upload" className="cursor-pointer">
                            {pdfFile ? (
                              <div className="flex items-center justify-center gap-3">
                                <FileText className="w-8 h-8 text-green-600" />
                                <div className="text-left">
                                  <p className="font-medium text-slate-900">{pdfFile.name}</p>
                                  <p className="text-sm text-slate-600">{(pdfFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPdfFile(null);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                <p className="text-slate-900 font-medium">Carica PDF indice</p>
                                <p className="text-sm text-slate-500 mt-1">Clicca per selezionare un file</p>
                              </div>
                            )}
                          </label>
                        </div>
                        <div className="text-center text-sm text-slate-500">oppure</div>
                        <div>
                          <input
                            type="url"
                            value={newManuale.pdf_indice_url}
                            onChange={(e) => {
                              setNewManuale({ ...newManuale, pdf_indice_url: e.target.value });
                              setPdfFile(null);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                            placeholder="Inserisci link al PDF"
                            disabled={!!pdfFile}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Indice del Manuale (testo per l'analisi AI)
                      </label>
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                          <input
                            type="file"
                            accept=".txt,.md,text/plain,text/markdown"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setTextFile(file);
                                setIndiceText('');
                              }
                            }}
                            className="hidden"
                            id="text-indice-upload"
                          />
                          <label htmlFor="text-indice-upload" className="cursor-pointer">
                            {textFile ? (
                              <div className="flex items-center justify-center gap-3">
                                <FileText className="w-6 h-6 text-blue-600" />
                                <div className="text-left">
                                  <p className="font-medium text-slate-900">{textFile.name}</p>
                                  <p className="text-sm text-slate-600">{(textFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setTextFile(null);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-slate-900 font-medium">Carica file testo (.md, .txt)</p>
                                <p className="text-sm text-slate-500 mt-1">Clicca per selezionare un file</p>
                              </div>
                            )}
                          </label>
                        </div>
                        <div className="text-center text-sm text-slate-500">oppure</div>
                        <div>
                          <textarea
                            value={indiceText}
                            onChange={(e) => {
                              setIndiceText(e.target.value);
                              setTextFile(null);
                            }}
                            rows={8}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-sm"
                            placeholder="Incolla qui il testo dell'indice del manuale..."
                            disabled={!!textFile}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Il testo dell'indice verrà usato dall'AI per analizzare la copertura degli argomenti
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {editingManualeId && (
                  <div className="md:col-span-2 space-y-4">
                    {newManuale.pdf_indice_url && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          PDF Indice
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg">
                          <FileText className="w-4 h-4 text-slate-600 flex-shrink-0" />
                          <span className="text-sm text-slate-600">PDF già caricato</span>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Indice del Manuale (testo per l'analisi AI)
                      </label>
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                          <input
                            type="file"
                            accept=".txt,.md,text/plain,text/markdown"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setTextFile(file);
                                setIndiceText('');
                              }
                            }}
                            className="hidden"
                            id="text-indice-upload-edit"
                          />
                          <label htmlFor="text-indice-upload-edit" className="cursor-pointer">
                            {textFile ? (
                              <div className="flex items-center justify-center gap-3">
                                <FileText className="w-6 h-6 text-blue-600" />
                                <div className="text-left">
                                  <p className="font-medium text-slate-900">{textFile.name}</p>
                                  <p className="text-sm text-slate-600">{(textFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setTextFile(null);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-slate-900 font-medium">Carica file testo (.md, .txt)</p>
                                <p className="text-sm text-slate-500 mt-1">Clicca per selezionare un file</p>
                              </div>
                            )}
                          </label>
                        </div>
                        <div className="text-center text-sm text-slate-500">oppure</div>
                        <div>
                          <textarea
                            value={indiceText}
                            onChange={(e) => {
                              setIndiceText(e.target.value);
                              setTextFile(null);
                            }}
                            rows={8}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-sm"
                            placeholder="Incolla qui il testo dell'indice del manuale..."
                            disabled={!!textFile}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Il testo dell'indice verrà usato dall'AI per analizzare la copertura degli argomenti
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {editingManualeId ? 'Salva Modifiche' : 'Aggiungi Manuale'}
                </button>
                {editingManualeId && (
                  <button
                    type="button"
                    onClick={handleCancelEditManuale}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Annulla
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeTab === 'manuali-zanichelli' ? manualiZanichelli : manualiCompetitor).length === 0 ? (
              <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-600">
                Nessun manuale {activeTab === 'manuali-zanichelli' ? 'Zanichelli' : 'competitor'} configurato.
              </div>
            ) : (
              (activeTab === 'manuali-zanichelli' ? manualiZanichelli : manualiCompetitor).map((m) => (
                <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{m.titolo}</h4>
                      <p className="text-sm text-slate-600">{m.autori}</p>
                      {m.editore && (
                        <p className="text-xs text-slate-500 mt-1">{m.editore}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditManuale(m)}
                        className="text-slate-600 hover:text-slate-900"
                        title="Modifica"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteManuale(m.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    {m.livello && (
                      <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded mt-2">
                        {m.livello}
                      </span>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.pdf_indice_url && (
                        <a
                          href={m.pdf_indice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF caricato</span>
                        </a>
                      )}
                      {m.indice_testo ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <FileText className="w-3 h-3" />
                          <span>Indice testo ({(m.indice_testo.length / 1000).toFixed(1)}k caratteri)</span>
                        </span>
                      ) : m.pdf_indice_url && (
                        <button
                          onClick={() => handleExtractPdfText(m)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="Estrai testo dall'indice PDF per l'analisi AI"
                        >
                          <Upload className="w-3 h-3" />
                          Estrai testo
                        </button>
                      )}
                    </div>
                  </div>
                  {m.link_zanichelli && (
                    <a
                      href={m.link_zanichelli}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                    >
                      Vedi su Zanichelli →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
