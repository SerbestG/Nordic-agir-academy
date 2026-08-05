// api/admin-delete.js — tar bort test-/felrader ur enrollments (endast admin).
// Body: { token, ids:[...] } för enskilda rader ELLER { token, orderRef } för hel order.

const SUPA = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { token, ids, orderRef } = req.body || {};
    if (!token || (!Array.isArray(ids) && !orderRef)) return res.status(400).json({ error: 'Ofullständig begäran' });
    if (Array.isArray(ids) && (ids.length < 1 || ids.length > 100)) return res.status(400).json({ error: 'Ogiltigt antal rader' });

    const userRes = await fetch(`${SUPA}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
    if (!userRes.ok) return res.status(401).json({ error: 'Ogiltig inloggning' });
    const caller = await userRes.json();
    const admRes = await fetch(
      `${SUPA}/rest/v1/admins?email=eq.${encodeURIComponent((caller.email || '').toLowerCase())}&select=email`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
    );
    const adm = admRes.ok ? await admRes.json() : [];
    if (!adm.length) return res.status(403).json({ error: 'Kontot saknar adminbehörighet' });

    const filter = Array.isArray(ids)
      ? `id=in.(${ids.map((x) => encodeURIComponent(x)).join(',')})`
      : `order_ref=eq.${encodeURIComponent(orderRef)}`;
    const del = await fetch(`${SUPA}/rest/v1/enrollments?${filter}`, {
      method: 'DELETE',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'return=representation' },
    });
    if (!del.ok) {
      console.error('RADERINGSFEL', del.status, await del.text().catch(() => ''));
      return res.status(502).json({ error: 'Raderingen misslyckades' });
    }
    const borttagna = await del.json().catch(() => []);
    console.log('ADMIN-RADERING av', caller.email, '→', borttagna.length, 'rader', orderRef || '');
    return res.status(200).json({ ok: true, deleted: borttagna.length });
  } catch (err) {
    console.error('admin-delete:', err.message);
    return res.status(500).json({ error: 'Något gick fel' });
  }
}
