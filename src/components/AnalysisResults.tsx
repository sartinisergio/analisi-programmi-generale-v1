import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertTriangle, XCircle, BookOpen, ArrowLeft, Award, Star, Target } from 'lucide-react';

interface ValutazioneCriterio {
  criterio: string;
  punteggio: number;
  note: string;
}

interface ValutazioneProgramma {
  punteggio_totale: number;
  valutazioni_criteri: ValutazioneCriterio[];
  argomenti_principali: string[];
  obiettivi_formativi: string;
  livello: string;
  descrizione_generale?: string;
}

interface ValutazioneManuale {
  manuale_id: string;
  tipo: string;
  titolo: string;
  autore?: string;
  editore?: string;
  punteggio_totale: number;
  valutazioni_criteri: ValutazioneCriterio[];
  adeguatezza_programma: number;
  argomenti_coperti: string[];
  argomenti_mancanti: string[];
  gap_analysis: string;
}

interface Analisi {
  id: string;
  valutazione_programma: ValutazioneProgramma;
  valutazioni_manuali: ValutazioneManuale[];
  manuale_raccomandato_id: string | null;
  motivazione_raccomandazione: string | null;
  confidence_score: number;
  stato: string;
  created_at: string;
}

interface Programma {
  id: string;
  universita: string;
  corso_laurea: string;
  classe_laurea_id: string;
  anno_accademico: string;
  docente: string;
  classi_laurea?: {
    nome: string;
    codice: string;
  };
  contenuto_programma: string;
  manuale_attuale: string;
}

interface Props {
  programmaId: string;
  onBack: () => void;
}

export function AnalysisResults({ programmaId, onBack }: Props) {
  const [analisi, setAnalisi] = useState<Analisi | null>(null);
  const [programma, setProgramma] = useState<Programma | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [programmaId]);

  const loadData = async () => {
    try {
      const { data: programmaData } = await supabase
        .from('programmi_corso')
        .select('*, classi_laurea(nome, codice)')
        .eq('id', programmaId)
        .single();

      const { data: analisiData } = await supabase
        .from('analisi')
        .select('*')
        .eq('programma_corso_id', programmaId)
        .single();

      setProgramma(programmaData);
      setAnalisi(analisiData);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPunteggioColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getLivelloColor = (livello: string) => {
    switch (livello.toLowerCase()) {
      case 'avanzato':
        return 'bg-purple-100 text-purple-700';
      case 'intermedio':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!analisi || !programma) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <p className="text-slate-600">Analisi non disponibile</p>
        <button
          onClick={onBack}
          className="mt-4 text-slate-900 hover:text-slate-700 font-medium"
        >
          Torna indietro
        </button>
      </div>
    );
  }

  const valProgramma = analisi.valutazione_programma;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Torna alle analisi
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{programma.universita}</h2>
            <p className="text-lg text-slate-600 mt-1">{programma.corso_laurea}</p>
            <div className="flex gap-4 mt-2 text-sm text-slate-500">
              <span>Classe: {programma.classi_laurea?.nome || programma.classe_laurea_id}</span>
              <span>A.A. {programma.anno_accademico}</span>
              {programma.docente && <span>Docente: {programma.docente}</span>}
            </div>
          </div>
          <div className="flex gap-4">
            <div className={`px-6 py-4 rounded-lg border-2 ${getPunteggioColor(valProgramma?.punteggio_totale || 0)}`}>
              <div className="text-3xl font-bold">{valProgramma?.punteggio_totale || 0}</div>
              <div className="text-sm font-medium mt-1">Programma</div>
            </div>
            <div className="px-6 py-4 rounded-lg border-2 border-slate-200 bg-slate-50">
              <div className="text-3xl font-bold text-slate-900">{analisi.confidence_score}%</div>
              <div className="text-sm font-medium text-slate-600 mt-1">Confidence</div>
            </div>
          </div>
        </div>
      </div>

      {valProgramma && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-slate-700" />
            <h3 className="text-xl font-semibold text-slate-900">Valutazione del Programma</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-600 mb-2">Livello del Corso</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getLivelloColor(valProgramma.livello)}`}>
                {valProgramma.livello}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-600 mb-2">Punteggio Totale</p>
              <p className="text-2xl font-bold text-slate-900">{valProgramma.punteggio_totale}/100</p>
            </div>
          </div>

          {valProgramma.descrizione_generale && (
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-2">Descrizione Generale:</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4 whitespace-pre-line leading-relaxed">{valProgramma.descrizione_generale}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2">Obiettivi Formativi:</p>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4 whitespace-pre-line">{valProgramma.obiettivi_formativi}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2">Argomenti Principali:</p>
            <div className="flex flex-wrap gap-2">
              {valProgramma.argomenti_principali.map((arg, idx) => (
                <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {arg}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Valutazione per Criteri:</p>
            <div className="space-y-2">
              {valProgramma.valutazioni_criteri.map((criterio, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{criterio.criterio}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-slate-900">{criterio.punteggio}</span>
                      <span className="text-sm text-slate-600">/10</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{criterio.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {analisi.valutazioni_manuali && analisi.valutazioni_manuali.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-slate-700" />
            <h3 className="text-xl font-semibold text-slate-900">Valutazione Manuali</h3>
          </div>

          <div className="space-y-6">
            {analisi.valutazioni_manuali.map((valutazione, idx) => (
              <div key={idx} className={`border-2 rounded-lg p-5 ${
                valutazione.manuale_id === analisi.manuale_raccomandato_id
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-bold text-slate-900">{valutazione.titolo}</h4>
                      {valutazione.manuale_id === analisi.manuale_raccomandato_id && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          RACCOMANDATO
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-sm text-slate-600 mb-1">
                      <span>
                        <strong>{valutazione.autore || 'N/A'}</strong>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>{valutazione.editore || 'N/A'}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span className="capitalize">
                        Tipo: {valutazione.tipo}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-900">{valutazione.punteggio_totale}</div>
                      <div className="text-xs text-slate-600">Punteggio</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-slate-700">{valutazione.adeguatezza_programma}%</div>
                      <div className="text-xs text-slate-600">Adeguatezza</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-2">Argomenti Coperti:</p>
                    <div className="space-y-1">
                      {valutazione.argomenti_coperti.map((arg, aidx) => (
                        <div key={aidx} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-green-900">{arg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-700 mb-2">Argomenti Mancanti:</p>
                    <div className="space-y-1">
                      {valutazione.argomenti_mancanti.map((arg, aidx) => (
                        <div key={aidx} className="flex items-start gap-2">
                          <XCircle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-orange-900">{arg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Gap Analysis:</p>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{valutazione.gap_analysis}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Valutazione per Criteri:</p>
                  {valutazione.valutazioni_criteri.map((criterio, cidx) => (
                    <div key={cidx} className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900">{criterio.criterio}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-slate-900">{criterio.punteggio}</span>
                          <span className="text-sm text-slate-600">/10</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{criterio.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analisi.manuale_raccomandato_id && analisi.motivazione_raccomandazione && (
        <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border-2 border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {analisi.valutazioni_manuali.find(m => m.manuale_id === analisi.manuale_raccomandato_id)?.titolo || 'Manuale Zanichelli Raccomandato'}
              </h3>
              <p className="text-sm text-slate-600 mt-1">Valutazione commerciale e didattica</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
            <div className="prose prose-sm max-w-none">
              {analisi.motivazione_raccomandazione.split(/§\s*/).filter(s => s.trim()).map((section, idx) => {
                const lines = section.trim().split('\n');
                const title = lines[0];
                const content = lines.slice(1).join('\n').trim();

                return content ? (
                  <div key={idx} className="mb-6 last:mb-0">
                    <h4 className="text-base font-bold text-blue-900 mb-3 uppercase tracking-wide">{title}</h4>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{content}</p>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
