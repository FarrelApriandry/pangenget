import type { APIRoute } from "astro";
import { db } from "../../../db";
import { userSettings } from "../../../db/schema";
import { eq } from "drizzle-orm";

function getUserId(request: Request, cookies: any): string | null {
  return request.headers.get("x-user-id") || cookies.get("pangenget_user_id")?.value || null;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = getUserId(request, cookies);
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    return new Response(
      JSON.stringify({
        success: true,
        data: settings || {
          userId,
          telegramChatId: "",
          telegramUsername: "",
          telegramEnabled: true,
          remind24h: true,
          remind1h: true,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Gagal mengambil pengaturan pengguna." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = getUserId(request, cookies);
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { telegramChatId, telegramUsername, telegramEnabled, remind24h, remind1h } = body;

    const payload = {
      userId,
      telegramChatId: typeof telegramChatId === "string" ? telegramChatId.trim() : null,
      telegramUsername: typeof telegramUsername === "string" ? telegramUsername.trim() : null,
      telegramEnabled: typeof telegramEnabled === "boolean" ? telegramEnabled : true,
      remind24h: typeof remind24h === "boolean" ? remind24h : true,
      remind1h: typeof remind1h === "boolean" ? remind1h : true,
      updatedAt: new Date(),
    };

    // Upsert into user_settings
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    let saved;
    if (existing) {
      [saved] = await db
        .update(userSettings)
        .set(payload)
        .where(eq(userSettings.userId, userId))
        .returning();
    } else {
      [saved] = await db
        .insert(userSettings)
        .values(payload)
        .returning();
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: saved,
        message: "Pengaturan Telegram berhasil disimpan.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Gagal menyimpan pengaturan." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
