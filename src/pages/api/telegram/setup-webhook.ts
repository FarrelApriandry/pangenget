import type { APIRoute } from "astro";
import { setTelegramWebhook, getTelegramWebhookInfo } from "../../../lib/telegram";

export const GET: APIRoute = async ({ url }) => {
  try {
    const action = url.searchParams.get("action");
    const customUrl = url.searchParams.get("url");

    if (action === "info") {
      const info = await getTelegramWebhookInfo();
      return new Response(JSON.stringify(info, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const webhookTarget = customUrl || "https://pangenget.vercel.app/api/telegram/webhook";
    const result = await setTelegramWebhook(webhookTarget);

    return new Response(
      JSON.stringify(
        {
          success: result.success,
          targetUrl: webhookTarget,
          result,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }, null, 2),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
