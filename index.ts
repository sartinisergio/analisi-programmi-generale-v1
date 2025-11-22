import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import pdfjsLib from "npm:pdfjs-dist@4.0.379";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    const response = await fetch(pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { programmaId, apiKey } = await req.json();

    if (!programmaId || !apiKey) {
      throw new Error("Missing required parameters: programmaId or apiKey");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const programmaResponse = await fetch(
      `${supabaseUrl}/rest/v1/programmi_corso?id=eq.${programmaId}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const programmi = await programmaResponse.json();
    if (!programmi || programmi.length === 0) {
      throw new Error("Program not found");
    }

    const programma = programmi[0];
    let contenutoProgramma = programma.contenuto_programma || '';

    if (programma.pdf_programma_url) {
      const pdfUrl = `${supabaseUrl}/storage/v1/object/public/programmi-pdf/${programma.pdf_programma_url}`;
      console.log('Extracting text from PDF:', pdfUrl);
      contenutoProgramma = await extractTextFromPDF(pdfUrl);
    }

    if (!contenutoProgramma || contenutoProgramma.trim() === '') {
      throw new Error("No program content available (neither text nor PDF)");
    }

    const criteriResponse = await fetch(
      `${supabaseUrl}/rest/v1/criteri_valutazione?materia_id=eq.${programma.materia_id}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const criteri = await criteriResponse.json();

    if (!criteri || criteri.length === 0) {
      throw new Error("No evaluation criteria found for this subject");
    }

    const criteriText = criteri
      .sort((a: any, b: any) => a.ordine - b.ordine)
      .map(
        (c: any, idx: number) =>
          `${idx + 1}. ${c.nome} (Peso: ${c.peso})\n   ${c.descrizione}`
      )
      .join("\n\n");

    let classeLaureaFullCode = "Non specificato";
    if (programma.classe_laurea_id) {
      const classeLaureaResponse = await fetch(
        `${supabaseUrl}/rest/v1/classi_laurea?id=eq.${programma.classe_laurea_id}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      const classiLaurea = await classeLaureaResponse.json();
      if (classiLaurea && classiLaurea.length > 0) {
        const classe = classiLaurea[0];
        classeLaureaFullCode = `${classe.codice} - ${classe.nome} (${classe.tipo})`;
      }
    }

    const materiaResponse = await fetch(
      `${supabaseUrl}/rest/v1/materie?id=eq.${programma.materia_id}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const materie = await materiaResponse.json();
    const materia = materie[0] || {};

    const matriciResponse = await fetch(
      `${supabaseUrl}/rest/v1/materie_matrici?materia_id=eq.${programma.materia_id}&select=id,nome`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const matrici = await matriciResponse.json();

    if (!matrici || matrici.length === 0) {
      throw new Error("No matrix found for this subject");
    }

    const matriceId = matrici[0].id;

    const moduliResponse = await fetch(
      `${supabaseUrl}/rest/v1/materie_moduli?matrice_id=eq.${matriceId}&select=id,nome_modulo,ordine`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const moduli = await moduliResponse.json();

    const moduliWithTopics = await Promise.all(
      moduli.map(async (modulo: any) => {
        const topicsResponse = await fetch(
          `${supabaseUrl}/rest/v1/materie_topics?modulo_id=eq.${modulo.id}&select=id,nome_topic,ordine`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );
        const topics = await topicsResponse.json();
        return {
          ...modulo,
          topics: (topics || []).sort((a: any, b: any) => a.ordine - b.ordine),
        };
      })
    );

    const moduliSorted = moduliWithTopics.sort((a: any, b: any) => a.ordine - b.ordine);

    const matriceText = moduliSorted
      .map(
        (m: any) =>
          `${m.nome_modulo}:\n${m.topics.map((t: any) => `  - ${t.nome_topic}`).join("\n")}`
      )
      .join("\n\n");

    const istruzioniAI = materia.istruzioni_ai || '';

    const manualiZanResponse = await fetch(
      `${supabaseUrl}/rest/v1/manuali?materia_id=eq.${programma.materia_id}&tipo=eq.zanichelli&select=id,titolo,autori,editore,topics_coperti,indice_testo`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const manualiZanichelliData = await manualiZanResponse.json();
    const manualiZanichelli = Array.isArray(manualiZanichelliData) ? manualiZanichelliData : [];

    let manualeAttualeDettagli = null;
    if (programma.manuale_attuale) {
      const manualeAttualeResponse = await fetch(
        `${supabaseUrl}/rest/v1/manuali?id=eq.${programma.manuale_attuale}&select=id,titolo,autori,editore,tipo,topics_coperti,pdf_indice_url,indice_testo`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      const manualeData = await manualeAttualeResponse.json();
      if (manualeData && manualeData.length > 0) {
        manualeAttualeDettagli = manualeData[0];
        if (manualeAttualeDettagli.pdf_indice_url && !manualeAttualeDettagli.indice_testo) {
          console.log('Extracting text from current manual PDF...');
          const pdfText = await extractTextFromPDF(manualeAttualeDettagli.pdf_indice_url);
          manualeAttualeDettagli.indice_testo = pdfText;
        }
      }
    }

    let manualiAlternativi: any[] = [];
    const manualiAlternativiIds = programma.manuali_alternativi || [];

    if (manualiAlternativiIds.length > 0) {
      const manualiAltResponse = await fetch(
        `${supabaseUrl}/rest/v1/manuali?id=in.(${manualiAlternativiIds.join(",")})&select=id,titolo,autori,editore,tipo,topics_coperti,pdf_indice_url,indice_testo`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      const manualiAltData = await manualiAltResponse.json();
      manualiAlternativi = Array.isArray(manualiAltData) ? manualiAltData : [];

      for (const manuale of manualiAlternativi) {
        if (manuale.pdf_indice_url && !manuale.indice_testo) {
          console.log(`Extracting text from alternative manual PDF: ${manuale.titolo}...`);
          const pdfText = await extractTextFromPDF(manuale.pdf_indice_url);
          manuale.indice_testo = pdfText;
        }
      }
    }

    const manualiZanText = manualiZanichelli
      .map(
        (m: any) =>
          `ID: ${m.id}\nTitolo: ${m.titolo}\nAutori: ${m.autori}\nEditore: ${m.editore}\nArgomenti: ${m.topics_coperti?.join(", ") || "N/A"}`
      )
      .join("\n\n");

    const manualeAttualeText = manualeAttualeDettagli
      ? `ID: ${manualeAttualeDettagli.id}\nTitolo: ${manualeAttualeDettagli.titolo}\nAutori: ${manualeAttualeDettagli.autori}\nEditore: ${manualeAttualeDettagli.editore}\nTipo: ${manualeAttualeDettagli.tipo}\n${manualeAttualeDettagli.indice_testo ? `\n=== INDICE DEL MANUALE (estratto dal PDF) ===\n${manualeAttualeDettagli.indice_testo}\n=== FINE INDICE ===\nUSA QUESTO INDICE PER IDENTIFICARE ESATTAMENTE QUALI CAPITOLI E ARGOMENTI SONO TRATTATI!` : `Argomenti: ${manualeAttualeDettagli.topics_coperti?.join(", ") || "N/A"}`}`
      : "Non specificato";

    const manualiAlternativiText = manualiAlternativi
      .map(
        (m: any) =>
          `ID: ${m.id}\nTitolo: ${m.titolo}\nAutori: ${m.autori}\nEditore: ${m.editore}\nTipo: ${m.tipo}\n${m.indice_testo ? `\n=== INDICE DEL MANUALE (estratto dal PDF) ===\n${m.indice_testo}\n=== FINE INDICE ===\nUSA QUESTO INDICE PER IDENTIFICARE ESATTAMENTE QUALI CAPITOLI E ARGOMENTI SONO TRATTATI!` : `Argomenti: ${m.topics_coperti?.join(", ") || "N/A"}`}`
      )
      .join("\n\n");

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
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert educational consultant specializing in analyzing university curricula and textbooks. Respond ONLY with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    let analysisResult;

let content = aiData.choices[0].message.content;
try {
  analysisResult = JSON.parse(content);
} catch {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in OpenAI response");
  }
  analysisResult = JSON.parse(jsonMatch[0]);
}
    const valutazioneProgramma = analysisResult.valutazione_programma;
    const valutazioniManuali = analysisResult.valutazioni_manuali || [];

    const insertProgrammaResponse = await fetch(
      `${supabaseUrl}/rest/v1/valutazioni_programma`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          programma_id: programmaId,
          punteggio_totale: valutazioneProgramma.punteggio_totale,
          descrizione_generale: valutazioneProgramma.descrizione_generale,
          argomenti_principali: valutazioneProgramma.argomenti_principali || [],
          obiettivi_formativi: valutazioneProgramma.obiettivi_formativi,
          livello: valutazioneProgramma.livello,
        }),
      }
    );

    const valutazioneProgrammaData = await insertProgrammaResponse.json();
    if (!insertProgrammaResponse.ok) {
      console.error("Failed to insert valutazioni_programma:", valutazioneProgrammaData);
      throw new Error("Failed to insert program evaluation");
    }

    const valutazioneProgrammaId = valutazioneProgrammaData[0].id;

    for (const crit of valutazioneProgramma.valutazioni_criteri) {
      const criterioMatch = criteri.find((c: any) => c.nome === crit.criterio);
      if (!criterioMatch) continue;

      await fetch(`${supabaseUrl}/rest/v1/valutazioni_programma_criteri`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valutazione_programma_id: valutazioneProgrammaId,
          criterio_id: criterioMatch.id,
          punteggio: crit.punteggio,
          note: crit.note,
        }),
      });
    }

    for (const valMan of valutazioniManuali) {
      const insertManualeResponse = await fetch(
        `${supabaseUrl}/rest/v1/valutazioni_manuali`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            programma_id: programmaId,
            manuale_id: valMan.manuale_id,
            punteggio_totale: valMan.punteggio_totale,
            adeguatezza_programma: valMan.adeguatezza_programma,
            argomenti_coperti: valMan.argomenti_coperti || [],
            argomenti_mancanti: valMan.argomenti_mancanti || [],
            gap_analysis: valMan.gap_analysis,
          }),
        }
      );

      const valutazioneManualeData = await insertManualeResponse.json();
      if (!insertManualeResponse.ok) {
        console.error("Failed to insert valutazioni_manuali:", valutazioneManualeData);
        continue;
      }

      const valutazioneManualeId = valutazioneManualeData[0].id;

      for (const crit of valMan.valutazioni_criteri) {
        const criterioMatch = criteri.find((c: any) => c.nome === crit.criterio);
        if (!criterioMatch) continue;

        await fetch(`${supabaseUrl}/rest/v1/valutazioni_manuali_criteri`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            valutazione_manuale_id: valutazioneManualeId,
            criterio_id: criterioMatch.id,
            punteggio: crit.punteggio,
            note: crit.note,
          }),
        });
      }
    }

    const analisiData: any = {
      programma_id: programmaId,
      stato: "completata",
      confidence_score: analysisResult.confidence_score,
    };

    if (analysisResult.manuale_raccomandato_id) {
      analisiData.manuale_raccomandato_id = analysisResult.manuale_raccomandato_id;
    }

    if (analysisResult.motivazione_raccomandazione) {
      analisiData.motivazione_raccomandazione = analysisResult.motivazione_raccomandazione;
    }

    await fetch(`${supabaseUrl}/rest/v1/analisi`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(analisiData),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Analysis completed successfully",
        programmaId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in analyze-program:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.stack,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});