/* ============================================================
   Sprout ✿ — per-plant link preview (Vercel serverless function)

   Shared links look like  /?share=<uuid>  . A vercel.json rewrite routes
   those requests here so crawlers (KakaoTalk, iMessage, Facebook, Twitter…)
   that don't run JavaScript still get plant-specific OpenGraph tags. Humans
   get the exact same SPA (index.html) — we just inject the meta into <head>,
   so the page then reads ?share and renders the plant client-side as usual.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://szufovxmmyvxfszmdukg.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dWZvdnhtbXl2eGZzem1kdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzM5ODQsImV4cCI6MjA5NDgwOTk4NH0.VjY-ESAiRo0ydExKCsTL__5WOO1-Vg2sgrWKQH_ZtM8';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchPlant(shareId) {
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_shared_plant`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_share_id: shareId }),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (_) {
    return null;
  }
}

module.exports = async (req, res) => {
  const share = (req.query && req.query.share) || '';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const origin = host ? `${proto}://${host}` : '';

  let title = 'Sprout ✿ — grow a plant with kind words';
  let desc = 'Send kind words and watch a little plant grow on Sprout ✿';

  if (share) {
    const data = await fetchPlant(share);
    if (data && (data.name || data.owner_name)) {
      const plant = (data.name && data.name.trim()) || 'a little plant';
      const owner = data.owner_name || 'someone';
      const count = data.leaf_count || 0;
      title = `${plant} ✿ — ${owner}'s plant on Sprout`;
      desc =
        count > 0
          ? `${count} ${count === 1 ? 'leaf' : 'leaves'} of kindness and growing. Add a kind word ✿`
          : `${owner} just planted a seed. Be the first to leave a kind word ✿`;
    }
  }

  const image = `${origin}/og-card.png`;
  const url = `${origin}/p/${encodeURIComponent(share)}`;
  const tags = [
    `<meta name="description" content="${escapeHtml(desc)}"/>`,
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="Sprout ✿"/>`,
    `<meta property="og:title" content="${escapeHtml(title)}"/>`,
    `<meta property="og:description" content="${escapeHtml(desc)}"/>`,
    `<meta property="og:image" content="${escapeHtml(image)}"/>`,
    `<meta property="og:url" content="${escapeHtml(url)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${escapeHtml(title)}"/>`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}"/>`,
    `<meta name="twitter:image" content="${escapeHtml(image)}"/>`,
  ].join('\n');

  let html;
  try {
    html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  } catch (_) {
    // index.html unavailable to the function — fall back to a tiny page that
    // carries the preview tags and bounces the human to the static app.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res
      .status(200)
      .send(
        `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
          title
        )}</title>${tags}<meta http-equiv="refresh" content="0; url=/index.html?share=${encodeURIComponent(
          share
        )}"/></head><body></body></html>`
      );
  }

  // strip the static default preview tags so they don't compete, then inject
  html = html.replace(
    /\s*<!-- default link preview[\s\S]*?<meta name="twitter:image"[^>]*>/,
    ''
  );
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  // served from /p/<id>: anchor relative asset URLs (styles.css, app.js…) to root
  if (!/<base /i.test(html)) html = html.replace('<head>', '<head>\n<base href="/"/>');
  html = html.replace('</head>', `${tags}\n</head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
};
