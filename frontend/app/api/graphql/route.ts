export const dynamic = 'force-dynamic';

// Proxies GraphQL requests to the backend at runtime (BACKEND_URL),
// so the browser never needs to know the backend address.
export async function POST(req: Request) {
  const url = process.env.BACKEND_URL || 'http://localhost:4000/graphql';
  const auth = req.headers.get('authorization');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) },
      body: await req.text(),
      cache: 'no-store',
    });
    return new Response(await res.text(), { status: res.status, headers: { 'content-type': 'application/json' } });
  } catch {
    return Response.json({ errors: [{ message: 'Backend is unreachable' }] }, { status: 502 });
  }
}
