import type { APIRoute } from "astro";
import { sendTestMessage } from "../../../lib/telegram";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { chatId, userName } = body;

    if (!chatId || !String(chatId).trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Telegram Chat ID wajib diisi sebelum melakukan pengujian.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await sendTestMessage(String(chatId).trim(), userName || "Sahabat");

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pesan pengujian berhasil dikirim ke akun Telegram Anda!",
        messageId: result.messageId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Gagal mengirim pesan pengujian.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
