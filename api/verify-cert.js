// api/verify-cert.js
// Publik verifiering av certifikat via QR-koden.
// Returnerar ENDAST namn, kurs och datum — aldrig e-post eller personnummer.

const SUPA = (process.env.SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id = String(req.query.id || '').trim();
  if (!id || id.length > 40 || !/^[A-Za-z0-9-]+$/.test(id)) {
    return res.status(200).json({ valid: false });
  }

  try {
    const r = await fetch(
      `${SUPA}/rest/v1/enrollments?cert_id=eq.${encodeURIComponent(id)}&status=eq.klar&select=name,cert_id,cert_date,courses(title)&limit=1`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    const rows = r.ok ? await r.json() : [];
    if (!rows.length || !rows[0].cert_date) return res.status(200).json({ valid: false });

    const row = rows[0];
    const certDate = row.cert_date;
    const validTo = certDate.slice(0, 4) * 1 + 5 + certDate.slice(4); // +5 år

    // Kursnamnet på certifikatet: huvudnamnet utan tilläggstext
    const full = row.courses?.title || '';
    const course = full.includes('APV') ? 'Arbete på väg — APV Steg 1' : full.split(' — ')[0] || 'Distanskurs';

    return res.status(200).json({
      valid: true,
      certId: row.cert_id,
      name: row.name,
      course,
      certDate,
      validTo: String(validTo),
    });
  } catch (err) {
    console.error('verify-cert:', err.message);
    return res.status(200).json({ valid: false });
  }
}
