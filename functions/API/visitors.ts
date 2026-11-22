interface Env { FEEDBACK_DB: D1Database; }
function utcDay() { return new Date().toISOString().slice(0, 10); }
async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function ensureTable(env: Env) {
  await env.FEEDBACK_DB.prepare(`CREATE TABLE IF NOT EXISTS daily_visitors (
    visit_date TEXT NOT NULL, visitor_hash TEXT NOT NULL, PRIMARY KEY (visit_date, visitor_hash)
  )`).run();
}
async function getCount(env: Env, day: string) {
  const row = await env.FEEDBACK_DB.prepare("SELECT COUNT(*) AS count FROM daily_visitors WHERE visit_date = ?")
    .bind(day).first<{ count: number }>();
  return Number(row?.count ?? 0);
}
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try { const day = utcDay(); await ensureTable(env); return Response.json({ success: true, date: day, visitors: await getCount(env, day) }); }
  catch (error) { console.error("Visitor counter GET error:", error); return Response.json({ success: false, visitors: null }, { status: 503 }); }
};
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as { visitorToken?: string };
    const token = String(body?.visitorToken ?? "");
    if (token.length < 16 || token.length > 200) return Response.json({ success: false, error: "Invalid visitor token" }, { status: 400 });
    const day = utcDay(); await ensureTable(env); const hash = await hashToken(token);
    await env.FEEDBACK_DB.prepare("INSERT OR IGNORE INTO daily_visitors (visit_date, visitor_hash) VALUES (?, ?)")
      .bind(day, hash).run();
    return Response.json({ success: true, date: day, visitors: await getCount(env, day) });
  } catch (error) { console.error("Visitor counter POST error:", error); return Response.json({ success: false, visitors: null }, { status: 503 }); }
};
