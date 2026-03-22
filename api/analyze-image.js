// Serverless proxy — keeps ANTHROPIC_API_KEY off the device bundle.
// Deploy to Vercel. Set ANTHROPIC_API_KEY in Vercel environment variables.
// CORS is open to allow requests from the Capacitor WebView origin.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, mediaType } = req.body;
  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: "imageBase64 and mediaType are required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server not configured" });

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: `Extract ALL visible text from this image exactly as it appears. Return every word, number, symbol, and label you can read — do not interpret, summarize, or reformat anything. Just transcribe every piece of text you see, line by line.` }
          ]
        }]
      }),
    });

    const upstreamStatus = upstream.status;
    const data = await upstream.json();

    // Surface API errors instead of swallowing them
    if (data.type === "error" || data.error) {
      const errMsg = data.error?.message || JSON.stringify(data.error) || "Unknown API error";
      console.error("[analyze-image] Anthropic API error:", upstreamStatus, errMsg);
      return res.status(200).json({ text: "", debug: `API error (${upstreamStatus}): ${errMsg}` });
    }

    const text = data.content?.map(c => c.text || "").join("") || "";
    console.log("[analyze-image] status:", upstreamStatus, "| text length:", text.length, "| preview:", text.slice(0, 100));
    return res.status(200).json({ text });
  } catch (err) {
    console.error("Anthropic proxy error:", err);
    return res.status(500).json({ error: "Analysis failed", detail: err.message });
  }
}
