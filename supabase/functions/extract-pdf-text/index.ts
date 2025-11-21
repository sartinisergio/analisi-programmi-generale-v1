import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { manualId, apiKey } = await req.json();

    if (!manualId) {
      throw new Error("manualId is required");
    }

    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: manual, error: fetchError } = await supabase
      .from("manuali")
      .select("id, titolo, autori, pdf_indice_url")
      .eq("id", manualId)
      .single();

    if (fetchError || !manual) {
      throw new Error("Manual not found");
    }

    if (!manual.pdf_indice_url) {
      throw new Error("No PDF index uploaded for this manual");
    }

    console.log(`Fetching PDF from: ${manual.pdf_indice_url}`);
    const pdfResponse = await fetch(manual.pdf_indice_url);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    console.log(`Sending to OpenAI for text extraction...`);
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Sei un assistente che estrae l'indice dai manuali universitari. Estrai TUTTO il testo dell'indice del libro, includendo numeri di capitolo, titoli, sottosezioni e numeri di pagina. Mantieni la struttura gerarchica.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Estrai l'indice completo di questo manuale: "${manual.titolo}" di ${manual.autori}. Include tutti i capitoli, sezioni e argomenti. Mantieni la numerazione originale.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await openaiResponse.json();
    const extractedText = result.choices[0].message.content;

    console.log(`Extracted text length: ${extractedText.length} characters`);

    const { error: updateError } = await supabase
      .from("manuali")
      .update({ indice_testo: extractedText })
      .eq("id", manualId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "PDF text extracted successfully",
        textLength: extractedText.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});