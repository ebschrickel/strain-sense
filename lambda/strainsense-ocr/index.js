// strainsense-ocr Lambda function
// Ported from api/ocr.js (Vercel serverless → AWS Lambda event pattern)
// Reads OCR_SPACE_API_KEY from SSM Parameter Store (/strainsense/OCR_SPACE_API_KEY)
// Falls back to Lambda env var OCR_SPACE_API_KEY, then to public test key "helloworld"

const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || "us-east-2" });

// Simple in-memory cache to avoid SSM lookup on every invocation
let cachedApiKey = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getApiKey() {
  if (cachedApiKey && Date.now() < cacheExpiry) return cachedApiKey;

  // Try SSM first
  try {
    const cmd = new GetParameterCommand({
      Name: "/strainsense/OCR_SPACE_API_KEY",
      WithDecryption: true,
    });
    const result = await ssmClient.send(cmd);
    cachedApiKey = result.Parameter.Value;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return cachedApiKey;
  } catch (err) {
    // SSM unavailable — fall back to env var or public test key
    console.warn("[ocr] SSM lookup failed, using env/fallback:", err.message);
    return process.env.OCR_SPACE_API_KEY || "helloworld";
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS" || event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { imageBase64 } = body;
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Missing imageBase64" }),
    };
  }

  const apiKey = await getApiKey();
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const byteSize = Math.round(cleanBase64.length * 0.75);

  try {
    const params = new URLSearchParams({
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
      body: params.toString(),
    });

    const data = await resp.json();
    const text = data.ParsedResults?.[0]?.ParsedText || "";
    const ocrError = data.ErrorMessage || data.ParsedResults?.[0]?.ErrorMessage || null;

    console.log(
      "[ocr] provider=ocr.space | bytes=",
      byteSize,
      "| text length=",
      text.length,
      "| preview=",
      text.slice(0, 80)
    );

    if (ocrError && !text) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          text: "",
          provider: "ocr.space",
          debug: { byteSize, textLength: 0, error: ocrError },
        }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        text,
        provider: "ocr.space",
        debug: { byteSize, textLength: text.length },
      }),
    };
  } catch (err) {
    console.error("[ocr] error:", err?.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err?.message || "OCR failed", provider: "ocr.space" }),
    };
  }
};
