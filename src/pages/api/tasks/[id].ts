import type { APIRoute } from "astro";
import { db } from "../../../db";
import { tasks } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

function getUserId(request: Request, cookies: any): string | null {
  return request.headers.get("x-user-id") || cookies.get("pangenget_user_id")?.value || null;
}

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ success: false, error: "ID tugas tidak ditemukan." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const userId = getUserId(request, cookies);
    const condition = userId ? and(eq(tasks.id, id), eq(tasks.userId, userId)) : eq(tasks.id, id);

    const deleted = await db.delete(tasks).where(condition).returning();
    if (deleted.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Tugas tidak ditemukan atau Anda tidak memiliki akses." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tugas berhasil dihapus.",
        data: deleted[0],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ success: false, error: "ID tugas tidak ditemukan." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === "string") {
      updatePayload.title = body.title.trim();
    }
    if (typeof body.description !== "undefined") {
      updatePayload.description = body.description ? body.description.trim() : null;
    }
    if (typeof body.isCompleted === "boolean") {
      updatePayload.isCompleted = body.isCompleted;
      updatePayload.completedAt = body.isCompleted ? new Date() : null;
    }
    if (typeof body.isPinned === "boolean") {
      updatePayload.isPinned = body.isPinned;
    }
    if (body.priority && ["low", "medium", "high", "urgent"].includes(body.priority)) {
      updatePayload.priority = body.priority;
    }
    if (typeof body.category === "string") {
      updatePayload.category = body.category.trim() || "Semua Tugas";
    }
    if (Array.isArray(body.subtasks)) {
      updatePayload.subtasks = body.subtasks;
    }
    if (typeof body.dueDate !== "undefined") {
      updatePayload.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      // Reset reminder flags when due date changes so user gets notified for the new schedule
      updatePayload.telegramReminded24h = false;
      updatePayload.telegramReminded1h = false;
    }

    const userId = getUserId(request, cookies);
    const condition = userId ? and(eq(tasks.id, id), eq(tasks.userId, userId)) : eq(tasks.id, id);

    const updated = await db
      .update(tasks)
      .set(updatePayload)
      .where(condition)
      .returning();

    if (updated.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Tugas tidak ditemukan atau Anda tidak memiliki akses." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: updated[0] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
