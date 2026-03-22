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

  const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const byteSize = Math.round(cleanBase64.length * 0.75);

  try {
    const body = new URLSearchParams({
      base64Image: `data:image/jpeg;base64,${cleanBase64}`,
      apikey: apiKey,
      language: "eng",
      isTable: "false",
      OCREngine: "2",
      scale: "true",
    });

    const resp = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await resp.json();
    const text = data.ParsedResults?.[0]?.ParsedText || "";
    const ocrError = data.ErrorMessage || data.ParsedResults?.[0]?.ErrorMessage || null;

    console.log("[ocr] provider=ocr.space | bytes=", byteSize, "| text length=", text.length, "| preview=", text.slice(0, 80));

    if (ocrError && !text) {
      return res.status(200).json({
        text: "",
        provider: "ocr.space",
        debug: { byteSize, textLength: 0, error: ocrError },
      });
    }

    return res.status(200).json({
      text,
      provider: "ocr.space",
      debug: { byteSize, textLength: text.length },
    });
  } catch (err) {
    console.error("[ocr] error:", err?.message);
    return res.status(500).json({ error: err?.message || "OCR failed", provider: "ocr.space" });
  }
}
