import type { APIRoute } from "astro";
import { db } from "../../db";
import { accessRequests } from "../../db/schema";
import nodemailer from "nodemailer";

const TARGET_EMAIL = "fapriandry@gmail.com";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, message } = body;

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanMessage = typeof message === "string" ? message.trim() : "";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Alamat email tidak valid." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!cleanMessage) {
      return new Response(
        JSON.stringify({ success: false, error: "Detail pesan tidak boleh kosong." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Simpan permintaan ke Neon Database
    const [inserted] = await db
      .insert(accessRequests)
      .values({
        email: cleanEmail,
        message: cleanMessage,
        status: "pending",
      })
      .returning();

    // 2. Jika konfigurasi SMTP tersedia di .env, kirim email langsung
    let emailSent = false;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Pangenget Notification" <${smtpUser}>`,
          to: TARGET_EMAIL,
          replyTo: cleanEmail,
          subject: `[Pangenget] Permintaan Akses / Pesan Baru dari ${cleanEmail}`,
          text: `Halo,\n\nAda permintaan akses baru untuk Pangenget dari: ${cleanEmail}\n\nDetail Pesan:\n${cleanMessage}\n\nWaktu: ${new Date().toLocaleString("id-ID")}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #059669;">Permintaan Akses Baru di Pangenget</h2>
              <p><strong>Pengirim:</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="white-space: pre-wrap; margin: 0;">${cleanMessage}</p>
              </div>
              <p style="font-size: 12px; color: #6b7280;">Diterima pada ${new Date().toLocaleString("id-ID")}</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error("Gagal mengirim notifikasi email SMTP:", mailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: inserted,
        emailSent,
        targetEmail: TARGET_EMAIL,
        message: `Pesan dan permintaan akses berhasil dikirim ke ${TARGET_EMAIL}.`,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Gagal memproses pengiriman pesan.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
