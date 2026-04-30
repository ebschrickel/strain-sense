// strainsense-analyze Lambda function
// Ported from api/analyze-image.js (Vercel serverless → AWS Lambda event pattern)
// Reads ANTHROPIC_API_KEY from SSM Parameter Store (/strainsense/ANTHROPIC_API_KEY)
// Falls back to Lambda env var ANTHROPIC_API_KEY

const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || "us-east-2" });

// Simple in-memory cache to avoid SSM lookup on every invocation
let cachedApiKey = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getApiKey() {
  if (cachedApiKey && Date.now() < cacheExpiry) return cachedApiKey;

  try {
    const cmd = new GetParameterCommand({
      Name: "/strainsense/ANTHROPIC_API_KEY",
      WithDecryption: true,
    });
    const result = await ssmClient.send(cmd);
    cachedApiKey = result.Parameter.Value;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return cachedApiKey;
  } catch (err) {
    console.warn("[analyze] SSM lookup failed, using env var:", err.message);
    const envKey = process.env.ANTHROPIC_API_KEY;
    if (!envKey) throw new Error("ANTHROPIC_API_KEY not found in SSM or env");
    return envKey;
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

  const { imageBase64, mediaType } = body;
  if (!imageBase64 || !mediaType) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "imageBase64 and mediaType are required" }),
    };
  }

  let apiKey;
  try {
    apiKey = await getApiKey();
  } catch (err) {
    console.error("[analyze] Failed to get API key:", err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Server not configured" }),
    };
  }

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
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: imageBase64 },
              },
              {
                type: "text",
                text: `Extract ALL visible text from this image exactly as it appears. Return every word, number, symbol, and label you can read — do not interpret, summarize, or reformat anything. Just transcribe every piece of text you see, line by line.`,
              },
            ],
          },
        ],
      }),
    });

    const upstreamStatus = upstream.status;
    const data = await upstream.json();

    if (data.type === "error" || data.error) {
      const errMsg = data.error?.message || JSON.stringify(data.error) || "Unknown API error";
      console.error("[analyze] Anthropic API error:", upstreamStatus, errMsg);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ text: "", debug: `API error (${upstreamStatus}): ${errMsg}` }),
      };
    }

    const text = data.content?.map((c) => c.text || "").join("") || "";
    console.log(
      "[analyze] status:",
      upstreamStatus,
      "| text length:",
      text.length,
      "| preview:",
      text.slice(0, 100)
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    console.error("[analyze] Anthropic proxy error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Analysis failed", detail: err.message }),
    };
  }
};
