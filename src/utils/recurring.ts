/**
 * Recurring task date calculation utilities
 */

export type RepeatType = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export function calculateNextDueDate(
  currentDueDate: Date | string | null | undefined,
  repeatType: string
): Date {
  const base = currentDueDate ? new Date(currentDueDate) : new Date();
  // If base date is already in the past, calculate from today
  const now = new Date();
  const start = base.getTime() < now.getTime() - 24 * 60 * 60 * 1000 ? now : base;
  const next = new Date(start);

  switch (repeatType) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekdays": {
      const day = next.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
      if (day === 5) {
        // Friday -> Monday (+3)
        next.setDate(next.getDate() + 3);
      } else if (day === 6) {
        // Saturday -> Monday (+2)
        next.setDate(next.getDate() + 2);
      } else {
        next.setDate(next.getDate() + 1);
      }
      break;
    }
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}

export function getRepeatLabel(repeatType: string | undefined | null): string {
  switch (repeatType) {
    case "daily":
      return "Harian";
    case "weekdays":
      return "Hari Kerja";
    case "weekly":
      return "Mingguan";
    case "monthly":
      return "Bulanan";
    default:
      return "Tidak Berulang";
  }
}
