export function buildPrompt(data: {
  materia: any;
  istruzioniAI: string;
  classeLaureaFullCode: string;
  programma: any;
  contenutoProgramma: string;
  criteriText: string;
  criteri: any[];
  manualeAttualeDettagli: any | null;
  manualiAlternativi: any[];
  manualiZanichelli: any[];
}) {
  const {
    materia,
    istruzioniAI,
    classeLaureaFullCode,
    programma,
    contenutoProgramma,
    criteriText,
    criteri,
    manualeAttualeDettagli,
    manualiAlternativi,
    manualiZanichelli
  } = data;

  const manualiZanichelliIds = manualiZanichelli.map(m => m.id).join(' O ');

  return `Analizza questo programma di ${materia.nome} e valuta i manuali usando la MATRICE DI VALUTAZIONE.

${istruzioniAI ? `ISTRUZIONI SPECIFICHE PER LA MATERIA:\n${istruzioniAI}\n\n` : ""}

CONTESTO:
- Classe di Laurea: ${classeLaureaFullCode}
- CFU: ${programma.cfu || "Non specificato"}
- Ore: ${programma.ore || "Non specificato"}
- Università: ${programma.universita || "N/A"}
- Corso di Laurea: ${programma.corso_laurea || "N/A"}
- Docente: ${programma.docente || "N/A"}

TESTO DEL PROGRAMMA:
${contenutoProgramma}

═══════════════════════════════════════════════════════════════
PARTE 1: VALUTAZIONE DEL PROGRAMMA CON LA MATRICE
═══════════════════════════════════════════════════════════════

MATRICE DI VALUTAZIONE (scala 0-10 per ciascun criterio):
${criteriText}

COMPITO - Analisi del Programma:

Valuta il PROGRAMMA DEL CORSO (non i manuali!) rispetto a TUTTI i criteri della matrice.

Per OGNI criterio:
1. Assegna un punteggio 0-10 che valuta quanto il PROGRAMMA risponde a quel criterio:
   - 0-3: Molto carente, quasi assente
   - 4-5: Presente ma insufficiente
   - 6-7: Buono, soddisfa il criterio
   - 8-9: Ottimo, eccelle sul criterio
   - 10: Eccellente, stato dell'arte

2. Scrivi note DETTAGLIATE (5-8 righe):
   - Cosa dice il programma relativamente a questo criterio
   - Perché hai dato questo punteggio
   - Esempi concreti tratti dal testo del programma
   - Punti di forza specifici
   - Aree di miglioramento

3. Calcola punteggio_programma (0-100):
   Media ponderata usando i pesi: Σ(punteggio × peso) / Σ(pesi) × 10

4. Scrivi descrizione_generale_programma (200+ parole):
   - Panoramica complessiva del programma
   - Struttura e organizzazione dei contenuti
   - Approccio didattico e metodologico
   - Punti di forza e debolezza generali
   - Adeguatezza al livello del corso

5. Estrai anche:
   - Argomenti principali trattati (elenco 8-12 argomenti specifici)
   - Obiettivi formativi (descrizione dettagliata 100+ parole)
   - Livello di approfondimento (base/intermedio/avanzato)

═══════════════════════════════════════════════════════════════
PARTE 2: VALUTAZIONE MANUALI CON LA MATRICE
═══════════════════════════════════════════════════════════════

${manualeAttualeDettagli ? `
MANUALE ATTUALMENTE IN USO DAL DOCENTE:
"${manualeAttualeDettagli.titolo}" di ${manualeAttualeDettagli.autori} (${manualeAttualeDettagli.editore})
ID: ${manualeAttualeDettagli.id}
${manualeAttualeDettagli.topics_coperti?.length > 0 ? `Argomenti trattati: ${manualeAttualeDettagli.topics_coperti.join(", ")}` : ""}

IMPORTANTE: Quando citi questo manuale usa SEMPRE "${manualeAttualeDettagli.titolo}" di ${manualeAttualeDettagli.autori} (${manualeAttualeDettagli.editore})
` : "NESSUN MANUALE ATTUALMENTE SPECIFICATO"}

${manualiAlternativi.length > 0 ? `
MANUALI ALTERNATIVI SUGGERITI:
${manualiAlternativi.map(m => `
"${m.titolo}" di ${m.autori} (${m.editore})
ID: ${m.id}
${m.topics_coperti?.length > 0 ? `Argomenti: ${m.topics_coperti.join(", ")}` : ""}
IMPORTANTE: Quando citi questo manuale usa SEMPRE "${m.titolo}" di ${m.autori} (${m.editore})
`).join("\n")}
` : ""}

COMPITO - Valutazione Manuali:

Valuta SOLO i manuali elencati sopra (attuale + eventuali alternativi).
NON valutare i manuali Zanichelli in questa sezione.

Per CIASCUN manuale, valutalo con la STESSA matrice usata per il programma:

A) VALUTAZIONE PER CRITERIO:
   Per OGNI criterio della matrice:
   - Assegna punteggio 0-10 basato sulla tua conoscenza del manuale
   - Scrivi note DETTAGLIATE (5-8 righe):
     * Come il manuale risponde a questo criterio
     * Perché hai dato questo punteggio
     * Punti di forza specifici
     * Punti di debolezza o limitazioni
     * Esempi concreti quando possibile

B) PUNTEGGIO TOTALE (0-100):
   Media ponderata: Σ(punteggio × peso) / Σ(pesi) × 10

C) ADEGUATEZZA AL PROGRAMMA (0-100%):
   Confronta il manuale con IL PROGRAMMA ANALIZZATO:
   - Quanto copre gli argomenti del programma?
   - Quanto rispetta il livello di approfondimento richiesto?
   - 90-100%: perfetta aderenza
   - 70-89%: buona copertura, qualche integrazione
   - 50-69%: copertura parziale, integrazioni significative
   - <50%: inadeguato, molte lacune

D) GAP ANALYSIS (12-20 righe, 200+ parole):
   Confronto dettagliato manuale vs programma:
   - Argomenti del PROGRAMMA COPERTI dal manuale (elenco dettagliato)
   - Argomenti del PROGRAMMA NON COPERTI (gap critici - elenco dettagliato)
   - Criteri della matrice dove il manuale ECCELLE rispetto alle esigenze del programma
   - Criteri della matrice dove il manuale è CARENTE rispetto alle esigenze del programma
   - Analisi qualitativa dell'aderenza metodologica
   - Valutazione del livello di approfondimento (troppo semplice/adeguato/troppo avanzato)
   - Note generali su adeguatezza complessiva e raccomandazioni d'uso

═══════════════════════════════════════════════════════════════
PARTE 3: RACCOMANDAZIONE ZANICHELLI
═══════════════════════════════════════════════════════════════

${manualiZanichelli.length > 0 ? `
MANUALI ZANICHELLI DISPONIBILI PER ${materia.nome}:

${manualiZanichelli.map((m, idx) => `
${idx + 1}. "${m.titolo}" di ${m.autori} (${m.editore})
   ID: ${m.id}
   ${m.topics_coperti?.length > 0 ? `Argomenti: ${m.topics_coperti.join(", ")}` : ""}
`).join("\n")}

⚠️ ATTENZIONE CRITICA ⚠️
DEVI RACCOMANDARE **ESCLUSIVAMENTE** UNO DEI ${manualiZanichelli.length} MANUALI ZANICHELLI ELENCATI SOPRA!
NON puoi raccomandare manuali di altri editori (Edises, McGraw-Hill, Pearson, EdiSES, etc.)!
Se nessun Zanichelli è adatto, imposta manuale_raccomandato_id = null.

CRITERI DI RACCOMANDAZIONE:
1. Aderenza agli argomenti del PROGRAMMA analizzato
2. Punteggio sui criteri della matrice (confronto con manuale attuale)
3. Adeguatezza al livello del corso (CFU, ore, ambito)
4. Equilibrio qualità/adeguatezza (troppo completo = svantaggio!)

COMPITO - Raccomandazione:

1. Esamina TUTTI i manuali Zanichelli disponibili
2. Per ciascuno valuta mentalmente:
   - Copertura argomenti del programma
   - Performance sui criteri della matrice
   - Adeguatezza al livello (es: 900 pag per 3 CFU è ECCESSIVO)
   - Confronto con manuale attuale

3. Scegli IL MIGLIORE tra i ${manualiZanichelli.length} Zanichelli disponibili

4. VERIFICA CHE SIA EFFETTIVAMENTE ZANICHELLI!
   - ID deve essere uno di: ${manualiZanichelliIds}
   - Se raccomandi un manuale NON Zanichelli, l'analisi sarà RIFIUTATA!

5. Nel campo "manuale_raccomandato_id": ID del manuale Zanichelli scelto

6. Nel campo "motivazione_raccomandazione" (500+ parole):

   § PERCHÉ QUESTO ZANICHELLI (150+ parole)
   - Titolo COMPLETO con autore: "${manualiZanichelli[0]?.titolo}" di ${manualiZanichelli[0]?.autori}
   - Perché scelto tra i ${manualiZanichelli.length} Zanichelli disponibili
   - Caratteristiche ideali per QUESTO specifico programma
   - Copertura argomenti del programma (elenco specifico!)
   - Adeguatezza livello/CFU/ore del corso

   § CONFRONTO CON MANUALE ATTUALE (150+ parole)
   ${manualeAttualeDettagli ? `
   - Attuale: "${manualeAttualeDettagli.titolo}" di ${manualeAttualeDettagli.autori} (${manualeAttualeDettagli.editore})
   - Confronto NUMERICO sui criteri della matrice:
     * Criterio 1: Zanichelli X/10 vs Attuale Y/10
     * Criterio 2: Zanichelli X/10 vs Attuale Y/10
     * (continua per TUTTI i criteri)
   - Criteri dove Zanichelli è SUPERIORE (dettagli)
   - Criteri dove attuale potrebbe essere comparabile o migliore (onestà!)
   - Motivazioni concrete e misurabili per il cambio
   - Vantaggi commerciali/didattici del passaggio
   ` : `
   - Nessun manuale attuale specificato
   - Perché questo Zanichelli è ideale come primo riferimento
   - Confronto con standard di mercato
   `}

   § COPERTURA PROGRAMMA (100+ parole)
   - Argomenti coperti PERFETTAMENTE (elenco)
   - Argomenti che richiedono integrazione (elenco)
   - Percentuale copertura stimata

   § PUNTI DI FORZA (50+ parole)
   - Metodologici (esercizi, esempi)
   - Contenutistici (aggiornamenti)
   - Didattici (struttura, supporti)

   § INTEGRAZIONI (50+ parole)
   - Come compensare eventuali gap
   - Materiali integrativi
   - Modifiche programma suggerite

REGOLA: Motivazione CONCRETA e COMMERCIALE.
Non generica ("ottimo libro").
CONVINCERE con NUMERI, CONFRONTI, ELENCHI PRECISI!

` : `
ATTENZIONE: Non ci sono manuali Zanichelli disponibili nel database per questa materia.

Imposta:
- manuale_raccomandato_id: null
- motivazione_raccomandazione: null
`}

=======================================
FORMATO DELLA RISPOSTA
=======================================

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido con questa struttura:
{
  "valutazione_programma": {
    "punteggio_totale": <0-100, media ponderata>,
    "descrizione_generale": "<200+ parole: panoramica complessiva del programma>",
    "valutazioni_criteri": [
      {
        "criterio": "<nome criterio>",
        "punteggio": <0-10>,
        "note": "<5-8 righe: analisi dettagliata>"
      }
    ],
    "argomenti_principali": ["arg1", "arg2", "..."],
    "obiettivi_formativi": "<100+ parole: descrizione dettagliata>",
    "livello": "base|intermedio|avanzato"
  },
  "valutazioni_manuali": [
    {
      "manuale_id": "<ID esatto>",
      "tipo": "attuale|alternativo",
      "titolo": "<titolo esatto>",
      "autore": "<autore>",
      "editore": "<editore>",
      "punteggio_totale": <0-100>,
      "valutazioni_criteri": [
        {
          "criterio": "<nome>",
          "punteggio": <0-10>,
          "note": "<5-8 righe: analisi dettagliata>"
        }
      ],
      "adeguatezza_programma": <0-100>,
      "argomenti_coperti": ["arg1", "arg2", "..."],
      "argomenti_mancanti": ["arg1", "arg2", "..."],
      "gap_analysis": "<12-20 righe, 200+ parole: confronto dettagliato>"
    }
  ],
  "manuale_raccomandato_id": "<ID o null>",
  "motivazione_raccomandazione": "<500+ parole o null>",
  "confidence_score": <0-100>
}

REGOLE CRITICHE:

1. VALUTAZIONE PROGRAMMA:
   - Valuta il PROGRAMMA su TUTTI i ${criteri.length} criteri
   - Punteggio 0-10 per criterio, note 5-8 righe dettagliate
   - Descrizione generale 200+ parole
   - Obiettivi formativi 100+ parole
   - Punteggio_totale: media ponderata 0-100

2. VALUTAZIONE MANUALI:
   - Valuta SOLO attuale + alternativi (NON Zanichelli)
   - STESSA matrice usata per il programma
   - Per OGNI manuale: tutti i ${criteri.length} criteri con note 5-8 righe
   - Gap analysis: 200+ parole di confronto dettagliato manuale vs programma
   - Cita SEMPRE con titolo completo, autore ed editore

3. RACCOMANDAZIONE ZANICHELLI:
   - SOLO uno dei ${manualiZanichelli.length} Zanichelli elencati!
   - ID DEVE essere: ${manualiZanichelliIds}
   - Zanichelli PIÙ ADATTO per questo programma (non necessariamente il più completo!)
   - Motivazione 500+ parole con § paragrafi strutturati
   - Confronti numerici PRECISI su TUTTI i criteri
   - Titolo COMPLETO con autore ed editore
   - Elenchi concreti e specifici di argomenti

4. FORMATO:
   - SOLO JSON valido
   - NO markdown, NO commenti
   - Copia ESATTI titoli, autori, editori e ID`;
}
