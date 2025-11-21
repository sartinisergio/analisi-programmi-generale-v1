import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, Save, X, Trash2 } from 'lucide-react';

interface Modulo {
  id: string;
  nome_modulo: string;
  ordine: number;
  requisiti: Requisito[];
}

interface Requisito {
  id: string;
  classe_laurea_codice: string;
  livello: number;
  descrizione_contestuale: string;
}

interface Props {
  matriceId: string;
}

export function MatriceViewer({ matriceId }: Props) {
  const [moduli, setModuli] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModulo, setEditingModulo] = useState<string | null>(null);
  const [editingRequisito, setEditingRequisito] = useState<string | null>(null);

  useEffect(() => {
    loadModuli();
  }, [matriceId]);

  const loadModuli = async () => {
    try {
      setLoading(true);

      const { data: moduliData, error: moduliError } = await supabase
        .from('materie_moduli')
        .select('*')
        .eq('matrice_id', matriceId)
        .order('ordine');

      if (moduliError) throw moduliError;

      const moduliWithRequisiti = await Promise.all(
        (moduliData || []).map(async (modulo) => {
          const { data: requisitiData, error: requisitiError } = await supabase
            .from('materie_moduli_requisiti')
            .select('*')
            .eq('modulo_id', modulo.id)
            .order('classe_laurea_codice');

          if (requisitiError) throw requisitiError;

          return {
            ...modulo,
            requisiti: requisitiData || []
          };
        })
      );

      setModuli(moduliWithRequisiti);
    } catch (error) {
      console.error('Error loading moduli:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateModulo = async (moduloId: string, nome: string) => {
    try {
      const { error } = await supabase
        .from('materie_moduli')
        .update({ nome_modulo: nome })
        .eq('id', moduloId);

      if (error) throw error;

      await loadModuli();
      setEditingModulo(null);
    } catch (error) {
      console.error('Error updating modulo:', error);
      alert('Errore durante l\'aggiornamento del modulo');
    }
  };

  const updateRequisito = async (requisitoId: string, livello: number, descrizione: string) => {
    try {
      const { error } = await supabase
        .from('materie_moduli_requisiti')
        .update({
          livello,
          descrizione_contestuale: descrizione
        })
        .eq('id', requisitoId);

      if (error) throw error;

      await loadModuli();
      setEditingRequisito(null);
    } catch (error) {
      console.error('Error updating requisito:', error);
      alert('Errore durante l\'aggiornamento del requisito');
    }
  };

  const deleteModulo = async (moduloId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo modulo e tutti i suoi requisiti?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('materie_moduli')
        .delete()
        .eq('id', moduloId);

      if (error) throw error;

      await loadModuli();
    } catch (error) {
      console.error('Error deleting modulo:', error);
      alert('Errore durante l\'eliminazione del modulo');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Totale moduli:</strong> {moduli.length} |
          <strong className="ml-4">Totale requisiti:</strong> {moduli.reduce((acc, m) => acc + m.requisiti.length, 0)}
        </p>
      </div>

      {moduli.map((modulo, idx) => (
        <div key={modulo.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            {editingModulo === modulo.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={modulo.nome_modulo}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded"
                  id={`modulo-edit-${modulo.id}`}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById(`modulo-edit-${modulo.id}`) as HTMLInputElement;
                    updateModulo(modulo.id, input.value);
                  }}
                  className="text-green-600 hover:text-green-700"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingModulo(null)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900">
                  {idx + 1}. {modulo.nome_modulo}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingModulo(modulo.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteModulo(modulo.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Classe Laurea</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Livello</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Descrizione</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-700">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {modulo.requisiti.map((req) => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 font-mono text-xs">{req.classe_laurea_codice}</td>
                    {editingRequisito === req.id ? (
                      <>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            defaultValue={req.livello}
                            min="1"
                            max="10"
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                            id={`req-livello-${req.id}`}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            defaultValue={req.descrizione_contestuale}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            id={`req-desc-${req.id}`}
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            onClick={() => {
                              const livelloInput = document.getElementById(`req-livello-${req.id}`) as HTMLInputElement;
                              const descInput = document.getElementById(`req-desc-${req.id}`) as HTMLInputElement;
                              updateRequisito(req.id, parseInt(livelloInput.value), descInput.value);
                            }}
                            className="text-green-600 hover:text-green-700 mr-2"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingRequisito(null)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {req.livello}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-700">{req.descrizione_contestuale}</td>
                        <td className="py-2 px-2 text-right">
                          <button
                            onClick={() => setEditingRequisito(req.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {moduli.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nessun modulo trovato per questa matrice.
        </div>
      )}
    </div>
  );
}
