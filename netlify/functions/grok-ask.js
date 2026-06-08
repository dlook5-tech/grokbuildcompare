// Netlify Function — proxies the in-site "Ask Grok" side panel to xAI's
// Agent Tools API (/v1/responses + x_search), the same endpoint
// produce_cron uses. The older /v1/chat/completions endpoint with
// grok-4-latest returns 404 because Live Search was deprecated.
//
// Two modes, controlled by the request body:
//   { url, summary: true }   → returns a 3-5 bullet summary of the post
//   { url, question: "..." } → returns a free-text answer about the post
//
// Security: XAI_API_KEY is read from Netlify env vars (server-side).
// The browser never sees the key.

const XAI_URL = "https://api.x.ai/v1/responses";
const MODEL   = "grok-4.3";

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "POST only" }) };
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500, headers: cors,
      body: JSON.stringify({ error: "XAI_API_KEY not configured on the server" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "invalid JSON" }) };
  }

  const url      = (payload.url || "").trim();
  const question = (payload.question || "").trim();
  const wantsSummary = !!payload.summary || !question;

  if (!url) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "url required" }) };
  }

  // System prompt is tuned for grokpress's 65-year-old reader: plain English,
  // no internet snark, no 'great question!', no marketing speak.
  const system =
    "You are Grok, the X-native AI assistant, embedded inside grokpress — an AI-curated news site. " +
    "The reader is older (65+), legacy-media skeptical, and finds X overwhelming. Answer in PLAIN ENGLISH, " +
    "no internet snark, no 'great question!', no marketing speak. Get to the point in one or two short " +
    "paragraphs or 3-5 bullets. Use the x_search tool to actually read the post URL before answering. " +
    "If the post has bias or factual issues, name them. If the post is solid, say so. " +
    "Never refuse a reasonable question.";

  const userMsg = wantsSummary
    ? `Summarize this X post for me in 3-5 short bullets. What does it say, who's making the claim, ` +
      `and what should a reader know about its reliability?\n\nPost URL: ${url}`
    : `Post URL: ${url}\n\nMy question: ${question}`;

  let resp;
  try {
    resp = await fetch(XAI_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { role: "system", content: system },
          { role: "user",   content: userMsg },
        ],
        tools: [{ type: "x_search" }],
      }),
    });
  } catch (e) {
    return {
      statusCode: 502, headers: cors,
      body: JSON.stringify({ error: "xAI network error: " + e.message }),
    };
  }

  if (!resp.ok) {
    const errText = await resp.text();
    return {
      statusCode: 502, headers: cors,
      body: JSON.stringify({ error: `xAI HTTP ${resp.status}: ${errText.slice(0, 300)}` }),
    };
  }

  let data;
  try {
    data = await resp.json();
  } catch (e) {
    return {
      statusCode: 502, headers: cors,
      body: JSON.stringify({ error: "xAI returned non-JSON" }),
    };
  }

  // /v1/responses returns:
  //   { output: [{ type:"message", content:[{type:"output_text", text:"..."}] }], usage:{...} }
  let answer = "";
  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item && item.type === "message" && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c && (c.type === "output_text" || c.type === "text") && typeof c.text === "string") {
            answer += c.text;
          }
        }
      }
    }
  }
  if (!answer && typeof data.output_text === "string") {
    answer = data.output_text;
  }

  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({ answer: answer.trim() || "(empty response)", model: data.model || MODEL }),
  };
};
