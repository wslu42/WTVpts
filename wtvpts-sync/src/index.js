export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (req.method !== "GET" && req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, env);
    }

    const origin = req.headers.get("Origin") || "";
    const isGet = req.method === "GET";
    const originAllowed = origin === env.ALLOWED_ORIGIN || (isGet && !origin);
    if (!originAllowed) {
      return json({ error: "Forbidden origin" }, 403, env);
    }

    let state = null;
    if (req.method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400, env);
      }
      state = body?.state;
      if (!state || typeof state !== "object") {
        return json({ error: "Missing state" }, 400, env);
      }
    }

    const owner = env.GH_OWNER;
    const repo = env.GH_REPO;
    const branch = env.GH_BRANCH || "main";
    const path = env.GH_PATH || "data.json";
    const token = env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return json({ error: "Worker env vars/secrets are missing." }, 500, env);
    }

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, {
      headers: ghHeaders(token)
    });
    if (!getRes.ok) {
      const t = await getRes.text();
      return json({ error: "Fetch current file failed", detail: t }, 502, env);
    }
    const current = await getRes.json();
    const sha = current.sha;

    if (req.method === "GET") {
      try {
        const raw = base64ToUtf8(String(current.content || ""));
        const state = JSON.parse(raw);
        return json({ ok: true, state, sha }, 200, env);
      } catch (error) {
        return json({ error: "Parse current file failed", detail: String(error?.message || error) }, 502, env);
      }
    }

    // 2) Update file with latest app state.
    const raw = JSON.stringify(state, null, 2) + "\n";
    const content = base64Utf8(raw);

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: ghHeaders(token),
      body: JSON.stringify({
        message: `chore: sync data.json from app (${new Date().toISOString()})`,
        content,
        sha,
        branch
      })
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      return json({ error: "Update file failed", detail: t }, 502, env);
    }

    const result = await putRes.json();
    return json({ ok: true, commit: result?.commit?.sha || null, sha: result?.content?.sha || null }, 200, env);
  }
};

function ghHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "wtvpts-sync-worker",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env)
    }
  });
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function base64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToUtf8(base64) {
  const normalized = base64.replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
