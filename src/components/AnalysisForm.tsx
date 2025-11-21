import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, CheckCircle, Upload, FileText, X, ArrowLeft } from 'lucide-react';

interface AnalysisFormProps {
  materiaId: string;
  onComplete: () => void;
  onBack?: () => void;
}

interface ClasseLaurea {
  id: string;
  codice: string;
  nome: string;
}

export function AnalysisForm({ materiaId, onComplete, onBack }: AnalysisFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [classiLaurea, setClassiLaurea] = useState<ClasseLaurea[]>([]);
  const [materiaNome, setMateriaNome] = useState('');
  const [manualiZanichelli, setManualiZanichelli] = useState<any[]>([]);
  const [manualiCompetitor, setManualiCompetitor] = useState<any[]>([]);
  const [selectedManualiAlternativi, setSelectedManualiAlternativi] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    universita: '',
    corsoLaurea: '',
    classeLaureaId: '',
    annoAccademico: '2024/2025',
    docente: '',
    contenutoProgramma: '',
    manualeAttuale: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'text' | 'pdf'>('pdf');

  useEffect(() => {
    loadClassiLaureaFromMatrice();
    loadMateriaNome();
    loadManuali();
  }, [materiaId]);

  const loadClassiLaureaFromMatrice = async () => {
    try {
      // Get matrice for this materia
      const { data: matrici } = await supabase
        .from('materie_matrici')
        .select('id')
        .eq('materia_id', materiaId)
        .limit(1);

      if (!matrici || matrici.length === 0) {
        console.warn('No matrice found for materia');
        return;
      }

      const matriceId = matrici[0].id;

      // Get all moduli for this matrice
      const { data: moduli } = await supabase
        .from('materie_moduli')
        .select('id')
        .eq('matrice_id', matriceId);

      if (!moduli || moduli.length === 0) {
        console.warn('No moduli found for matrice');
        return;
      }

      const moduliIds = moduli.map(m => m.id);

      // Get unique classe_laurea_codice from requisiti
      const { data: requisiti } = await supabase
        .from('materie_moduli_requisiti')
        .select('classe_laurea_codice')
        .in('modulo_id', moduliIds);

      if (!requisiti || requisiti.length === 0) {
        console.warn('No requisiti found');
        return;
      }

      // Extract only the code part (before space) from classe_laurea_codice
      // Example: "L-13 Scienze biologiche" -> "L-13"
      const uniqueCodici = [...new Set(requisiti.map(r => {
        const codice = r.classe_laurea_codice.split(' ')[0];
        return codice;
      }))];

      // Get full info from classi_laurea
      const { data: classi } = await supabase
        .from('classi_laurea')
        .select('id, codice, nome, tipo')
        .in('codice', uniqueCodici)
        .order('codice');

      if (classi) {
        setClassiLaurea(classi.map(d => ({
          id: d.id,
          codice: d.codice,
          nome: d.nome
        })));
      }
    } catch (error) {
      console.error('Error loading classi laurea:', error);
    }
  };

  const loadManuali = async () => {
    try {
      const { data, error: manualiError } = await supabase
        .from('manuali')
        .select('id, titolo, autori, tipo, indice_testo')
        .eq('materia_id', materiaId)
        .eq('stato', 'attivo')
        .order('titolo');

      if (manualiError) {
        console.error('Error loading manuali:', manualiError);
        setManualiZanichelli([]);
        setManualiCompetitor([]);
        return;
      }

      if (data) {
        const zanichelli = data.filter(m => m.tipo === 'zanichelli') || [];
        const competitor = data.filter(m => m.tipo === 'competitor') || [];
        setManualiZanichelli(zanichelli);
        setManualiCompetitor(competitor);
      } else {
        setManualiZanichelli([]);
        setManualiCompetitor([]);
      }
    } catch (error) {
      console.error('Error loading manuali:', error);
      setManualiZanichelli([]);
      setManualiCompetitor([]);
    }
  };

  const loadMateriaNome = async () => {
    const { data } = await supabase
      .from('materie')
      .select('nome')
      .eq('id', materiaId)
      .maybeSingle();

    if (data) {
      setMateriaNome(data.nome);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate: either PDF or text content is required
      if (uploadMode === 'pdf' && !pdfFile) {
        throw new Error('Carica un PDF o passa alla modalità testo');
      }
      if (uploadMode === 'text' && !formData.contenutoProgramma.trim()) {
        throw new Error('Inserisci il contenuto del programma o passa alla modalità PDF');
      }

      // Get API key from user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('openai_api_key')
        .eq('id', user!.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile?.openai_api_key) {
        throw new Error('Configura la chiave API di OpenAI nelle impostazioni prima di avviare un\'analisi');
      }

      let pdfUrl = null;

      // Upload PDF if provided
      if (uploadMode === 'pdf' && pdfFile) {
        const fileName = `${Date.now()}-${pdfFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('programmi-pdf')
          .upload(fileName, pdfFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Errore durante il caricamento del PDF: ${uploadError.message}`);
        }
        pdfUrl = uploadData.path;
      }

      const { data: programma, error: programmaError } = await supabase
        .from('programmi_corso')
        .insert({
          materia_id: materiaId,
          universita: formData.universita,
          corso_laurea: formData.corsoLaurea,
          classe_laurea_id: formData.classeLaureaId || null,
          anno_accademico: formData.annoAccademico,
          docente: formData.docente || null,
          contenuto_programma: uploadMode === 'text' ? formData.contenutoProgramma : '',
          pdf_programma_url: pdfUrl,
          manuale_attuale: formData.manualeAttuale || null,
          manuali_alternativi: selectedManualiAlternativi,
          created_by: user!.id
        })
        .select()
        .single();

      if (programmaError) {
        console.error('Database insert error:', programmaError);
        throw new Error(`Errore durante il salvataggio nel database: ${programmaError.message}`);
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-program`;
      console.log('Calling edge function with:', {
        programmaId: programma.id,
        hasApiKey: !!profile.openai_api_key,
        apiUrl
      });

      const analysisResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programmaId: programma.id,
          apiKey: profile.openai_api_key
        })
      });

      console.log('Response status:', analysisResponse.status);

      if (!analysisResponse.ok) {
        const responseText = await analysisResponse.text();
        console.error('Edge function error (raw):', responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }

        console.error('Edge function error (parsed):', errorData);
        alert(`ERRORE DETTAGLIATO:\n${JSON.stringify(errorData, null, 2)}`);
        throw new Error(errorData.error || 'Errore durante l\'analisi');
      }

      const analysisData = await analysisResponse.json();
      console.log('Analysis completed:', analysisData);

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Analisi Salvata!
        </h3>
        <p className="text-slate-600">
          Il programma è stato salvato e l'analisi AI verrà elaborata a breve.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Inserisci i dati del corso
            </h3>
            {materiaNome && (
              <p className="text-slate-600 mt-1">
                Materia: <span className="font-medium text-slate-900">{materiaNome}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Università *
            </label>
            <input
              type="text"
              name="universita"
              value={formData.universita}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              placeholder="es. Università di Bologna"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Corso di Laurea *
            </label>
            <input
              type="text"
              name="corsoLaurea"
              value={formData.corsoLaurea}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              placeholder="es. Ingegneria Chimica"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Classe di Laurea
            </label>
            <select
              name="classeLaureaId"
              value={formData.classeLaureaId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            >
              <option value="">Seleziona (opzionale)</option>
              {classiLaurea.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.codice} - {classe.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Anno Accademico *
            </label>
            <input
              type="text"
              name="annoAccademico"
              value={formData.annoAccademico}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              placeholder="2024/2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Docente
            </label>
            <input
              type="text"
              name="docente"
              value={formData.docente}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
              placeholder="Prof. Mario Rossi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Manuale Attualmente in Uso
            </label>
            <select
              name="manualeAttuale"
              value={formData.manualeAttuale}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            >
              <option value="">Seleziona manuale (opzionale)</option>
              <optgroup label="Manuali Competitor">
                {manualiCompetitor && manualiCompetitor.map((manuale) => (
                  <option key={manuale.id} value={manuale.id}>
                    {manuale.titolo} - {manuale.autori}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Manuali Zanichelli">
                {manualiZanichelli && manualiZanichelli.map((manuale) => (
                  <option key={manuale.id} value={manuale.id}>
                    {manuale.titolo} - {manuale.autori}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="mt-1 text-sm text-slate-600">
              Il manuale che il docente sta usando nel corso
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Manuali Alternativi
            </label>
            <div className="border border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-white">
              {manualiCompetitor.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Manuali Competitor</p>
                  <div className="space-y-2">
                    {manualiCompetitor && manualiCompetitor.map((manuale) => (
                      <label key={manuale.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedManualiAlternativi.includes(manuale.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedManualiAlternativi([...selectedManualiAlternativi, manuale.id]);
                            } else {
                              setSelectedManualiAlternativi(selectedManualiAlternativi.filter(id => id !== manuale.id));
                            }
                          }}
                          className="mt-1 w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                        />
                        <span className="text-sm text-slate-900 flex-1">
                          {manuale.titolo} - <span className="text-slate-600">{manuale.autori}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {manualiZanichelli.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Manuali Zanichelli</p>
                  <div className="space-y-2">
                    {manualiZanichelli && manualiZanichelli.map((manuale) => (
                      <label key={manuale.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedManualiAlternativi.includes(manuale.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedManualiAlternativi([...selectedManualiAlternativi, manuale.id]);
                            } else {
                              setSelectedManualiAlternativi(selectedManualiAlternativi.filter(id => id !== manuale.id));
                            }
                          }}
                          className="mt-1 w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                        />
                        <span className="text-sm text-slate-900 flex-1">
                          {manuale.titolo} - <span className="text-slate-600">{manuale.autori}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {manualiCompetitor.length === 0 && manualiZanichelli.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Nessun manuale disponibile</p>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Seleziona uno o più manuali alternativi consigliati come possibili sostituzioni
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Programma del Corso *
          </label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setUploadMode('pdf')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                uploadMode === 'pdf'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Carica PDF
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('text')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                uploadMode === 'text'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Incolla Testo
            </button>
          </div>

          {uploadMode === 'pdf' ? (
            <div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPdfFile(file);
                  }}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
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
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-900 font-medium">Clicca per caricare il PDF</p>
                      <p className="text-sm text-slate-500 mt-1">oppure trascina il file qui</p>
                    </div>
                  )}
                </label>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Carica il PDF del programma del corso dall'università
              </p>
            </div>
          ) : (
            <div>
              <textarea
                name="contenutoProgramma"
                value={formData.contenutoProgramma}
                onChange={handleChange}
                rows={12}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-y"
                placeholder="Incolla qui il programma del corso completo..."
              />
              <p className="mt-2 text-sm text-slate-600">
                Copia e incolla il programma del corso dal sito dell'università
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-slate-900 text-white py-3 px-6 rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analisi in corso con AI...
              </>
            ) : (
              'Avvia Analisi AI'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
