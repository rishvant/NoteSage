import { Configuration, OpenAIApi } from "npm:openai@4.20.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      throw new Error("Invalid content provided");
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const configuration = new Configuration({ apiKey });
    const openai = new OpenAIApi(configuration);

    const prompt = `Please provide a concise summary of the following note in 2-3 sentences:\n\n${content}`;

    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise summaries of notes.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const summary = completion.data.choices[0]?.message?.content;
      if (!summary) {
        throw new Error("No summary generated");
      }

      return new Response(
        JSON.stringify({ summary }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (openaiError) {
      console.error("OpenAI API Error:", openaiError);
      throw new Error("Failed to generate summary");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: "Please ensure OpenAI API key is configured and content is valid"
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