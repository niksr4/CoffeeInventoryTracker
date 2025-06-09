// Completely synchronous route with no imports
export function GET() {
  return new Response('{"status":"ok","message":"sync route working"}', {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
