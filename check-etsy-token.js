/**
 * Etsy OAuth Diagnostic
 * Run from the project root: node check-etsy-token.js
 * Checks which Etsy account your refresh token belongs to.
 */

const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

console.log('── Env check ───────────────────────────────────');
console.log('ETSY_CLIENT_ID:   ', env.ETSY_CLIENT_ID || 'MISSING');
console.log('ETSY_SHARED_SECRET:', env.ETSY_SHARED_SECRET ? '***' + env.ETSY_SHARED_SECRET.slice(-3) : 'MISSING');
console.log('ETSY_REFRESH_TOKEN:', env.ETSY_REFRESH_TOKEN ? env.ETSY_REFRESH_TOKEN.slice(0, 20) + '...' : 'MISSING');
console.log('────────────────────────────────────────────────\n');

const xApiKey = env.ETSY_CLIENT_ID + ':' + env.ETSY_SHARED_SECRET;

(async () => {
  // ── Step 1: Refresh token ────────────────────────────────────────────────
  console.log('Step 1: Refreshing token...');
  const refreshRes = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env.ETSY_CLIENT_ID,
      refresh_token: env.ETSY_REFRESH_TOKEN,
    }),
  });

  const tokens = await refreshRes.json();
  if (!tokens.access_token) {
    console.error('Token refresh FAILED (status', refreshRes.status + '):');
    console.error(JSON.stringify(tokens, null, 2));
    process.exit(1);
  }
  console.log('✓ Got access_token\n');

  // ── Step 2: GET /users/me ────────────────────────────────────────────────
  console.log('Step 2: Fetching /users/me...');
  const meRes = await fetch('https://openapi.etsy.com/v3/application/users/me', {
    headers: {
      Authorization: 'Bearer ' + tokens.access_token,
      'x-api-key': xApiKey,
    },
  });
  const me = await meRes.json();

  if (!me.user_id) {
    console.error('Failed to fetch user (status', meRes.status + '):');
    console.error(JSON.stringify(me, null, 2));
    process.exit(1);
  }
  console.log('  user_id:     ', me.user_id);
  console.log('  login_name:  ', me.login_name);
  console.log('  primary_email:', me.primary_email || '(not returned)\n');

  // ── Step 3: GET /users/{user_id}/shops ──────────────────────────────────
  console.log('Step 3: Fetching shop for user', me.user_id + '...');
  const shopRes = await fetch(
    'https://openapi.etsy.com/v3/application/users/' + me.user_id + '/shops',
    {
      headers: {
        Authorization: 'Bearer ' + tokens.access_token,
        'x-api-key': xApiKey,
      },
    }
  );
  const shop = await shopRes.json();

  const shopId   = shop.shop_id   ?? shop.results?.[0]?.shop_id;
  const shopName = shop.shop_name ?? shop.results?.[0]?.shop_name;

  if (!shopId) {
    console.error('No shop found (status', shopRes.status + '):');
    console.error(JSON.stringify(shop, null, 2));
    process.exit(1);
  }
  console.log('  shop_id:  ', shopId);
  console.log('  shop_name:', shopName);

  // ── Result ───────────────────────────────────────────────────────────────
  console.log('\n── Result ──────────────────────────────────────');
  console.log('Token shop_id:          ', shopId);
  console.log('DailyRootsPrints shop_id:', 65522604);
  if (shopId == 65522604) {
    console.log('✓ MATCH — token belongs to DailyRootsPrints');
    console.log('  Uncomment ETSY_SHOP_ID=65522604 in .env.local and restart Next.js.');
  } else {
    console.log('✗ MISMATCH — token belongs to a different account!');
    console.log('  You need to re-run the OAuth flow while logged into DailyRootsPrints.');
    console.log('  Check get-etsy-token.js (or equivalent) in your project.');
  }
  console.log('────────────────────────────────────────────────');
})();
