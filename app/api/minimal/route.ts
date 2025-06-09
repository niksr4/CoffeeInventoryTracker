// Absolute minimal route - no imports, no async
export function GET() {
  return new Response('{"status":"ok"}', {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
