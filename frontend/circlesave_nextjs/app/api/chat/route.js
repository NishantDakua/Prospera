/* Next.js API route — proxies chat requests to the Flask chatbot backend */

const FLASK_URL = process.env.CHATBOT_URL || "http://127.0.0.1:5000";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("[chat proxy] Sending request to:", `${FLASK_URL}/ask`);
    console.log("[chat proxy] Request body:", JSON.stringify(body));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const res = await fetch(`${FLASK_URL}/ask`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("[chat proxy] Response status:", res.status);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[chat proxy] Backend error:", err);
      return Response.json(
        { answer: err.error || "Backend error. Please try again." },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("[chat proxy] Success:", data.answer?.substring(0, 50) + "...");
    return Response.json(data);
  } catch (error) {
    console.error("[chat proxy] Exception:", error.message, error.name);
    if (error.name === 'AbortError') {
      return Response.json(
        { answer: "Request timed out. The AI service is taking too long to respond." },
        { status: 504 }
      );
    }
    return Response.json(
      { answer: "Connection error. Make sure the chatbot backend is running on port 5000." },
      { status: 502 }
    );
  }
}
