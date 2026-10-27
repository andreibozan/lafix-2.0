import {NextRequest, NextResponse} from 'next/server';
import {stagingAccess} from './lib/staging-access.mjs';

export async function middleware(request: NextRequest) {
  if (process.env.DEPLOYMENT_STAGE !== 'staging') return NextResponse.next();
  // A platform health probe gets connectivity status only, never domain data.
  if (request.method === 'GET' && request.nextUrl.pathname === '/api/health') {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
  const access = await stagingAccess(request.headers.get('authorization'));
  let response: NextResponse;
  if (access === 'unconfigured') {
    response = new NextResponse('Previzualizarea nu este încă configurată.', {status: 503});
  } else if (access !== 'allowed') {
    response = new NextResponse('Acces restricționat la versiunea de test.', {
      status: 401,
      headers: {'WWW-Authenticate': 'Basic realm="LaFix test", charset="UTF-8"'},
    });
  } else response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const config = {matcher: '/:path*'};
