import type { APIRoute } from "astro";
import { db } from "../../db";
import { tasks } from "../../db/schema";
import { desc, asc, eq, and, isNull } from "drizzle-orm";

function getUserId(request: Request, cookies: any): string | null {
  return request.headers.get("x-user-id") || cookies.get("pangenget_user_id")?.value || null;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = getUserId(request, cookies);
    const condition = userId ? eq(tasks.userId, userId) : isNull(tasks.userId);

    const userTasks = await db
      .select()
      .from(tasks)
      .where(condition)
      .orderBy(
        desc(tasks.isPinned),
        asc(tasks.isCompleted),
        desc(tasks.createdAt)
      );

    return new Response(
      JSON.stringify({
        success: true,
        data: userTasks,
        userId: userId || null,
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
        error: err.message || "Gagal mengambil data tugas dari database.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { title, description, priority, category, dueDate, isPinned, subtasks } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Judul tugas tidak boleh kosong." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = getUserId(request, cookies);
    const validPriorities = ["low", "medium", "high", "urgent"] as const;
    const taskPriority = validPriorities.includes(priority) ? priority : "medium";

    const [inserted] = await db
      .insert(tasks)
      .values({
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        priority: taskPriority,
        category: category?.trim() || "Umum",
        subtasks: Array.isArray(subtasks) ? subtasks : [],
        dueDate: dueDate ? new Date(dueDate) : null,
        isPinned: Boolean(isPinned),
        isCompleted: false,
      })
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        data: inserted,
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
        error: err.message || "Gagal menyimpan tugas ke database.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "clear_completed") {
      const userId = getUserId(request, cookies);
      const condition = userId
        ? and(eq(tasks.isCompleted, true), eq(tasks.userId, userId))
        : and(eq(tasks.isCompleted, true), isNull(tasks.userId));

      const deleted = await db
        .delete(tasks)
        .where(condition)
        .returning();

      return new Response(
        JSON.stringify({
          success: true,
          deletedCount: deleted.length,
          message: `${deleted.length} tugas yang selesai berhasil dibersihkan.`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Aksi tidak dikenali." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Gagal memproses penghapusan tugas.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
