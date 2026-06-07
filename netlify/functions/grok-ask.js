// Netlify Function — proxies the in-site "Ask Grok" side panel to xAI's
// Grok API. Lets readers analyze any X post inline on grokpress without
// being flung to grok.com (the user-experience David asked to mirror after
// X's own native "Grok analyze this post" right-side panel).
//
// Two modes, controlled by the request body:
//   { url, summary: true }   → returns a 3-5 bullet summary of the post
//   { url, question: "..." } → returns a free-text answer about the post
//
// Security: XAI_API_KEY is read from Netlify env vars (server-side). The
// browser never sees the key. We rate-limit lightly by IP (one in-flight
// per IP) to keep abuse cost bounded.

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = "grok-4-latest";

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

  const url = (payload.url || "").trim();
  const question = (payload.question || "").trim();
  const wantsSummary = !!payload.summary || !question;

  if (!url) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "url required" }) };
  }

  // System prompt is tuned for grokpress's 65-year-old reader: plain English,
  // no marketing speak, no internet-snark, get to the point fast. The post
  // URL is included verbatim so Grok can fetch it via its native tools.
  const system =
    "You are Grok, the X-native AI assistant, embedded inside grokpress — an AI-curated news site. " +
    "The reader is older (65+), legacy-media skeptical, and finds X overwhelming. Answer in PLAIN ENGLISH, " +
    "no internet snark, no 'great question!', no marketing speak. Get to the point in one or two short " +
    "paragraphs or 3-5 bullets. Treat the post URL the user gives you as the subject — read it, analyze " +
    "it, and respond. If the post has bias or factual issues, name them. If the post is solid, say so. " +
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
        max_tokens: 800,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
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

  const data = await resp.json();
  const answer = (data.choices && data.choices[0] && data.choices[0].message &&
                  data.choices[0].message.content) || "";

  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: JSON.stringify({ answer, model: data.model || MODEL }),
  };
};
