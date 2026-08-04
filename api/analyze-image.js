// Serverless proxy — keeps ANTHROPIC_API_KEY off the device bundle.
//
// Gated. No shipped client calls this endpoint: src/StrainSense.jsx posts only
// to /api/ocr. Left open, this route handed the Anthropic key to anyone who
// found the URL, at our cost. It now fails closed — if ANALYZE_PROXY_SECRET is
// unset the route behaves as if it does not exist, so a deploy that forgets the
// secret leaves the key unreachable rather than exposed.
//
// To use it: set ANALYZE_PROXY_SECRET in the Vercel project and send the same
// value in the x-analyze-key header.
//
// CORS is deliberately absent. Nothing calls this from a browser, and omitting
// the headers means no cross-origin page can reach it at all.

import { timingSafeEqual } from "node:crypto";

function isAuthorized(req) {
  const expected = process.env.ANALYZE_PROXY_SECRET;
  if (!expected) return false;

  const presented = req.headers["x-analyze-key"];
  if (typeof presented !== "string" || presented.length === 0) return false;

  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  // Unauthorized callers get an indistinguishable 404 whether or not the secret
  // is configured, so the response is never an oracle for the gate's state.
  if (req.method !== "POST" || !isAuthorized(req)) {
    if (!process.env.ANALYZE_PROXY_SECRET) {
      console.warn("[analyze-image] rejected: ANALYZE_PROXY_SECRET is not set");
    }
    return res.status(404).json({ error: "Not found" });
  }

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
    console.log("[analyze-image] status:", upstreamStatus, "| text length:", text.length);
    return res.status(200).json({ text });
  } catch (err) {
    console.error("Anthropic proxy error:", err);
    return res.status(500).json({ error: "Analysis failed", detail: err.message });
  }
}
