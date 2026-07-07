// OCR.space API — free tier, no billing required
// Free public key works for testing (500 req/day)
// Register at ocr.space for 25,000 req/month free key
// Set OCR_SPACE_API_KEY in Vercel env vars (optional — falls back to free key)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64 } = req.body;
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res.status(400).json({ error: "Missing imageBase64" });
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const byteSize = Math.round(cleanBase64.length * 0.75);

  // Try the configured key first, then fall back to the free public key.
  // A stale/misconfigured key can return an empty-but-"successful" result,
  // so an empty parse also triggers the fallback.
  const keys = [];
  if (process.env.OCR_SPACE_API_KEY) keys.push({ key: process.env.OCR_SPACE_API_KEY, label: "configured" });
  keys.push({ key: "helloworld", label: "fallback" });

  const runOcr = async (apikey, engine) => {
    const body = new URLSearchParams({
      base64Image: `data:image/jpeg;base64,${cleanBase64}`,
      apikey,
      language: "eng",
      isTable: "false",
      OCREngine: engine,
      scale: "true",
    });
    const resp = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await resp.json();
    return {
      text: data.ParsedResults?.[0]?.ParsedText || "",
      error: data.ErrorMessage || data.ParsedResults?.[0]?.ErrorMessage || null,
    };
  };

  try {
    const attempts = [];
    let text = "", lastError = null;

    for (const { key, label } of keys) {
      for (const engine of ["2", "1"]) {
        const result = await runOcr(key, engine);
        attempts.push(`${label}/engine${engine}:${result.text ? "ok" : (result.error ? "error" : "empty")}`);
        if (result.error) lastError = result.error;
        if (result.text.trim()) { text = result.text; break; }
      }
      if (text) break;
    }

    console.log("[ocr] provider=ocr.space | bytes=", byteSize, "| text length=", text.length, "| attempts=", attempts.join(","));

    return res.status(200).json({
      text,
      provider: "ocr.space",
      debug: { byteSize, textLength: text.length, attempts, ...(lastError && !text ? { error: lastError } : {}) },
    });
  } catch (err) {
    console.error("[ocr] error:", err?.message);
    return res.status(500).json({ error: err?.message || "OCR failed", provider: "ocr.space" });
  }
}
