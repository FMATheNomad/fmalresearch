export async function GET() {
  return new Response("Export via backend at /research/{id}/export?fmt=md", { status: 200 })
}
