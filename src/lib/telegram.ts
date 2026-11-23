/**
 * Telegram Bot Notification Service for Pangenget
 * Uses node:https for rock-solid reliability across Node.js SSR and Bun environments.
 */

import https from "node:https";

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || "9003756956:AAHCGJjFDG71SNpsW895Na_TRo0grA1YJmU";
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Robust JSON POST to Telegram API via node:https
 */
function postToTelegram(endpoint: string, payload: any): Promise<any> {
  const url = new URL(`${TELEGRAM_API_BASE}/${endpoint}`);
  const postData = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 10000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ ok: false, description: body || res.statusMessage });
          }
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Koneksi ke Telegram API timed out (10s)."));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send a message to a specific Telegram chat ID
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: { parseMode?: "HTML" | "Markdown" } = { parseMode: "HTML" }
): Promise<TelegramSendResult> {
  if (!chatId) {
    return { success: false, error: "Telegram Chat ID tidak boleh kosong." };
  }

  try {
    const data = await postToTelegram("sendMessage", {
      chat_id: String(chatId).trim(),
      text,
      parse_mode: options.parseMode || "HTML",
      disable_web_page_preview: true,
    });

    if (!data.ok) {
      const description = data.description || "Gagal mengirim pesan ke Telegram.";
      if (description.includes("chat not found")) {
        return {
          success: false,
          error:
            "Chat ID tidak ditemukan. Pastikan Anda sudah membuka bot @pangenget_bot dan menekan tombol Start.",
        };
      }
      return { success: false, error: description };
    }

    return {
      success: true,
      messageId: data.result?.message_id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Terjadi kesalahan jaringan saat menghubungi Telegram API.",
    };
  }
}

/**
 * Send an immediate test message to verify the connection
 */
export async function sendTestMessage(
  chatId: string | number,
  userName: string = "Sahabat"
): Promise<TelegramSendResult> {
  const message = `
🔔 <b>Pangenget — Tes Notifikasi Berhasil!</b>
━━━━━━━━━━━━━━━━━━━━━
Halo <b>${escapeHtml(userName)}</b>! 👋

Akun Telegram Anda berhasil terhubung dengan <b>Pangenget Task Manager</b>.
Mulai sekarang, Anda akan menerima pengingat otomatis jika ada tugas yang mendekati tenggat waktu (H-24 Jam dan H-1 Jam).

⚡ <i>Fokus, Kerjakan, Bereskan.</i>
`.trim();

  return sendTelegramMessage(chatId, message, { parseMode: "HTML" });
}

/**
 * Send a structured task deadline reminder
 */
export async function sendDeadlineReminder(
  chatId: string | number,
  task: {
    title: string;
    category?: string | null;
    priority?: string | null;
    dueDate?: Date | null;
  },
  windowType: "24h" | "1h"
): Promise<TelegramSendResult> {
  const priorityEmoji =
    task.priority === "urgent"
      ? "🚨"
      : task.priority === "high"
      ? "⚡"
      : task.priority === "low"
      ? "☕"
      : "📌";

  const priorityLabel = (task.priority || "medium").toUpperCase();

  const formattedDueDate = task.dueDate
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(task.dueDate)) + " WIB"
    : "Hari ini";

  const headerTitle =
    windowType === "1h"
      ? "⚠️ <b>PERINGATAN TENGGAT: 1 JAM LAGI!</b>"
      : "⏰ <b>PENGINGAT TENGGAT TUGAS (H-24 JAM)</b>";

  const message = `
${headerTitle}
━━━━━━━━━━━━━━━━━━━━━
${priorityEmoji} <b>${escapeHtml(task.title)}</b>

🏷️ Kategori: <code>#${escapeHtml(task.category || "Umum")}</code>
📊 Prioritas: <b>${priorityLabel}</b>
⏳ Tenggat: <b>${formattedDueDate}</b>

<i>Segera buka Pangenget untuk menyelesaikan tugas Anda sebelum tenggat berakhir.</i>
`.trim();

  return sendTelegramMessage(chatId, message, { parseMode: "HTML" });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
