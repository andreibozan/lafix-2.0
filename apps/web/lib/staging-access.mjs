// This outer gate protects a synthetic browser preview, independently of user roles.
export async function stagingAccess(header, env = process.env) {
  if (env.DEPLOYMENT_STAGE !== 'staging') return 'disabled';
  const password = env.STAGING_ACCESS_PASSWORD;
  if (!password || password.length < 20) return 'unconfigured';
  if (!header?.startsWith('Basic ')) return 'denied';
  try {
    const supplied = atob(header.slice(6));
    const expected = `preview:${password}`;
    const digest = async value => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
    const [left, right] = await Promise.all([digest(supplied), digest(expected)]);
    let difference = 0;
    for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
    return difference === 0 ? 'allowed' : 'denied';
  } catch { return 'denied'; }
}
