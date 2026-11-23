import type { APIRoute } from "astro";
import { db } from "../../../db";
import { notes } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: "ID catatan tidak ditemukan." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const deleted = await db.delete(notes).where(eq(notes.id, id)).returning();
    if (deleted.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Catatan tidak ditemukan." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Catatan berhasil dihapus." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: "ID catatan tidak ditemukan." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === "string") updatePayload.title = body.title.trim();
    if (typeof body.content === "string") updatePayload.content = body.content.trim();
    if (typeof body.isPinned === "boolean") updatePayload.isPinned = body.isPinned;

    const updated = await db
      .update(notes)
      .set(updatePayload)
      .where(eq(notes.id, id))
      .returning();

    if (updated.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Catatan tidak ditemukan." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: updated[0] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
