import {
  setActiveUser,
  addEarn,
  addQuickPoints,
  redeemReward,
  exportState,
  parseImportJson,
  replaceState,
  resetState,
  verifyPin,
  setParentPin,
  upsertEvent,
  deleteEvent,
  upsertReward,
  deleteReward,
  getUserById,
  getUserRewards
} from "./state.js";
import {
  renderNavActive,
  renderHome,
  renderUserDashboard,
  renderUserHistory,
  renderManageEvents,
  renderSettings
} from "./render.js";

const app = document.getElementById("app");
const ambientAudio = new Audio("./lake.mp3");
ambientAudio.loop = true;
ambientAudio.preload = "auto";
ambientAudio.volume = 0;

let fadeTimer = null;

function fadeAudioTo(targetVolume, durationMs = 1600, onDone = null) {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
  const startVolume = ambientAudio.volume;
  const delta = targetVolume - startVolume;
  if (Math.abs(delta) < 0.001 || durationMs <= 0) {
    ambientAudio.volume = targetVolume;
    if (onDone) onDone();
    return;
  }
  const stepMs = 60;
  const steps = Math.max(1, Math.round(durationMs / stepMs));
  let tick = 0;
  fadeTimer = setInterval(() => {
    tick += 1;
    const t = Math.min(1, tick / steps);
    ambientAudio.volume = Math.max(0, Math.min(1, startVolume + delta * t));
    if (t >= 1) {
      clearInterval(fadeTimer);
      fadeTimer = null;
      if (onDone) onDone();
    }
  }, stepMs);
}

async function syncAmbientAudio(enabled, fromUserGesture = false) {
  if (!enabled) {
    fadeAudioTo(0, 1200, () => {
      ambientAudio.pause();
      ambientAudio.currentTime = 0;
    });
    return;
  }

  if (ambientAudio.paused) {
    try {
      await ambientAudio.play();
    } catch {
      if (fromUserGesture) {
        showToast("Unable to start audio on this browser.", true);
      }
      return;
    }
  }
  fadeAudioTo(0.14, 1600);
}

function parseRoute(hash) {
  const raw = hash.replace(/^#/, "") || "/home";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "user" && parts[1]) {
    const section = parts[2] || "dashboard";
    const allowed = new Set(["dashboard", "history", "manage-events"]);
    const normalized = allowed.has(section) ? section : "dashboard";
    return { kind: "user", userId: parts[1], section: normalized, raw: path, top: normalized === "dashboard" ? "home" : normalized === "manage-events" ? "manage" : normalized };
  }

  if (parts[0] === "settings") return { kind: "settings", raw: path, top: "settings" };
  if (parts[0] === "home" || parts.length === 0) return { kind: "home", raw: path, top: "home" };
  return { kind: "alias", alias: parts[0], raw: path, top: parts[0] === "manage-events" ? "manage" : parts[0] };
}

function showToast(message, isError = false) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " error" : ""}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function downloadJsonFile(filename, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function askPinIfNeeded(storeState, actionName) {
  if (!storeState.settings.parent_pin_hash) return true;
  const entered = window.prompt(`Enter Parent PIN to continue (${actionName}):`, "");
  if (entered === null) return false;
  return verifyPin(storeState, entered);
}

function readInputValue(root, selector) {
  const node = root.querySelector(selector);
  if (!node) return "";
  if (node instanceof HTMLInputElement && node.type === "checkbox") return node.checked;
  return node.value;
}

function ensureUserHash(userId, section = "dashboard") {
  if (section === "dashboard") {
    window.location.hash = `#/user/${userId}`;
    return;
  }
  window.location.hash = `#/user/${userId}/${section}`;
}

export function createController(getState, setState, rerender) {
  const historyFilters = {
    type: "all",
    range: "7",
    category: "all"
  };

  function applyState(next) {
    setState(next);
    rerender();
  }

  function onRouteChange() {
    rerender();
  }

  async function onGlobalClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.getAttribute("data-action");
    const state = getState();

    if (action === "open-user") {
      const userId = target.getAttribute("data-user-id");
      if (!userId) return;
      const next = setActiveUser(state, userId);
      setState(next);
      ensureUserHash(userId, "dashboard");
      return;
    }

    if (action === "toggle-sound") {
      const enabled = !Boolean(state.settings?.sound_enabled);
      const next = {
        ...state,
        settings: {
          ...state.settings,
          sound_enabled: enabled
        }
      };
      applyState(next);
      syncAmbientAudio(enabled, true);
      return;
    }

    if (action === "quick-add") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const points = Number(target.getAttribute("data-points"));
      const result = addEarn(state, { userId, eventId: "custom_quick", points, note: `Quick add +${points}` });
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      showToast(`+${points} points added`);
      return;
    }

    if (action === "quick-add-custom") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const input = document.getElementById("custom-add-points");
      const points = Math.trunc(Number(input?.value || 0));
      if (!Number.isFinite(points) || points === 0) return showToast("Enter a non-zero number.", true);
      const result = addQuickPoints(state, { userId, points, note: `Quick adjust ${points > 0 ? "+" : ""}${points}` });
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      if (input) input.value = "1";
      showToast(`${points > 0 ? "+" : ""}${points} points applied`);
      return;
    }

    if (action === "achieve-event") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const eventId = target.getAttribute("data-event-id");
      const userEvents = state.events_by_user?.[userId] || [];
      const eventObj = userEvents.find((e) => e.id === eventId);
      if (!eventObj) return showToast("Event not found.", true);
      const result = addEarn(state, { userId, eventId: eventObj.id, points: eventObj.points, note: eventObj.title });
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      showToast(`Earned +${eventObj.points}: ${eventObj.title}`);
      return;
    }

    if (action === "redeem-reward" || action === "quick-redeem") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const rewardId = target.getAttribute("data-reward-id");
      const reward = getUserRewards(state, userId).find((r) => r.id === rewardId);
      if (!reward) return showToast("Reward not found.", true);
      const result = redeemReward(state, { userId, rewardId, note: reward.title });
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      showToast(`Redeemed -${reward.cost}: ${reward.title}`);
      return;
    }

    if (action === "export-json") {
      downloadJsonFile("data.json", exportState(state));
      showToast("Exported data.json");
      return;
    }

    if (action === "import-json") {
      const input = document.getElementById("import-file");
      const file = input?.files?.[0];
      if (!file) return showToast("Select a JSON file first.", true);
      if (!askPinIfNeeded(state, "Import")) return showToast("PIN check failed.", true);
      if (!window.confirm("Import will replace all current data. Continue?")) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = parseImportJson(String(reader.result || ""));
          applyState(replaceState(parsed));
          if (input) input.value = "";
          showToast("Import completed.");
        } catch (error) {
          showToast(error.message || "Import failed.", true);
        }
      };
      reader.onerror = () => showToast("Could not read file.", true);
      reader.readAsText(file);
      return;
    }

    if (action === "save-sync-url") {
      const input = document.getElementById("github-sync-url");
      const url = String(input?.value || "").trim();
      if (url && !/^https?:\/\//i.test(url)) {
        return showToast("Sync URL must start with http:// or https://", true);
      }
      const next = {
        ...state,
        settings: {
          ...state.settings,
          github_sync_url: url
        }
      };
      applyState(next);
      showToast(url ? "Sync URL saved." : "Sync URL cleared.");
      return;
    }

    if (action === "sync-github") {
      const endpoint = String(state.settings?.github_sync_url || "").trim();
      if (!endpoint) {
        return showToast("Set and save GitHub Sync URL first.", true);
      }
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ state })
        });
        let payload = null;
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }
        if (!res.ok) {
          const detail = payload?.error || payload?.detail || `Sync failed (${res.status})`;
          return showToast(String(detail), true);
        }
        const shortCommit = payload?.commit ? ` (${String(payload.commit).slice(0, 7)})` : "";
        showToast(`Synced to GitHub${shortCommit}`);
      } catch {
        showToast("Sync request failed. Check Worker URL/CORS/network.", true);
      }
      return;
    }

    if (action === "reset-state") {
      if (!askPinIfNeeded(state, "Reset")) return showToast("PIN check failed.", true);
      if (!window.confirm("Reset all data to factory defaults?")) return;
      applyState(resetState());
      showToast("State reset complete.");
      return;
    }

    if (action === "set-pin") {
      const input = document.getElementById("parent-pin-input");
      const val = String(input?.value || "").trim();
      try {
        const next = setParentPin(state, val);
        applyState(next);
        if (input) input.value = "";
        showToast("PIN saved.");
      } catch (error) {
        showToast(error.message || "Invalid PIN.", true);
      }
      return;
    }

    if (action === "clear-pin") {
      const next = setParentPin(state, "");
      applyState(next);
      const input = document.getElementById("parent-pin-input");
      if (input) input.value = "";
      showToast("PIN cleared.");
      return;
    }

    if (action === "save-event") {
      const userId = target.getAttribute("data-user-id");
      const card = target.closest("[data-kind='event'][data-item-id]");
      if (!userId || !card) return;
      const payload = {
        id: card.getAttribute("data-item-id"),
        title: readInputValue(card, "[data-field='title']"),
        category: readInputValue(card, "[data-field='category']"),
        points: readInputValue(card, "[data-field='points']"),
        description: readInputValue(card, "[data-field='description']"),
        enabled: readInputValue(card, "[data-field='enabled']")
      };
      const result = upsertEvent(state, userId, payload);
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      showToast("Event saved.");
      return;
    }

    if (action === "save-all-events") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      if (!userId) return;
      const cards = [...document.querySelectorAll(`[data-kind='event'][data-user-id='${userId}'][data-item-id]`)];
      let nextState = state;
      let updated = 0;
      for (const card of cards) {
        const payload = {
          id: card.getAttribute("data-item-id"),
          title: readInputValue(card, "[data-field='title']"),
          category: readInputValue(card, "[data-field='category']"),
          points: readInputValue(card, "[data-field='points']"),
          description: readInputValue(card, "[data-field='description']"),
          enabled: readInputValue(card, "[data-field='enabled']")
        };
        const result = upsertEvent(nextState, userId, payload);
        if (!result.ok) return showToast(result.error, true);
        nextState = result.state;
        updated += 1;
      }
      applyState(nextState);
      showToast(`Saved ${updated} earning event${updated === 1 ? "" : "s"}.`);
      return;
    }

    if (action === "delete-event") {
      const userId = target.getAttribute("data-user-id");
      const id = target.getAttribute("data-item-id");
      if (!userId || !id) return;
      if (!window.confirm("Delete this event?")) return;
      const result = deleteEvent(state, userId, id);
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      showToast("Event deleted.");
      return;
    }

    if (action === "add-event") {
      const userId = target.getAttribute("data-user-id");
      if (!userId) return;
      const payload = {
        title: readInputValue(document, "#new-event-title"),
        category: readInputValue(document, "#new-event-category"),
        points: readInputValue(document, "#new-event-points"),
        description: readInputValue(document, "#new-event-description"),
        enabled: readInputValue(document, "#new-event-enabled")
      };
      const result = upsertEvent(state, userId, payload);
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      showToast("Event added.");
      return;
    }

    if (action === "save-reward") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const card = target.closest("[data-kind='reward'][data-item-id]");
      if (!userId || !card) return;
      const payload = {
        id: card.getAttribute("data-item-id"),
        title: readInputValue(card, "[data-field='title']"),
        category: readInputValue(card, "[data-field='category']"),
        cost: readInputValue(card, "[data-field='cost']"),
        unlock_at_total: readInputValue(card, "[data-field='unlock_at_total']"),
        enabled: readInputValue(card, "[data-field='enabled']")
      };
      const result = upsertReward(state, userId, payload);
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      showToast("Reward saved.");
      return;
    }

    if (action === "save-all-rewards") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      if (!userId) return;
      const cards = [...document.querySelectorAll(`[data-kind='reward'][data-user-id='${userId}'][data-item-id]`)];
      let nextState = state;
      let updated = 0;
      for (const card of cards) {
        const payload = {
          id: card.getAttribute("data-item-id"),
          title: readInputValue(card, "[data-field='title']"),
          category: readInputValue(card, "[data-field='category']"),
          cost: readInputValue(card, "[data-field='cost']"),
          unlock_at_total: readInputValue(card, "[data-field='unlock_at_total']"),
          enabled: readInputValue(card, "[data-field='enabled']")
        };
        const result = upsertReward(nextState, userId, payload);
        if (!result.ok) return showToast(result.error, true);
        nextState = result.state;
        updated += 1;
      }
      applyState(nextState);
      showToast(`Saved ${updated} redeem event${updated === 1 ? "" : "s"}.`);
      return;
    }

    if (action === "delete-reward") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const id = target.getAttribute("data-item-id");
      if (!userId || !id) return;
      if (!window.confirm("Delete this reward?")) return;
      const result = deleteReward(state, userId, id);
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      showToast("Reward deleted.");
      return;
    }

    if (action === "add-reward") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      if (!userId) return;
      const payload = {
        title: readInputValue(document, "#new-reward-title"),
        category: readInputValue(document, "#new-reward-category"),
        cost: readInputValue(document, "#new-reward-cost"),
        unlock_at_total: readInputValue(document, "#new-reward-unlock"),
        enabled: readInputValue(document, "#new-reward-enabled")
      };
      const result = upsertReward(state, userId, payload);
      if (!result.ok) return showToast(result.error, true);
      applyState(result.state);
      showToast("Reward added.");
    }
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.id === "history-type-filter" && target instanceof HTMLSelectElement) {
      historyFilters.type = target.value;
      rerender();
      return;
    }
    if (target.id === "history-range-filter" && target instanceof HTMLSelectElement) {
      historyFilters.range = target.value;
      rerender();
      return;
    }
    if (target.id === "history-category-filter" && target instanceof HTMLSelectElement) {
      historyFilters.category = target.value;
      rerender();
    }
  }

  function renderCurrent() {
    const state = getState();
    const route = parseRoute(window.location.hash || "#/home");
    const activeUserId = state.settings.active_user_id;

    if (route.kind === "alias") {
      const map = {
        events: "manage-events",
        earning: "manage-events",
        rewards: "manage-events",
        spending: "manage-events",
        history: "history",
        "manage-events": "manage-events"
      };
      const section = map[route.alias] || "dashboard";
      ensureUserHash(activeUserId, section);
      return;
    }

    renderNavActive(route, activeUserId);

    if (route.kind === "home") {
      app.innerHTML = renderHome(state);
      syncAmbientAudio(Boolean(state.settings?.sound_enabled), false);
      return;
    }

    if (route.kind === "settings") {
      app.innerHTML = renderHome(state, renderSettings(state));
      syncAmbientAudio(Boolean(state.settings?.sound_enabled), false);
      return;
    }

    if (route.kind === "user") {
      const user = getUserById(state, route.userId);
      if (!user) {
        app.innerHTML = `<section class="empty">User not found.</section>`;
        syncAmbientAudio(Boolean(state.settings?.sound_enabled), false);
        return;
      }
      if (state.settings.active_user_id !== route.userId) {
        setState(setActiveUser(state, route.userId));
      }
      if (route.section === "dashboard") {
        app.innerHTML = renderHome(getState(), renderUserDashboard(getState(), route.userId));
        syncAmbientAudio(Boolean(getState().settings?.sound_enabled), false);
        return;
      }
      if (route.section === "history") {
        app.innerHTML = renderHome(getState(), renderUserHistory(getState(), route.userId, historyFilters));
        syncAmbientAudio(Boolean(getState().settings?.sound_enabled), false);
        return;
      }
      if (route.section === "manage-events") {
        app.innerHTML = renderHome(getState(), renderManageEvents(getState(), route.userId));
        syncAmbientAudio(Boolean(getState().settings?.sound_enabled), false);
        return;
      }
    }

    app.innerHTML = renderHome(state);
    syncAmbientAudio(Boolean(state.settings?.sound_enabled), false);
  }

  return {
    onRouteChange,
    onGlobalClick,
    onChange,
    renderCurrent
  };
}
