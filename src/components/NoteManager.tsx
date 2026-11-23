import React, { useState } from "react";
import { Button } from "./Button";
import { Plus, Pin, Trash2, Loader2, StickyNote } from "lucide-react";

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string | Date;
}

export function NoteManager({ initialNotes = [] }: { initialNotes?: NoteItem[] }) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat catatan.");
      }

      setNotes([data.data, ...notes]);
      setTitle("");
      setContent("");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes(notes.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentPin }),
      });

      if (res.ok) {
        setNotes(
          notes.map((n) => (n.id === id ? { ...n, isPinned: !currentPin } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <StickyNote size={20} className="text-emerald-500" />
          <span>Tambah Catatan Baru</span>
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
              Judul
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Belajar Drizzle ORM..."
              required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
              Konten / Isi
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan catatan detail Anda di sini..."
              rows={3}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Plus size={16} /> Simpan Catatan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
          <span>Daftar Catatan ({notes.length})</span>
          <span className="text-xs font-normal text-neutral-500">Auto-synced with Neon DB</span>
        </h3>

        {notes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Belum ada catatan di database. Buat catatan pertama Anda di atas!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-5 rounded-xl border transition-all ${
                  note.isPinned
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                    {note.title}
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(note.id, note.isPinned)}
                      className={`p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                        note.isPinned ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400"
                      }`}
                      title={note.isPinned ? "Lepas pin" : "Sematkan pin"}
                    >
                      <Pin size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-400">
                  {new Date(note.createdAt).toLocaleString("id-ID")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
