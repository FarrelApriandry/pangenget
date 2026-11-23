/**
 * Pangenget Landing Page JavaScript
 * Clean, Tactile, High-Performance Interactive Engine
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. Theme Management (System Sync & LocalStorage)
  // ==========================================================================
  const themeToggle = document.getElementById("themeToggle");
  const html = document.documentElement;

  function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }

  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = html.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }

  // ==========================================================================
  // 2. Synthesized Audio Engine (Subtle Web Audio API - Zero External Assets)
  // ==========================================================================
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playChime(freq = 587.33, type = "sine", duration = 0.18) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  // Ambient Noise Generator (Focus Mode)
  let ambientNode = null;
  let isAmbientPlaying = false;

  function toggleAmbientSound(onStateChange) {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (isAmbientPlaying) {
      if (ambientNode) {
        ambientNode.stop();
        ambientNode.disconnect();
        ambientNode = null;
      }
      isAmbientPlaying = false;
      onStateChange(false);
    } else {
      // Create 2-second looped soft pink-noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.015;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Lowpass filter for warm, soothing rain/focus hum
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      ambientNode = noise;
      isAmbientPlaying = true;
      onStateChange(true);
    }
  }

  // ==========================================================================
  // 3. Hero Terminal: Natural Language Parser & Live Token Decomposition
  // ==========================================================================
  const heroInput = document.getElementById("heroInput");
  const heroAddBtn = document.getElementById("heroAddBtn");
  const heroTokens = document.getElementById("heroTokens");
  const presetButtons = document.querySelectorAll(".preset-tag");

  function parseTaskTokens(raw) {
    let text = raw.trim();
    if (!text) {
      return { title: "(Ketik kalimat tugas di atas)", category: null, priority: null, date: null };
    }

    // 1. Priority (!urgent, !tinggi, !rendah)
    let priority = null;
    const prioMatch = text.match(/!(urgent|darurat|kritis|tinggi|high|rendah|low)/i);
    if (prioMatch) {
      const p = prioMatch[1].toLowerCase();
      if (["urgent", "darurat", "kritis"].includes(p)) priority = "URGENT";
      else if (["tinggi", "high"].includes(p)) priority = "TINGGI";
      else priority = "RENDAH";
      text = text.replace(prioMatch[0], "").trim();
    }

    // 2. Category (#tag)
    let category = null;
    const catMatch = text.match(/#(\w+)/);
    if (catMatch) {
      category = catMatch[1];
      text = text.replace(catMatch[0], "").trim();
    }

    // 3. Due Date & Time
    let date = null;
    const hasBesok = /besok/i.test(text);
    const hasLusa = /lusa/i.test(text);
    const hasNanti = /nanti malam|nanti sore|nanti/i.test(text);
    const timeMatch = text.match(/jam\s*(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?/i);

    let timeFormatted = "";
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] || "00";
      const ampm = timeMatch[3]?.toLowerCase();
      if ((ampm === "siang" || ampm === "sore" || ampm === "malam") && h < 12) h += 12;
      timeFormatted = ` ${String(h).padStart(2, "0")}:${m} WIB`;
      text = text.replace(timeMatch[0], "").trim();
    }

    if (hasBesok) {
      date = `Besok${timeFormatted}`;
      text = text.replace(/besok/gi, "").trim();
    } else if (hasLusa) {
      date = `Lusa${timeFormatted}`;
      text = text.replace(/lusa/gi, "").trim();
    } else if (hasNanti) {
      date = `Hari ini${timeFormatted || " (Malam)"}`;
      text = text.replace(/nanti malam|nanti sore|nanti/gi, "").trim();
    } else if (timeFormatted) {
      date = `Hari ini${timeFormatted}`;
    }

    const cleanTitle = text.replace(/\s+/g, " ").trim();
    return {
      title: cleanTitle || raw,
      category: category ? `#${category}` : null,
      priority: priority ? `!${priority}` : null,
      date: date ? `📅 ${date}` : null,
    };
  }

  function updateHeroTokenDecomposition() {
    if (!heroInput || !heroTokens) return;
    const { title, category, priority, date } = parseTaskTokens(heroInput.value);

    let htmlStr = `<span class="token-tag tag-title">${escapeHtml(title)}</span>`;
    if (category) htmlStr += `<span class="token-tag tag-cat">${escapeHtml(category)}</span>`;
    if (priority) htmlStr += `<span class="token-tag tag-prio">${escapeHtml(priority)}</span>`;
    if (date) htmlStr += `<span class="token-tag tag-date">${escapeHtml(date)}</span>`;

    heroTokens.innerHTML = htmlStr;
  }

  if (heroInput) {
    heroInput.addEventListener("input", updateHeroTokenDecomposition);
    updateHeroTokenDecomposition();
  }

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sample = btn.getAttribute("data-text");
      if (heroInput && sample) {
        heroInput.value = sample;
        updateHeroTokenDecomposition();
        heroInput.focus();
      }
    });
  });

  // ==========================================================================
  // 4. Live Mini Workspace (Interactive Task List)
  // ==========================================================================
  const mwTaskList = document.getElementById("mwTaskList");
  const mwProgressText = document.getElementById("mwProgressText");
  const mwProgressBar = document.getElementById("mwProgressBar");

  // Initial realistic default tasks
  let demoTasks = [
    { id: 1, title: "Review pull request neon-auth & multi-tenancy", tag: "#engineering", done: true },
    { id: 2, title: "Sync standup pagi bersama tim engineer", tag: "#rutinitas", done: true },
    { id: 3, title: "Sesi deep work 50 menit: Desain landing page", tag: "#proyek", done: false },
  ];

  function renderMiniWorkspace() {
    if (!mwTaskList) return;
    mwTaskList.innerHTML = "";

    const total = demoTasks.length;
    const completed = demoTasks.filter((t) => t.done).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (mwProgressText) {
      mwProgressText.textContent = `${completed} dari ${total} selesai (${percentage}%)`;
    }
    if (mwProgressBar) {
      mwProgressBar.style.width = `${percentage}%`;
    }

    demoTasks.forEach((task) => {
      const item = document.createElement("div");
      item.className = `mw-item ${task.done ? "completed" : ""}`;

      item.innerHTML = `
        <div class="mw-item-left">
          <div class="mw-checkbox" role="checkbox" aria-checked="${task.done}" tabindex="0">
            ${task.done ? "✓" : ""}
          </div>
          <span class="mw-task-title">${escapeHtml(task.title)}</span>
        </div>
        <div class="mw-item-meta">
          <span class="mw-tag">${escapeHtml(task.tag)}</span>
          <button class="mw-btn-delete" title="Hapus tugas" aria-label="Hapus">&times;</button>
        </div>
      `;

      // Checkbox toggle
      const checkbox = item.querySelector(".mw-checkbox");
      checkbox.addEventListener("click", () => {
        task.done = !task.done;
        if (task.done) playChime(659.25, "sine", 0.15); // E5 chime
        renderMiniWorkspace();
      });

      // Delete button
      const delBtn = item.querySelector(".mw-btn-delete");
      delBtn.addEventListener("click", () => {
        demoTasks = demoTasks.filter((t) => t.id !== task.id);
        renderMiniWorkspace();
      });

      mwTaskList.appendChild(item);
    });
  }

  function handleAddTask() {
    if (!heroInput) return;
    const raw = heroInput.value.trim();
    if (!raw) return;

    const parsed = parseTaskTokens(raw);
    const newTask = {
      id: Date.now(),
      title: parsed.title,
      tag: parsed.category || "#umum",
      done: false,
    };

    demoTasks.unshift(newTask);
    renderMiniWorkspace();
    playChime(440, "sine", 0.12);

    heroInput.value = "";
    updateHeroTokenDecomposition();
    heroInput.focus();
  }

  if (heroAddBtn) {
    heroAddBtn.addEventListener("click", handleAddTask);
  }

  if (heroInput) {
    heroInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTask();
      }
    });
  }

  renderMiniWorkspace();

  // ==========================================================================
  // 5. Focus Mode & Pomodoro Simulator
  // ==========================================================================
  const clockDisplay = document.getElementById("clockDisplay");
  const timerRunBtn = document.getElementById("timerRunBtn");
  const timerResetBtn = document.getElementById("timerResetBtn");
  const pomo25Btn = document.getElementById("pomo25Btn");
  const deep50Btn = document.getElementById("deep50Btn");
  const ambientAudioBtn = document.getElementById("ambientAudioBtn");
  const audioStatusText = document.getElementById("audioStatusText");

  let timerDuration = 25 * 60;
  let timerRemaining = timerDuration;
  let timerInterval = null;
  let isRunning = false;

  function renderClock() {
    const mins = Math.floor(timerRemaining / 60);
    const secs = timerRemaining % 60;
    if (clockDisplay) {
      clockDisplay.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
  }

  function stopFocusTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    isRunning = false;
    if (timerRunBtn) timerRunBtn.textContent = "Mulai Sesi Fokus";
  }

  if (timerRunBtn) {
    timerRunBtn.addEventListener("click", () => {
      if (isRunning) {
        stopFocusTimer();
      } else {
        isRunning = true;
        timerRunBtn.textContent = "Jeda";
        playChime(523.25, "triangle", 0.2); // C5 start note
        timerInterval = setInterval(() => {
          if (timerRemaining > 0) {
            timerRemaining--;
            renderClock();
          } else {
            stopFocusTimer();
            playChime(880, "sine", 0.4);
            showToast("Sesi Fokus selesai! Waktunya istirahat.");
          }
        }, 1000);
      }
    });
  }

  if (timerResetBtn) {
    timerResetBtn.addEventListener("click", () => {
      stopFocusTimer();
      timerRemaining = timerDuration;
      renderClock();
    });
  }

  if (pomo25Btn && deep50Btn) {
    pomo25Btn.addEventListener("click", () => {
      stopFocusTimer();
      pomo25Btn.classList.add("active");
      deep50Btn.classList.remove("active");
      timerDuration = 25 * 60;
      timerRemaining = timerDuration;
      renderClock();
    });

    deep50Btn.addEventListener("click", () => {
      stopFocusTimer();
      deep50Btn.classList.add("active");
      pomo25Btn.classList.remove("active");
      timerDuration = 50 * 60;
      timerRemaining = timerDuration;
      renderClock();
    });
  }

  // Ambient sound button
  if (ambientAudioBtn) {
    ambientAudioBtn.addEventListener("click", () => {
      toggleAmbientSound((playing) => {
        if (playing) {
          ambientAudioBtn.classList.add("playing");
          if (audioStatusText) audioStatusText.textContent = "Suara: Aktif (450Hz Hujan)";
        } else {
          ambientAudioBtn.classList.remove("playing");
          if (audioStatusText) audioStatusText.textContent = "Suara: Mati";
        }
      });
    });
  }

  renderClock();

  // ==========================================================================
  // 6. Standup Copy Action (Tactile Clipboard)
  // ==========================================================================
  const copyStandupBtn = document.getElementById("copyStandupBtn");
  const copyStandupText = document.getElementById("copyStandupText");
  const standupCodeBlock = document.getElementById("standupCodeBlock");

  if (copyStandupBtn && standupCodeBlock) {
    copyStandupBtn.addEventListener("click", async () => {
      const textToCopy = standupCodeBlock.innerText;
      try {
        await navigator.clipboard.writeText(textToCopy);
        if (copyStandupText) copyStandupText.textContent = "✓ Tersalin!";
        showToast("Format Standup disalin ke papan klip!");
        playChime(784, "sine", 0.15); // G5 note
        setTimeout(() => {
          if (copyStandupText) copyStandupText.textContent = "Salin ke Papan Klip";
        }, 2200);
      } catch (err) {
        showToast("Gagal menyalin otomatis, silakan salin manual.");
      }
    });
  }

  // ==========================================================================
  // 7. Global Keyboard Shortcuts
  // ==========================================================================
  document.addEventListener("keydown", (e) => {
    // If typing in an input or textarea, don't hijack keys
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      if (e.key === "Escape") {
        document.activeElement.blur();
      }
      return;
    }

    if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      if (heroInput) {
        heroInput.focus();
        heroInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (e.key === "?") {
      e.preventDefault();
      const shortcutsSec = document.getElementById("shortcuts");
      if (shortcutsSec) {
        shortcutsSec.scrollIntoView({ behavior: "smooth" });
      }
    } else if (e.code === "Space") {
      // Space toggles timer if visible in viewport
      const rect = clockDisplay?.getBoundingClientRect();
      if (rect && rect.top >= 0 && rect.bottom <= window.innerHeight) {
        e.preventDefault();
        timerRunBtn?.click();
      }
    }
  });

  // ==========================================================================
  // 8. Utility: Toast & HTML Escaper
  // ==========================================================================
  function showToast(msg) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 160ms var(--ease-out), transform 160ms var(--ease-out)";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(6px)";
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
