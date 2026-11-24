import type { APIRoute } from "astro";
import { db } from "../../db";
import { categories, tasks } from "../../db/schema";
import { desc, eq, and, isNull } from "drizzle-orm";

function getUserId(request: Request, cookies: any): string | null {
  return request.headers.get("x-user-id") || cookies.get("pangenget_user_id")?.value || null;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = getUserId(request, cookies);
    const catCondition = userId ? eq(categories.userId, userId) : isNull(categories.userId);
    const taskCondition = userId ? eq(tasks.userId, userId) : isNull(tasks.userId);

    // Fetch saved categories from categories table
    const savedCategories = await db
      .select()
      .from(categories)
      .where(catCondition)
      .orderBy(desc(categories.createdAt));

    // Also fetch distinct categories from tasks to ensure no legacy category is missed
    const userTasks = await db
      .select({ category: tasks.category })
      .from(tasks)
      .where(taskCondition);

    const categoryNames = new Set<string>();
    savedCategories.forEach((c) => {
      if (c.name && c.name.trim()) categoryNames.add(c.name.trim());
    });
    userTasks.forEach((t) => {
      if (t.category && t.category.trim() && t.category.trim() !== "Semua Tugas" && t.category.trim() !== "Umum") {
        categoryNames.add(t.category.trim());
      }
    });

    const list = Array.from(categoryNames);

    return new Response(
      JSON.stringify({
        success: true,
        data: list,
        categories: savedCategories,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Gagal mengambil daftar kategori.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Nama kategori tidak boleh kosong." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanName = name.trim();
    if (cleanName.toLowerCase() === "semua tugas" || cleanName.toLowerCase() === "semua" || cleanName.toLowerCase() === "all") {
      return new Response(
        JSON.stringify({ success: false, error: "'Semua Tugas' adalah kategori default sistem." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = getUserId(request, cookies);
    const condition = userId ? eq(categories.userId, userId) : isNull(categories.userId);

    // Check if category already exists for user
    const existing = await db
      .select()
      .from(categories)
      .where(condition);

    const alreadyExists = existing.some((c) => c.name.toLowerCase() === cleanName.toLowerCase());
    if (alreadyExists) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Kategori sudah ada.",
          data: existing.find((c) => c.name.toLowerCase() === cleanName.toLowerCase()),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const [inserted] = await db
      .insert(categories)
      .values({
        userId,
        name: cleanName,
      })
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        data: inserted,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Gagal menambahkan kategori.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, id } = body;

    if (!name && !id) {
      return new Response(
        JSON.stringify({ success: false, error: "Nama atau ID kategori diperlukan." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = getUserId(request, cookies);

    if (id) {
      const condition = userId ? and(eq(categories.id, id), eq(categories.userId, userId)) : and(eq(categories.id, id), isNull(categories.userId));
      await db.delete(categories).where(condition);
    } else if (name) {
      const condition = userId ? and(eq(categories.name, name), eq(categories.userId, userId)) : and(eq(categories.name, name), isNull(categories.userId));
      await db.delete(categories).where(condition);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Kategori berhasil dihapus." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Gagal menghapus kategori." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
