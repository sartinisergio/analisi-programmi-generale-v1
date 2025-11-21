import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Plus, Edit2, Trash2, Check, X, ChevronRight } from 'lucide-react';
import { MateriaDetailManager } from './MateriaDetailManager';

interface Materia {
  id: string;
  nome: string;
  descrizione: string;
  stato: 'attiva' | 'inattiva';
  created_at: string;
}

export function MaterieManager() {
  const [materie, setMaterie] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMateria, setSelectedMateria] = useState<{ id: string; nome: string } | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    stato: 'attiva' as 'attiva' | 'inattiva'
  });

  useEffect(() => {
    loadMaterie();
  }, []);

  const loadMaterie = async () => {
    try {
      const { data, error } = await supabase
        .from('materie')
        .select('*')
        .order('nome');

      if (error) throw error;
      setMaterie(data || []);
    } catch (error) {
      console.error('Error loading materie:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingId) {
        const { error } = await supabase
          .from('materie')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('materie')
          .insert([{ ...formData, created_by: user?.id }]);

        if (error) throw error;
      }

      setFormData({ nome: '', descrizione: '', stato: 'attiva' });
      setShowForm(false);
      setEditingId(null);
      loadMaterie();
    } catch (error) {
      console.error('Error saving materia:', error);
      alert('Errore nel salvataggio della materia');
    }
  };

  const handleEdit = (materia: Materia) => {
    setFormData({
      nome: materia.nome,
      descrizione: materia.descrizione,
      stato: materia.stato
    });
    setEditingId(materia.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa materia?')) return;

    try {
      const { error } = await supabase
        .from('materie')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadMaterie();
    } catch (error) {
      console.error('Error deleting materia:', error);
      alert('Errore nell\'eliminazione della materia');
    }
  };

  const cancelForm = () => {
    setFormData({ nome: '', descrizione: '', stato: 'attiva' });
    setShowForm(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (selectedMateria) {
    return (
      <MateriaDetailManager
        materiaId={selectedMateria.id}
        materiaNome={selectedMateria.nome}
        onBack={() => {
          setSelectedMateria(null);
          loadMaterie();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestione Materie</h2>
          <p className="text-slate-600 mt-1">Configura le materie disponibili per le analisi</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuova Materia
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Modifica Materia' : 'Nuova Materia'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nome Materia *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="es. Matematica, Fisica, Chimica..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descrizione
              </label>
              <textarea
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="Breve descrizione della materia"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Stato
              </label>
              <select
                value={formData.stato}
                onChange={(e) => setFormData({ ...formData, stato: e.target.value as 'attiva' | 'inattiva' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="attiva">Attiva</option>
                <option value="inattiva">Inattiva</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Check className="w-5 h-5" />
                {editingId ? 'Salva Modifiche' : 'Crea Materia'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {materie.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Nessuna materia configurata
          </h3>
          <p className="text-slate-600 mb-6">
            Crea la prima materia per iniziare ad utilizzare la piattaforma
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materie.map((materia) => (
            <div
              key={materia.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {materia.nome}
                  </h3>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      materia.stato === 'attiva'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {materia.stato === 'attiva' ? 'Attiva' : 'Inattiva'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(materia)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Modifica"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(materia.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {materia.descrizione && (
                <p className="text-sm text-slate-600 mt-2">
                  {materia.descrizione}
                </p>
              )}
              <button
                onClick={() => setSelectedMateria({ id: materia.id, nome: materia.nome })}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                Configura Criteri e Manuali
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
