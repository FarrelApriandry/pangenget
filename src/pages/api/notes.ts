import type { APIRoute } from "astro";
import { db } from "../../db";
import { notes } from "../../db/schema";
import { desc } from "drizzle-orm";

export const GET: APIRoute = async () => {
  try {
    const allNotes = await db.select().from(notes).orderBy(desc(notes.createdAt));
    return new Response(
      JSON.stringify({
        success: true,
        data: allNotes,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Gagal mengambil data dari database.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Judul catatan wajib diisi." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Konten catatan wajib diisi." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const inserted = await db
      .insert(notes)
      .values({
        title: title.trim(),
        content: content.trim(),
      })
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        data: inserted[0],
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Gagal menyimpan data ke database.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
