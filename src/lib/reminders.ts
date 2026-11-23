import { db } from "../db";
import { tasks, userSettings, type UserSettings } from "../db/schema";
import { eq, and, isNotNull, lte, gte } from "drizzle-orm";
import { sendDeadlineReminder } from "./telegram";

export interface CheckRemindersResult {
  checkedTasks: number;
  sent24h: number;
  sent1h: number;
  skipped: number;
  errors: string[];
}

/**
 * Scan database for tasks approaching deadlines and send Telegram reminders.
 * Avoids duplicate notifications via `telegramReminded24h` and `telegramReminded1h` flags.
 */
export async function processTaskReminders(): Promise<CheckRemindersResult> {
  const result: CheckRemindersResult = {
    checkedTasks: 0,
    sent24h: 0,
    sent1h: 0,
    skipped: 0,
    errors: [],
  };

  const now = new Date();
  // Allow 30 minutes grace period in case cron runs slightly after due time
  const minGraceDate = new Date(now.getTime() - 30 * 60 * 1000);
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

  // 1. Fetch uncompleted tasks with due date in the next 24 hours
  const upcomingTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.isCompleted, false),
        isNotNull(tasks.dueDate),
        gte(tasks.dueDate, minGraceDate),
        lte(tasks.dueDate, in24Hours)
      )
    );

  result.checkedTasks = upcomingTasks.length;
  if (upcomingTasks.length === 0) {
    return result;
  }

  // 2. Fetch all user settings with active Telegram subscriptions
  const activeSettings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.telegramEnabled, true));

  const settingsMap = new Map<string, UserSettings>();
  for (const s of activeSettings) {
    if (s.userId && s.telegramChatId) {
      settingsMap.set(s.userId, s);
    }
  }

  // 3. Process each task
  for (const task of upcomingTasks) {
    if (!task.userId || !task.dueDate) {
      result.skipped++;
      continue;
    }

    const userSetting = settingsMap.get(task.userId);
    if (!userSetting || !userSetting.telegramChatId) {
      result.skipped++;
      continue;
    }

    const dueTime = new Date(task.dueDate).getTime();

    // Check Case 1: H-1 Jam (Due within 1 hour and not yet reminded for 1h)
    if (dueTime <= in1Hour.getTime()) {
      if (userSetting.remind1h && !task.telegramReminded1h) {
        const sendRes = await sendDeadlineReminder(
          userSetting.telegramChatId,
          task,
          "1h"
        );

        if (sendRes.success) {
          result.sent1h++;
          await db
            .update(tasks)
            .set({
              telegramReminded1h: true,
              telegramReminded24h: true, // Also mark 24h as fulfilled
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, task.id));
        } else {
          result.errors.push(
            `Gagal kirim H-1h untuk task [${task.id}]: ${sendRes.error}`
          );
        }
      } else {
        result.skipped++;
      }
      continue;
    }

    // Check Case 2: H-24 Jam (Due within 24 hours and not yet reminded for 24h)
    if (dueTime <= in24Hours.getTime()) {
      if (userSetting.remind24h && !task.telegramReminded24h) {
        const sendRes = await sendDeadlineReminder(
          userSetting.telegramChatId,
          task,
          "24h"
        );

        if (sendRes.success) {
          result.sent24h++;
          await db
            .update(tasks)
            .set({
              telegramReminded24h: true,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, task.id));
        } else {
          result.errors.push(
            `Gagal kirim H-24h untuk task [${task.id}]: ${sendRes.error}`
          );
        }
      } else {
        result.skipped++;
      }
    }
  }

  return result;
}
