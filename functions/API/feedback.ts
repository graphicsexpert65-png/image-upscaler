
interface Env {
  FEEDBACK_DB: D1Database;
}

interface FeedbackData {
  rating: number;
  stars?: string;
  comment?: string;
  scale?: string;
  mode?: string;
  processingTimeMs?: number;
  backendUsed?: string;
  deviceCategory?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const data = await request.json() as FeedbackData;

    if (
      !Number.isInteger(data.rating) ||
      data.rating < 1 ||
      data.rating > 5
    ) {
      return Response.json(
        { success: false, error: "Invalid rating" },
        { status: 400 }
      );
    }

    await env.FEEDBACK_DB.prepare(`
      INSERT INTO feedback (
        rating,
        stars,
        comment,
        scale,
        mode,
        processing_time_ms,
        backend_used,
        device_category,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.rating,
      data.stars ?? null,
      data.comment ?? null,
      data.scale ?? null,
      data.mode ?? null,
      data.processingTimeMs ?? null,
      data.backendUsed ?? null,
      data.deviceCategory ?? null,
      new Date().toISOString()
    ).run();

    return Response.json({ success: true });

  } catch (error) {
    console.error("Feedback API error:", error);

    return Response.json(
      { success: false, error: "Failed to save feedback" },
      { status: 500 }
    );
  }
};
