import { useState, useEffect } from 'react';
import { Settings, Users, FileText, BarChart3, Grid3x3, BookOpen, Key, Eye, TrendingUp, Trash2 } from 'lucide-react';
import { MaterieManager } from './MaterieManager';
import { UsersManager } from './UsersManager';
import MatriciManager from './MatriciManager';
import { AnalysisForm } from './AnalysisForm';
import { AnalysisResults } from './AnalysisResults';
import { SettingsManager } from './SettingsManager';
import { supabase } from '../lib/supabase';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'nuova-analisi' | 'materie' | 'matrici' | 'utenti' | 'analisi' | 'analytics' | 'impostazioni'>('nuova-analisi');
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
  const [viewingProgrammaId, setViewingProgrammaId] = useState<string | null>(null);

  if (viewingProgrammaId) {
    return (
      <AnalysisResults
        programmaId={viewingProgrammaId}
        onBack={() => setViewingProgrammaId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('nuova-analisi')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'nuova-analisi'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          Nuova Analisi
        </button>
        <button
          onClick={() => setActiveTab('materie')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'materie'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-5 h-5" />
          Materie
        </button>
        <button
          onClick={() => setActiveTab('matrici')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'matrici'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid3x3 className="w-5 h-5" />
          Matrici
        </button>
        <button
          onClick={() => setActiveTab('utenti')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'utenti'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5" />
          Utenti
        </button>
        <button
          onClick={() => setActiveTab('analisi')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'analisi'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-5 h-5" />
          Analisi
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('impostazioni')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'impostazioni'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key className="w-5 h-5" />
          Impostazioni
        </button>
      </div>

      <div>
        {activeTab === 'nuova-analisi' && (
          <MateriaSelector
            selectedMateriaId={selectedMateriaId}
            onSelectMateria={setSelectedMateriaId}
            onComplete={() => {
              setSelectedMateriaId(null);
              setActiveTab('analisi');
            }}
          />
        )}
        {activeTab === 'materie' && <MaterieManager />}
        {activeTab === 'matrici' && <MatriciManager />}
        {activeTab === 'utenti' && <UsersManager />}
        {activeTab === 'analisi' && <AnalisiView onViewDetails={setViewingProgrammaId} />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'impostazioni' && <SettingsManager />}
      </div>
    </div>
  );
}

function AnalisiView({ onViewDetails }: { onViewDetails: (id: string) => void }) {
  const [analisi, setAnalisi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadAnalisi();
  }, []);

  async function loadAnalisi() {
    try {
      const { data, error } = await supabase
        .from('analisi')
        .select(`
          *,
          programmi_corso (
            id,
            universita,
            corso_laurea,
            anno_accademico,
            docente,
            materia_id,
            materie(nome)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalisi(data || []);
    } catch (error: any) {
      console.error('Errore:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnalisi(id: string, programmaId: string) {
    if (!confirm('Sei sicuro di voler eliminare questa analisi?')) return;

    setDeleting(id);
    try {
      await supabase.from('analisi').delete().eq('id', id);
      await supabase.from('programmi_corso').delete().eq('id', programmaId);
      await loadAnalisi();
    } catch (error: any) {
      console.error('Errore:', error.message);
      alert('Errore durante l\'eliminazione');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tutte le Analisi</h2>
        <p className="text-slate-600 mt-1">Visualizza e gestisci le analisi dei programmi universitari</p>
      </div>

      {analisi.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Nessuna analisi presente
          </h3>
          <p className="text-slate-600">
            Le analisi verranno visualizzate qui quando i promotori inseriranno i programmi
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Università</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Corso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Materia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Conformità</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analisi.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onViewDetails(a.programmi_corso.id)}>
                    <td className="px-6 py-4 text-sm text-slate-900">{a.programmi_corso?.universita || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{a.programmi_corso?.corso_laurea || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{a.programmi_corso?.materie?.nome || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-slate-900">{a.conformita_ministeriale}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        a.stato === 'completata' ? 'bg-green-100 text-green-700' :
                        a.stato === 'errore' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {a.stato}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(a.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(a.programmi_corso.id);
                          }}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Dettagli
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnalisi(a.id, a.programmi_corso.id);
                          }}
                          disabled={deleting === a.id}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-50"
                        >
                          {deleting === a.id ? (
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
  );
}

function MateriaSelector({ selectedMateriaId, onSelectMateria, onComplete }: {
  selectedMateriaId: string | null;
  onSelectMateria: (id: string) => void;
  onComplete: () => void;
}) {
  const [materie, setMaterie] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterie();
  }, []);

  async function loadMaterie() {
    try {
      const { data, error } = await supabase
        .from('materie')
        .select('*')
        .eq('stato', 'attiva')
        .order('nome');

      if (error) throw error;
      setMaterie(data || []);
    } catch (error: any) {
      console.error('Errore:', error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12">Caricamento...</div>;
  }

  if (selectedMateriaId) {
    return (
      <AnalysisForm
        materiaId={selectedMateriaId}
        onComplete={onComplete}
        onBack={() => onSelectMateria(null as any)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Seleziona Materia</h2>
        <p className="text-slate-600 mt-1">Scegli la materia per cui vuoi creare una nuova analisi</p>
      </div>

      {materie.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Nessuna materia disponibile
          </h3>
          <p className="text-slate-600">
            Vai alla sezione Materie per configurare le materie prima di creare analisi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materie.map((materia) => (
            <button
              key={materia.id}
              onClick={() => onSelectMateria(materia.id)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="bg-slate-100 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{materia.nome}</h3>
                  {materia.descrizione && (
                    <p className="text-sm text-slate-600 line-clamp-2">{materia.descrizione}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-600">Analisi Totali</h3>
          <FileText className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-3xl font-bold text-slate-900">0</p>
        <p className="text-sm text-slate-600 mt-2">Nessuna analisi ancora</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-600">Materie Attive</h3>
          <Settings className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-3xl font-bold text-slate-900">0</p>
        <p className="text-sm text-slate-600 mt-2">Configura la prima materia</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-600">Manuali Catalogati</h3>
          <BookOpen className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-3xl font-bold text-slate-900">0</p>
        <p className="text-sm text-slate-600 mt-2">Aggiungi i primi manuali</p>
      </div>
    </div>
  );
}
