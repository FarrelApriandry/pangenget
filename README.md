# Pangenget 📝

> **To-Do List & Pengingat Harian Modern** — *Fokus, Kerjakan, Bereskan.*

Aplikasi web To-Do List fullstack berbasis **Astro 5 SSR** (*Server-Side Rendering*) yang terhubung langsung ke **Neon Serverless PostgreSQL** menggunakan **Drizzle ORM**, antarmuka reaktif **React 19**, dan styling **Tailwind CSS v4**.

---

## 📁 Struktur Halaman (*Separated Pages Architecture*)

Pangenget memisahkan tanggung jawab agar pengguna tidak merasa *overwhelmed*:

1. **📌 [Hari Ini (`/`)](http://localhost:4321/):**
   - Fokus: Eksekusi prioritas aktif hari ini & quick capture.
   - Quick capture bar dengan Natural Language Parsing (NLP) dan Voice Dictation.
   - Daftar tugas aktif, pinned/starred, sub-tasks checklist, dan filter cepat.
   - Tombol instan **"Mulai Fokus"** pada setiap kartu tugas untuk langsung melompat ke mode Zen.

2. **⏱️ [Mode Fokus (`/fokus`)](http://localhost:4321/fokus):**
   - Fokus: Mengerjakan 1 tugas pilihan tanpa gangguan (*Deep Work Workspace*).
   - Pomodoro Timer (25 menit), Deep Work Timer (50 menit), atau Stopwatch bebas.
   - Visualisasi judul tugas besar, rincian sub-langkah, dan tombol penyelesaian bertabur konfeti 🎉.

3. **🏷️ [Kategori & Proyek (`/kategori`)](http://localhost:4321/kategori):**
   - Fokus: Pengorganisasian tugas berdasarkan domain kerja (*Kerja, Pribadi, Proyek, Belajar, Belanja*, dll.).
   - Kartu metrik progres per kategori dan input tugas cepat khusus kategori tersebut.

4. **📜 [Riwayat & Arsip (`/riwayat`)](http://localhost:4321/riwayat):**
   - Fokus: Log pencapaian, rekap tugas tuntas, dan audit harian.
   - Tombol **"Salin Standup"** untuk WhatsApp/Slack.
   - Pelacak Streak produktif harian (`🔥 X Hari Beruntun`).
   - Fitur restore/kembalikan tugas ke Hari Ini atau bersihkan arsip permanen.

---

## ✨ Fitur Unggulan

- **🧠 Quick Capture dengan Natural Language Parsing:**
  Ketik bebas dalam satu baris, sistem otomatis mendeteksi prioritas, kategori, dan deadline dengan preview chip realtime:
  - *Contoh:* `Review Pull Request besok jam 17:00 !urgent #kerja`
  - *Hasil:* Judul bersih, Prioritas `Urgent`, Kategori `#Kerja`, Tenggat besok pukul 17:00.
- **🎙️ Quick Voice Input (Web Speech API):**
  Dikte tugas langsung dengan suara dalam Bahasa Indonesia (`id-ID`). Suara otomatis diubah ke teks dan di-parse oleh engine NLP.
- **📋 Sub-Tasks / Micro-Checklist di Dalam Tugas:**
  Pecah tugas besar menjadi langkah-langkah kecil dengan indikator progres mini `(2/3 langkah)`, checklist interaktif, dan prompt otomatis saat semua langkah beres.
- **📤 Salin Ringkasan Harian (*Daily Standup / WhatsApp Export*):**
  Sekali klik untuk menyalin rekap tugas hari ini dalam format WhatsApp / Markdown rapi untuk standup atau laporan.
- **🔥 Pelacak Streak Harian (*Daily Streak*):**
  Pelacak konsistensi hari berturut-turut (`🔥 X Hari`) yang tampil di navbar & rekap statistik.
- **🎉 Micro-Confetti & Audio Chime:**
  Semprotan partikel konfeti halus saat semua tugas tuntas (progres 100%) plus nada konfirmasi Web Audio API.
- **⚡ Zero-Latency Optimistic UI:**
  Setiap checklist, pin bintang, dan penghapusan langsung ter-update di layar tanpa jeda jaringan.
- **↩️ 5-Detik Undo Toast:**
  Tombol pemulihan instan jika tugas tidak sengaja terhapus.
- **⌨️ Pintasan Keyboard:**
  <kbd>N</kbd> (Tugas baru), <kbd>/</kbd> (Cari), <kbd>1</kbd>-<kbd>4</kbd> (Tab status), <kbd>Esc</kbd> (Batal), <kbd>?</kbd> (Panduan).
- **🌓 Dark Mode & Light Mode:**
  Dukungan tema gelap & terang berstandar kontras tinggi.

---

## 🛠️ Tech Stack

- **Framework:** [Astro 5](https://astro.build/) (`output: 'server'` dengan `@astrojs/node`)
- **Database:** [Neon Postgres Serverless](https://neon.tech/) (`@neondatabase/serverless`)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit`
- **UI Islands:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons & Delight:** Lucide React & `canvas-confetti`

---

## 🚀 Memulai (Quickstart)

1. **Install Dependencies:**
   ```bash
   bun install
   ```

2. **Setup Database:**
   Pastikan file `.env` sudah memuat `DATABASE_URL` dari Neon Console:
   ```env
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```

3. **Sinkronisasi Skema Database:**
   ```bash
   bun run db:push
   ```

4. **Jalankan Development Server:**
   ```bash
   bun run dev
   ```
   Buka [http://localhost:4321](http://localhost:4321) di browser Anda.

5. **Build & Production:**
   ```bash
   bun run build
   bun run start
   ```

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/tasks` | Mengambil seluruh daftar tugas (termasuk subtasks) |
| `POST` | `/api/tasks` | Membuat tugas baru (mendukung subtasks) |
| `DELETE` | `/api/tasks` | Menghapus massal tugas selesai (`{ action: "clear_completed" }`) |
| `PATCH` | `/api/tasks/:id` | Memperbarui atribut tugas & subtasks |
| `DELETE` | `/api/tasks/:id` | Menghapus satu tugas |
