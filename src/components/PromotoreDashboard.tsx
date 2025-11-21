import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Search, TrendingUp, Clock, Eye, Settings, BarChart3, Trash2 } from 'lucide-react';
import { AnalysisForm } from './AnalysisForm';
import { AnalysisResults } from './AnalysisResults';
import { SettingsManager } from './SettingsManager';

interface Materia {
  id: string;
  nome: string;
  descrizione: string;
  stato: string;
}

interface Analisi {
  id: string;
  created_at: string;
  conformita_ministeriale: number;
  manuale_raccomandato_id: string;
  programma_corso_id: string;
  stato: string;
  programmi_corso: {
    universita: string;
    corso_laurea: string;
    docente: string;
    materia_id: string;
    materie: {
      nome: string;
    };
  };
}

export function PromotoreDashboard() {
  const [materie, setMaterie] = useState<Materia[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<Analisi[]>([]);
  const [allAnalyses, setAllAnalyses] = useState<Analisi[]>([]);
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [viewingProgrammaId, setViewingProgrammaId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'nuova' | 'analisi'>('nuova');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: materieData } = await supabase
        .from('materie')
        .select('*')
        .eq('stato', 'attiva')
        .order('nome');

      if (materieData) {
        setMaterie(materieData);
      }

      const { data: analisiData } = await supabase
        .from('analisi')
        .select(`
          *,
          programmi_corso (
            id,
            universita,
            corso_laurea,
            docente,
            materia_id,
            materie (
              nome
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (analisiData) {
        setRecentAnalyses(analisiData);
      }

      const { data: allAnalisiData } = await supabase
        .from('analisi')
        .select(`
          *,
          programmi_corso (
            id,
            universita,
            corso_laurea,
            docente,
            materia_id,
            materie (
              nome
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (allAnalisiData) {
        setAllAnalyses(allAnalisiData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalisi = async (id: string, programmaId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa analisi?')) return;

    setDeleting(id);
    try {
      await supabase.from('analisi').delete().eq('id', id);
      await supabase.from('programmi_corso').delete().eq('id', programmaId);
      await loadData();
    } catch (error: any) {
      console.error('Errore:', error.message);
      alert('Errore durante l\'eliminazione');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (viewingProgrammaId) {
    return (
      <AnalysisResults
        programmaId={viewingProgrammaId}
        onBack={() => {
          setViewingProgrammaId(null);
          loadData();
        }}
      />
    );
  }

  if (selectedMateria) {
    return (
      <div>
        <button
          onClick={() => setSelectedMateria(null)}
          className="mb-6 text-slate-600 hover:text-slate-900 flex items-center gap-2"
        >
          ← Torna alle materie
        </button>
        <AnalysisForm materiaId={selectedMateria} onComplete={() => {
          setSelectedMateria(null);
          loadData();
        }} />
      </div>
    );
  }

  if (showSettings) {
    return (
      <div>
        <button
          onClick={() => setShowSettings(false)}
          className="mb-6 text-slate-600 hover:text-slate-900 flex items-center gap-2"
        >
          ← Torna alla dashboard
        </button>
        <SettingsManager />
      </div>
    );
  }

  const tabs = [
    { id: 'nuova' as const, name: 'Nuova Analisi', icon: FileText },
    { id: 'analisi' as const, name: 'Analisi', icon: BarChart3 },
  ];

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'completata':
        return 'text-green-700 bg-green-50';
      case 'in_elaborazione':
        return 'text-yellow-700 bg-yellow-50';
      case 'errore':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-slate-700 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 bg-white rounded-t-xl">
        <nav className="flex gap-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Settings size={18} />
            Impostazioni
          </button>
        </div>

        {activeTab === 'nuova' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Nuova Analisi Programma
              </h2>

              {materie.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Nessuna materia disponibile
                  </h3>
                  <p className="text-slate-600">
                    Attendi che un amministratore configuri le materie per iniziare le analisi.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materie.map((materia) => (
                    <button
                      key={materia.id}
                      onClick={() => setSelectedMateria(materia.id)}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-left hover:shadow-md hover:border-slate-300 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-slate-100 group-hover:bg-slate-200 p-2 rounded-lg transition-colors">
                          <Search className="w-5 h-5 text-slate-700" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">
                        {materia.nome}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {materia.descrizione || 'Analizza un programma di corso universitario'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {recentAnalyses.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Analisi Recenti
                </h2>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Università
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Corso
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Docente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Conformità
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Azioni
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {recentAnalyses.map((analisi) => (
                          <tr key={analisi.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {analisi.programmi_corso.universita}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {analisi.programmi_corso.corso_laurea}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {analisi.programmi_corso.docente || '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-slate-900">
                                  {analisi.conformita_ministeriale}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(analisi.created_at).toLocaleDateString('it-IT')}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setViewingProgrammaId(analisi.programma_corso_id)}
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                Dettagli
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analisi' && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Tutte le Analisi</h2>

          {allAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nessuna analisi disponibile
              </h3>
              <p className="text-slate-600">
                Inizia una nuova analisi per vedere i risultati qui.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Università
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Corso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Materia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Conformità
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Stato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {allAnalyses.map((analisi) => (
                      <tr key={analisi.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setViewingProgrammaId(analisi.programma_corso_id)}>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {analisi.programmi_corso.universita}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {analisi.programmi_corso.corso_laurea}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {analisi.programmi_corso.materie?.nome || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-slate-900">
                              {analisi.conformita_ministeriale}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatoColor(analisi.stato)}`}>
                            {analisi.stato}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(analisi.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingProgrammaId(analisi.programma_corso_id);
                              }}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              Dettagli
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAnalisi(analisi.id, (analisi.programmi_corso as any).id);
                              }}
                              disabled={deleting === analisi.id}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-50"
                            >
                              {deleting === analisi.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
