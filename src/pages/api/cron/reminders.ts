import type { APIRoute } from "astro";
import { processTaskReminders } from "../../../lib/reminders";

export const ALL: APIRoute = async ({ request }) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const secretHeader = request.headers.get("x-cron-secret");

    // Protect endpoint if CRON_SECRET is configured
    if (cronSecret) {
      const isAuthorized =
        secretHeader === cronSecret ||
        authHeader === `Bearer ${cronSecret}`;

      if (!isAuthorized) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized access to cron runner." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const summary = await processTaskReminders();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pemeriksaan tenggat tugas Telegram selesai diproses.",
        summary,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Gagal memproses pemeriksaan notifikasi.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
