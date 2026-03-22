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
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: `You are analyzing a cannabis product label. This could be flower, vape, edible, gummy, tincture, oil, capsule, or any cannabis product.

Extract ALL data you can find. Return ONLY in this format, one item per line:
Strain: [name if visible]
Product type: [flower/vape/cart/edible/gummy/tincture/capsule] (if visible)
THC: [number]% (if shown as percentage)
THC: [number] mg (if shown as milligrams per serving)
CBD: [number]% (if shown as percentage)
CBD: [number] mg (if shown as milligrams per serving)
Ratio: [CBD:THC ratio if shown, e.g. 1:1, 2:1, 20:1]
Serving size: [number] mg (if visible)
[TerpeneName]: [number]%

Rules:
- For edibles/gummies/tinctures, look for mg per serving, mg per piece, or mg per dose
- If you see a CBD:THC ratio like "1:1" or "2:1", include it
- Use standard terpene names (Myrcene, Limonene, Linalool, Caryophyllene, Pinene, Terpinolene, Humulene, Ocimene, Nerolidol, Bisabolol, Guaiol)
- If "Beta-Caryophyllene" write "Caryophyllene", if "Beta-Myrcene" write "Myrcene"
- Only include data you can clearly read
- If not a cannabis product, say "NOT_CANNABIS_LABEL"` }
          ]
        }]
      }),
    });

    const data = await upstream.json();
    const text = data.content?.map(c => c.text || "").join("") || "";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("Anthropic proxy error:", err);
    return res.status(500).json({ error: "Analysis failed" });
  }
}
