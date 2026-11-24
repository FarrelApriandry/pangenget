import type { APIRoute } from "astro";
import { db } from "../../../db";
import { tasks, userSettings, categories as categoriesTable } from "../../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  sendTelegramMessage,
  answerCallbackQuery,
  editTelegramMessageText,
} from "../../../lib/telegram";
import { parseNaturalLanguageTask } from "../../../utils/nlpParser";
import { calculateNextDueDate } from "../../../utils/recurring";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // 1. Handle Callback Query (Klik Tombol Inline Keyboard)
    if (body.callback_query) {
      const cq = body.callback_query;
      const data = cq.data || "";
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;

      if (data.startsWith("done:") && chatId && messageId) {
        const taskId = data.replace("done:", "").trim();

        // Cari task di DB
        const existingTask = await db
          .select()
          .from(tasks)
          .where(eq(tasks.id, taskId))
          .limit(1);

        if (existingTask.length === 0 || !existingTask[0]) {
          await answerCallbackQuery(cq.id, "Tugas tidak ditemukan atau telah dihapus.", true);
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        const task = existingTask[0];

        // Jika sudah selesai
        if (task.isCompleted) {
          await answerCallbackQuery(cq.id, "Tugas ini sudah diselesaikan sebelumnya.");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        // Update task jadi completed
        await db
          .update(tasks)
          .set({
            isCompleted: true,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, taskId));

        // Check if recurring task
        let nextRecurringNotice = "";
        if (task.repeatType && task.repeatType !== "none") {
          try {
            const nextDueDate = calculateNextDueDate(task.dueDate, task.repeatType);
            const resetSubtasks = Array.isArray(task.subtasks)
              ? task.subtasks.map((s: any) => ({ ...s, isCompleted: false }))
              : [];

            await db.insert(tasks).values({
              userId: task.userId,
              title: task.title,
              description: task.description,
              priority: task.priority,
              category: task.category,
              repeatType: task.repeatType,
              dueDate: nextDueDate,
              subtasks: resetSubtasks,
              isPinned: task.isPinned,
              isCompleted: false,
              telegramReminded24h: false,
              telegramReminded1h: false,
            });

            nextRecurringNotice = "\n🔁 <i>Tugas rutin berikutnya otomatis dijadwalkan ulang!</i>";
          } catch (rErr) {
            console.error("Gagal create next recurring in webhook:", rErr);
          }
        }

        await answerCallbackQuery(cq.id, "🎉 Mantap! Tugas berhasil diselesaikan.");

        // Edit pesan di Telegram agar mencerminkan status selesai
        const originalText = cq.message?.text || task.title;
        const updatedMessage = `
<s>${escapeHtml(originalText)}</s>

✅ <b>Telah diselesaikan via Telegram!</b>${nextRecurringNotice}
⚡ <i>Fokus, Kerjakan, Bereskan.</i>
        `.trim();

        await editTelegramMessageText(chatId, messageId, updatedMessage, {
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "🌐 Buka Pangenget Web",
                  url: "https://pangenget.vercel.app",
                },
              ],
            ],
          },
        });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // 2. Handle Incoming Message (Chat / Command)
    if (body.message && body.message.text) {
      const msg = body.message;
      const chatId = msg.chat?.id;
      const rawText = msg.text.trim();
      const firstName = msg.from?.first_name || "Sahabat";

      if (!chatId) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Cari user terkait dari tabel userSettings
      const userSetting = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.telegramChatId, String(chatId)))
        .limit(1);

      const matchedUser = userSetting[0];

      // Jika user belum terdaftar / belum menghubungkan Chat ID
      if (!matchedUser || !matchedUser.userId) {
        const welcomeUnlinked = `
🌱 <b>Selamat Datang di Pangenget Bot!</b>
━━━━━━━━━━━━━━━━━━━━━
Halo <b>${escapeHtml(firstName)}</b>! 👋

Telegram Chat ID Anda adalah:
<code>${chatId}</code>

Akun Telegram Anda belum terhubung dengan akun Pangenget Web Anda.

<b>Cara Menghubungkan:</b>
1. Kunjungi <a href="https://pangenget.vercel.app">pangenget.vercel.app</a>
2. Masuk ke akun Anda &amp; buka <b>Pengaturan Akun</b> (ikon Gear di pojok kanan atas)
3. Masukkan Chat ID: <code>${chatId}</code> lalu simpan.

Setelah terhubung, Anda dapat mencatat tugas langsung dari Telegram dan menerima pengingat tenggat otomatis! ⚡
        `.trim();

        await sendTelegramMessage(chatId, welcomeUnlinked, {
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "🌐 Buka Pangenget Web",
                  url: "https://pangenget.vercel.app",
                },
              ],
            ],
          },
        });

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const activeUserId = matchedUser.userId;

      // Handle Command: /start
      if (rawText === "/start") {
        const welcomeLinked = `
🌱 <b>Pangenget — Asisten Tugas Anda</b>
━━━━━━━━━━━━━━━━━━━━━
Halo <b>${escapeHtml(firstName)}</b>! Akun Anda telah terhubung aktif. ⚡

<b>Perintah yang dapat digunakan:</b>
• <code>/today</code> atau <code>/hariini</code> — Tugas aktif hari ini &amp; tombol selesai
• <code>/list</code> — Ringkasan tugas aktif
• <code>/tambah &lt;tugas&gt;</code> — Catat tugas baru
• <code>/help</code> — Panduan sintaks cerdas

💡 <b>Quick Capture:</b>
Anda juga dapat langsung mengetik tugas apa saja di chat ini tanpa perintah khusus, contoh:
<code>Beli buku referensi besok jam 15:00 !urgent #kuliah</code>
        `.trim();

        await sendTelegramMessage(chatId, welcomeLinked, {
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                { text: "📋 Tugas Hari Ini", callback_data: "cmd:today" },
                { text: "🌐 Buka Web", url: "https://pangenget.vercel.app" },
              ],
            ],
          },
        });

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Handle Command: /help
      if (rawText === "/help") {
        const helpText = `
📖 <b>Panduan Format Cerdas Pangenget:</b>
━━━━━━━━━━━━━━━━━━━━━
Bot secara otomatis mengenali prioritas, kategori, dan tenggat waktu:

📊 <b>Prioritas:</b>
• <code>!urgent</code> atau <code>!darurat</code>
• <code>!tinggi</code> atau <code>!high</code>
• <code>!sedang</code> atau <code>!med</code>
• <code>!rendah</code> atau <code>!low</code>

🏷️ <b>Kategori:</b>
• Gunakan tag pagar, misal: <code>#kerja</code>, <code>#kuliah</code>, <code>#belanja</code>

⏳ <b>Waktu / Tenggat:</b>
• <code>hari ini</code>, <code>besok</code>, <code>lusa</code>, <code>senin</code>
• <code>jam 14:00</code>, <code>jam 5 sore</code>, <code>17:30</code>

<b>Contoh:</b>
<code>Kirim laporan keuangan lusa jam 10:00 !urgent #kantor</code>
        `.trim();

        await sendTelegramMessage(chatId, helpText, { parseMode: "HTML" });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Handle Command: /today atau /hariini
      if (rawText === "/today" || rawText === "/hariini" || rawText === "cmd:today") {
        const activeTasks = await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.userId, activeUserId), eq(tasks.isCompleted, false)))
          .orderBy(desc(tasks.isPinned), desc(tasks.createdAt));

        if (activeTasks.length === 0) {
          await sendTelegramMessage(
            chatId,
            `🎉 <b>Semua tugas beres!</b>\nTidak ada tugas aktif yang tersisa. Waktunya istirahat sejenak ☕`,
            {
              parseMode: "HTML",
              replyMarkup: {
                inline_keyboard: [
                  [{ text: "🌐 Buka Pangenget Web", url: "https://pangenget.vercel.app" }],
                ],
              },
            }
          );
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        let messageText = `📋 <b>Tugas Aktif Anda (${activeTasks.length} tugas):</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
        const keyboardRows: any[] = [];

        activeTasks.slice(0, 8).forEach((t, idx) => {
          const prioEmoji =
            t.priority === "urgent"
              ? "🚨"
              : t.priority === "high"
              ? "⚡"
              : t.priority === "low"
              ? "☕"
              : "📌";
          const cat = t.category && t.category !== "Semua Tugas" ? `[#${t.category}]` : "";
          messageText += `${idx + 1}. ${prioEmoji} <b>${escapeHtml(t.title)}</b> ${cat}\n`;

          keyboardRows.push([
            {
              text: `✅ Selesai: ${t.title.slice(0, 20)}${t.title.length > 20 ? "..." : ""}`,
              callback_data: `done:${t.id}`,
            },
          ]);
        });

        keyboardRows.push([
          { text: "🌐 Buka Pangenget Web", url: "https://pangenget.vercel.app" },
        ]);

        await sendTelegramMessage(chatId, messageText.trim(), {
          parseMode: "HTML",
          replyMarkup: { inline_keyboard: keyboardRows },
        });

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Handle Command: /list atau /tugas
      if (rawText === "/list" || rawText === "/tugas") {
        const activeTasks = await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.userId, activeUserId), eq(tasks.isCompleted, false)))
          .orderBy(desc(tasks.isPinned), desc(tasks.createdAt))
          .limit(10);

        if (activeTasks.length === 0) {
          await sendTelegramMessage(
            chatId,
            `🎉 <b>Daftar tugas kosong!</b>\nSemua tugas sudah beres atau belum ada tugas yang dicatat.`,
            { parseMode: "HTML" }
          );
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        let messageText = `📝 <b>Ringkasan Tugas Anda:</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
        const keyboardRows: any[] = [];

        activeTasks.forEach((t, idx) => {
          messageText += `${idx + 1}. <b>${escapeHtml(t.title)}</b> (${t.priority})\n`;
          keyboardRows.push([
            {
              text: `✅ Selesai: ${t.title.slice(0, 20)}`,
              callback_data: `done:${t.id}`,
            },
          ]);
        });

        keyboardRows.push([
          { text: "🌐 Buka Pangenget Web", url: "https://pangenget.vercel.app" },
        ]);

        await sendTelegramMessage(chatId, messageText.trim(), {
          parseMode: "HTML",
          replyMarkup: { inline_keyboard: keyboardRows },
        });

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Handle /tambah <teks> atau Quick Capture Teks Biasa
      let taskInputText = rawText;
      if (taskInputText.startsWith("/tambah")) {
        taskInputText = taskInputText.replace(/^\/tambah\s*/i, "").trim();
      }

      if (!taskInputText) {
        await sendTelegramMessage(
          chatId,
          "⚠️ Silakan masukkan judul tugas Anda. Contoh:\n<code>/tambah Siapkan bahan presentasi besok jam 09:00 !urgent #kerja</code>",
          { parseMode: "HTML" }
        );
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Detect repeat type in text
      let repeatType: "none" | "daily" | "weekdays" | "weekly" | "monthly" = "none";
      if (/!(harian|daily|tiap-hari)\b/i.test(taskInputText)) {
        repeatType = "daily";
      } else if (/!(hari-kerja|weekdays)\b/i.test(taskInputText)) {
        repeatType = "weekdays";
      } else if (/!(mingguan|weekly|tiap-minggu)\b/i.test(taskInputText)) {
        repeatType = "weekly";
      } else if (/!(bulanan|monthly|tiap-bulan)\b/i.test(taskInputText)) {
        repeatType = "monthly";
      }

      // Jalankan NLP Parser
      const parsed = parseNaturalLanguageTask(taskInputText);
      const title = parsed.cleanTitle || taskInputText;
      const priority = parsed.priority || "medium";
      const category = parsed.category || "Semua Tugas";
      const dueDate = parsed.dueDate || null;

      // Simpan ke Neon DB
      const inserted = await db
        .insert(tasks)
        .values({
          userId: activeUserId,
          title,
          description: null,
          priority,
          category,
          repeatType,
          dueDate,
          isCompleted: false,
          isPinned: false,
          subtasks: [],
          telegramReminded24h: false,
          telegramReminded1h: false,
        })
        .returning();

      const newTask = inserted[0];
      const newTaskId = newTask ? newTask.id : "";

      // Jika ada kategori baru yang belum tersimpan di tabel categories, daftarkan
      if (category && category !== "Semua Tugas") {
        try {
          const existingCat = await db
            .select()
            .from(categoriesTable)
            .where(
              and(
                eq(categoriesTable.userId, activeUserId),
                eq(categoriesTable.name, category)
              )
            )
            .limit(1);

          if (existingCat.length === 0) {
            await db.insert(categoriesTable).values({
              userId: activeUserId,
              name: category,
            });
          }
        } catch {
          // Ignore duplicate constraint
        }
      }

      const formattedDueDate = dueDate
        ? new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            weekday: "long",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(dueDate) + " WIB"
        : "Tidak ditentukan";

      const priorityEmoji =
        priority === "urgent"
          ? "🚨"
          : priority === "high"
          ? "⚡"
          : priority === "low"
          ? "☕"
          : "📌";

      const replyConfirm = `
✅ <b>Tugas Berhasil Dicatat!</b>
━━━━━━━━━━━━━━━━━━━━━
${priorityEmoji} <b>${escapeHtml(title)}</b>

🏷️ Kategori: <code>#${escapeHtml(category)}</code>
📊 Prioritas: <b>${priority.toUpperCase()}</b>
⏳ Tenggat: <b>${formattedDueDate}</b>

<i>Tersinkronisasi otomatis dengan Dashboard Pangenget Web Anda.</i>
      `.trim();

      const replyKeyboardRows: any[] = [];
      if (newTaskId) {
        replyKeyboardRows.push([
          { text: "✅ Tandai Selesai", callback_data: `done:${newTaskId}` },
        ]);
      }
      replyKeyboardRows.push([
        { text: "🌐 Lihat di Web", url: "https://pangenget.vercel.app" },
      ]);

      await sendTelegramMessage(chatId, replyConfirm, {
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: replyKeyboardRows,
        },
      });

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 200, // Return 200 to acknowledge Telegram even on error
    });
  }
};
