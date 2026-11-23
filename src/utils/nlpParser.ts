/**
 * Natural Language Parser for Quick Task Capture.
 * Extracts priority (!urgent), categories (#proyek), and dates (besok, lusa, hari ini, senin, jam 17:00).
 */

export interface ParsedTaskInput {
  cleanTitle: string;
  priority?: ("low" | "medium" | "high" | "urgent") | undefined;
  category?: string | undefined;
  dueDate?: Date | undefined;
  detectedTokens: {
    type: "priority" | "category" | "date";
    label: string;
    raw: string;
  }[];
}

export function parseNaturalLanguageTask(input: string): ParsedTaskInput {
  if (!input || !input.trim()) {
    return { cleanTitle: "", detectedTokens: [] };
  }

  let text = input;
  const detectedTokens: ParsedTaskInput["detectedTokens"] = [];
  let priority: "low" | "medium" | "high" | "urgent" | undefined = undefined;
  let category: string | undefined = undefined;
  let dueDate: Date | undefined = undefined;

  // 1. Detect Priority (!urgent, !p1, !darurat, !tinggi, !high, !sedang, !med, !rendah, !low)
  const priorityRegex = /!(urgent|darurat|p1|tinggi|high|p2|sedang|med|medium|p3|rendah|low|p4)\b/i;
  const prioMatch = text.match(priorityRegex);
  if (prioMatch && prioMatch[1]) {
    const rawPrio = prioMatch[1].toLowerCase();
    if (["urgent", "darurat", "p1"].includes(rawPrio)) {
      priority = "urgent";
      detectedTokens.push({ type: "priority", label: "Urgent", raw: prioMatch[0] });
    } else if (["tinggi", "high", "p2"].includes(rawPrio)) {
      priority = "high";
      detectedTokens.push({ type: "priority", label: "Tinggi", raw: prioMatch[0] });
    } else if (["sedang", "med", "medium", "p3"].includes(rawPrio)) {
      priority = "medium";
      detectedTokens.push({ type: "priority", label: "Sedang", raw: prioMatch[0] });
    } else if (["rendah", "low", "p4"].includes(rawPrio)) {
      priority = "low";
      detectedTokens.push({ type: "priority", label: "Rendah", raw: prioMatch[0] });
    }
    text = text.replace(priorityRegex, " ");
  }

  // 2. Detect Category / Tag (#kerja, #pribadi, #dev, #belanja, etc.)
  const categoryRegex = /#([a-zA-Z0-9_\-]+)/;
  const catMatch = text.match(categoryRegex);
  if (catMatch && catMatch[1]) {
    const catName = catMatch[1];
    category = catName.charAt(0).toUpperCase() + catName.slice(1).toLowerCase();
    detectedTokens.push({ type: "category", label: `#${category}`, raw: catMatch[0] });
    text = text.replace(categoryRegex, " ");
  }

  // 3. Detect Time (jam 17, jam 5 sore, 17:00, 5pm, 09.30)
  let targetHours: number | null = null;
  let targetMinutes: number | null = null;

  const timeRegex = /(?:jam\s*)?(\d{1,2})[:.](\d{2})|jam\s*(\d{1,2})(?:\s*(pagi|siang|sore|malam))?/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch) {
    if (timeMatch[1] && timeMatch[2]) {
      targetHours = parseInt(timeMatch[1], 10);
      targetMinutes = parseInt(timeMatch[2], 10);
    } else if (timeMatch[3]) {
      let h = parseInt(timeMatch[3], 10);
      const period = (timeMatch[4] || "").toLowerCase();
      if ((period === "sore" || period === "malam") && h < 12) h += 12;
      if (period === "siang" && h < 11) h += 12;
      targetHours = h;
      targetMinutes = 0;
    }
    text = text.replace(timeRegex, " ");
  }

  // 4. Detect Date keywords (hari ini, besok, lusa, minggu depan, senin..minggu)
  const now = new Date();
  const dateResult = new Date(now);

  const dayMap: Record<string, number> = {
    minggu: 0,
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
  };

  const dateKeywordsRegex = /\b(hari ini|today|besok|tomorrow|lusa|minggu depan|next week|senin|selasa|rabu|kamis|jumat|sabtu|minggu)\b/i;
  const dateMatch = text.match(dateKeywordsRegex);

  if (dateMatch && dateMatch[1]) {
    const keyword = dateMatch[1].toLowerCase();
    let label = "";

    if (keyword === "hari ini" || keyword === "today") {
      label = "Hari ini";
    } else if (keyword === "besok" || keyword === "tomorrow") {
      dateResult.setDate(dateResult.getDate() + 1);
      label = "Besok";
    } else if (keyword === "lusa") {
      dateResult.setDate(dateResult.getDate() + 2);
      label = "Lusa";
    } else if (keyword === "minggu depan" || keyword === "next week") {
      dateResult.setDate(dateResult.getDate() + 7);
      label = "Minggu Depan";
    } else if (typeof dayMap[keyword] !== "undefined") {
      const targetDay = dayMap[keyword];
      const currentDay = dateResult.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      dateResult.setDate(dateResult.getDate() + diff);
      label = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }

    if (targetHours !== null) {
      dateResult.setHours(targetHours, targetMinutes || 0, 0, 0);
      const timeStr = `${String(targetHours).padStart(2, "0")}:${String(targetMinutes || 0).padStart(2, "0")}`;
      label += ` ${timeStr}`;
    } else {
      dateResult.setHours(23, 59, 0, 0);
    }

    dueDate = dateResult;
    detectedTokens.push({ type: "date", label, raw: dateMatch[0] });
    text = text.replace(dateKeywordsRegex, " ");
  } else if (targetHours !== null) {
    dateResult.setHours(targetHours, targetMinutes || 0, 0, 0);
    if (dateResult.getTime() < now.getTime()) {
      dateResult.setDate(dateResult.getDate() + 1);
    }
    const timeStr = `${String(targetHours).padStart(2, "0")}:${String(targetMinutes || 0).padStart(2, "0")}`;
    dueDate = dateResult;
    detectedTokens.push({ type: "date", label: `Jam ${timeStr}`, raw: timeMatch ? timeMatch[0] : "" });
  }

  const cleanTitle = text.replace(/\s+/g, " ").trim();

  return {
    cleanTitle: cleanTitle || input.trim(),
    priority,
    category,
    dueDate,
    detectedTokens,
  };
}
