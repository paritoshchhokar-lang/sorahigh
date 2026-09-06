const JSON_HEADERS = {
  'content-type': 'application/json; charset=UTF-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

function reply(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function hash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  if (!env.TURNSTILE_SECRET || !env.ENQUIRIES_DB || !env.IP_HASH_SALT) {
    return reply({ error: 'Enquiries are not configured yet.' }, 503);
  }

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return reply({ error: 'Cross-site requests are not allowed.' }, 403);
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return reply({ error: 'Invalid request format.' }, 415);
  }

  let body;
  try { body = await request.json(); } catch { return reply({ error: 'Invalid request.' }, 400); }

  const enquiry = {
    name: clean(body.name, 100),
    email: clean(body.email, 254).toLowerCase(),
    trip: clean(body.trip, 100),
    timing: clean(body.timing, 100),
    group: clean(body.group, 100),
    page: clean(body.page, 500),
  };
  if (!enquiry.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email) || !enquiry.trip || !enquiry.timing || !enquiry.group) {
    return reply({ error: 'Please complete every required field.' }, 400);
  }

  const token = clean(body.turnstileToken, 2048);
  const ip = request.headers.get('CF-Connecting-IP') || '';
  let verification;
  try {
    verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
    }).then((response) => response.json());
  } catch {
    return reply({ error: 'The security check is temporarily unavailable. Please try again.' }, 503);
  }
  if (!verification.success) return reply({ error: 'Please complete the security check and try again.' }, 403);

  // Limit each anonymised address to three requests per 15-minute window.
  const ipHash = await hash(`${env.IP_HASH_SALT}:${ip}`);
  const windowStart = Math.floor(Date.now() / 900000) * 900000;
  const existing = await env.ENQUIRIES_DB.prepare(
    'SELECT request_count FROM enquiry_rate_limits WHERE ip_hash = ? AND window_start = ?'
  ).bind(ipHash, windowStart).first();
  if (existing && existing.request_count >= 3) return reply({ error: 'Please wait a few minutes before sending another enquiry.' }, 429);
  if (existing) {
    await env.ENQUIRIES_DB.prepare(
      'UPDATE enquiry_rate_limits SET request_count = request_count + 1 WHERE ip_hash = ? AND window_start = ?'
    ).bind(ipHash, windowStart).run();
  } else {
    await env.ENQUIRIES_DB.prepare(
      'INSERT INTO enquiry_rate_limits (ip_hash, window_start, request_count) VALUES (?, ?, 1)'
    ).bind(ipHash, windowStart).run();
  }

  await env.ENQUIRIES_DB.prepare(
    'INSERT INTO enquiries (created_at, name, email, trip, timing, group_size, page) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(Date.now(), enquiry.name, enquiry.email, enquiry.trip, enquiry.timing, enquiry.group, enquiry.page).run();

  return reply({ ok: true });
}

export function onRequest() {
  return reply({ error: 'Method not allowed.' }, 405);
}
