import "dotenv/config";
import { processTaskReminders } from "../lib/reminders";

async function main() {
  console.log(`[${new Date().toISOString()}] Menjalankan pengecekan pengingat tenggat tugas Pangenget...`);
  
  try {
    const summary = await processTaskReminders();
    console.log("=== Hasil Pengecekan ===");
    console.log(`- Tugas diperiksa dalam rentang 24 jam: ${summary.checkedTasks}`);
    console.log(`- Notifikasi H-24 Jam terkirim: ${summary.sent24h}`);
    console.log(`- Notifikasi H-1 Jam terkirim: ${summary.sent1h}`);
    console.log(`- Tugas dilewati (belum waktunya / sudah dikirim / tanpa Telegram): ${summary.skipped}`);
    
    if (summary.errors.length > 0) {
      console.warn("⚠️ Kendala pengiriman:");
      summary.errors.forEach((err) => console.warn(`  • ${err}`));
    }
    
    console.log("Pemeriksaan selesai dengan sukses.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Terjadi kegagalan saat menjalankan pengecekan pengingat:", err);
    process.exit(1);
  }
}

main();
