// Lazy import to prevent crashes at module load time
let handlers: any = null;

async function getHandlers() {
  if (!handlers) {
    const authModule = await import("@/lib/auth");
    handlers = authModule.handlers;
  }
  return handlers;
}

export async function GET(request: Request) {
  try {
    const handlers = await getHandlers();
    return handlers.GET(request);
  } catch (error: any) {
    console.error("NextAuth GET error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Authentication error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  try {
    const handlers = await getHandlers();
    return handlers.POST(request);
  } catch (error: any) {
    console.error("NextAuth POST error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Authentication error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

