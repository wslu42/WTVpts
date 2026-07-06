import {
  setActiveUser,
  setLanguage,
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
  getUserRewards,
  addWeightRecord,
  deleteWeightRecord,
  addBloodPressureRecord,
  deleteBloodPressureRecord,
  upsertCalendarEvent,
  importCalendarEvents,
  toggleCalendarEventDone,
  deleteCalendarEvent
} from "./state.js";
import {
  renderNavActive,
  renderOverview,
  renderHome,
  renderCalendarToday,
  renderCalendarWeek,
  renderFavoriteLinks,
  renderGuideCenter,
  renderUserDashboard,
  renderUserHealth,
  renderUserHistory,
  renderManageEvents,
  renderSettings
} from "./render.js";
import { getLanguage, t, translateMessage } from "./i18n.js";

const app = document.getElementById("app");
const ambientAudio = new Audio("./lake.mp3");
ambientAudio.loop = true;
ambientAudio.preload = "auto";
ambientAudio.volume = 0;
const AUTO_SYNC_PUSH_DEBOUNCE_MS = 1200;
const AUTO_SYNC_PULL_INTERVAL_MS = 15000;
let runtimeSyncKey = "";

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

async function syncAmbientAudio(enabled, fromUserGesture = false, state = null) {
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
        showToast(t(getLanguage(state), "unableStartAudio"), true);
      }
      return;
    }
  }
  fadeAudioTo(0.14, 1600);
}

function parseRoute(hash) {
  const raw = hash.replace(/^#/, "") || "/overview";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "user" && parts[1]) {
    const section = parts[2] || "dashboard";
    const allowed = new Set(["dashboard", "health", "history", "manage-events"]);
    const normalized = allowed.has(section) ? section : "dashboard";
    return {
      kind: "user",
      userId: parts[1],
      section: normalized,
      raw: path,
      top: normalized === "dashboard" ? "home" : normalized === "manage-events" ? "manage" : normalized
    };
  }

  if (parts[0] === "overview" || parts.length === 0) return { kind: "overview", raw: path, top: "overview" };
  if (parts[0] === "calendar") {
    const section = parts[1] === "today" ? "today" : "week";
    return { kind: "calendar", section, raw: path, top: "calendar" };
  }
  if (parts[0] === "links") return { kind: "links", raw: path, top: "links" };
  if (parts[0] === "guides") return { kind: "guides", raw: path, top: "guides" };
  if (parts[0] === "settings") return { kind: "settings", raw: path, top: "settings" };
  if (parts[0] === "home") return { kind: "home", raw: path, top: "home" };
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

function localizedError(state, message) {
  return translateMessage(getLanguage(state), message);
}

function parseSyncError(payload, status, lang) {
  const baseError = String(payload?.error || `${t(lang, "syncFailed")} (${status})`);
  const rawDetail = typeof payload?.detail === "string" ? payload.detail : "";
  let detailMsg = "";
  if (rawDetail) {
    try {
      const parsedDetail = JSON.parse(rawDetail);
      detailMsg = String(parsedDetail?.message || parsedDetail?.error || rawDetail);
    } catch {
      detailMsg = rawDetail;
    }
  }
  const clippedDetail = detailMsg.length > 180 ? `${detailMsg.slice(0, 180)}...` : detailMsg;
  return clippedDetail ? `${baseError}: ${clippedDetail}` : baseError;
}

function getStoredSyncKey() {
  return runtimeSyncKey;
}

function setStoredSyncKey(value) {
  runtimeSyncKey = String(value || "").trim();
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
  const entered = window.prompt(t(getLanguage(storeState), "enterParentPin", { action: actionName }), "");
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

function unfoldIcsLines(text) {
  return String(text || "").replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function splitIcsProperty(line) {
  const index = line.indexOf(":");
  if (index < 0) return null;
  const left = line.slice(0, index);
  const value = line.slice(index + 1);
  const [name, ...params] = left.split(";");
  return {
    name: String(name || "").toUpperCase(),
    params,
    value
  };
}

function unescapeIcsText(value) {
  return String(value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseIcsDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{8}$/.test(raw)) {
    return { date: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`, time: "" };
  }
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!match) return { date: "", time: "" };
  if (match[7]) {
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] || 0)));
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
  }
  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: `${match[4]}:${match[5]}`
  };
}

function parseIcsCalendarEvents(text) {
  const lines = unfoldIcsLines(text);
  const events = [];
  let current = null;
  for (const line of lines) {
    const trimmed = String(line || "").trim();
    if (trimmed === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (trimmed === "END:VEVENT") {
      if (current) {
        const start = parseIcsDate(current.DTSTART || "");
        const noteParts = [current.DESCRIPTION, current.LOCATION ? `${current.LOCATION}` : ""].filter(Boolean);
        events.push({
          id: current.UID ? `ics_${current.UID.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80)}` : undefined,
          title: current.SUMMARY || current.DESCRIPTION || "Imported event",
          date: start.date,
          time: start.time,
          category: current.CATEGORIES || "Imported",
          assigned_to: [],
          done: false,
          repeat: "none",
          note: noteParts.join("\n")
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const prop = splitIcsProperty(trimmed);
    if (!prop) continue;
    if (["UID", "SUMMARY", "DESCRIPTION", "LOCATION", "CATEGORIES", "DTSTART"].includes(prop.name)) {
      current[prop.name] = unescapeIcsText(prop.value);
    }
  }
  return events.filter((event) => event.title && event.date);
}

export function createController(getState, setState, rerender) {
  const historyFilters = {
    type: "all",
    range: "7",
    category: "all"
  };
  let autoPushTimer = null;
  let autoPullTimer = null;
  let syncBusy = false;
  let dirtySinceLastPush = false;
  let lastSyncedSha = "";
  let syncEndpointBound = "";
  let visibilityHooked = false;
  let forcingSyncKeyPrompt = false;

  function getSyncEndpoint(state) {
    return String(state.settings?.github_sync_url || "").trim();
  }

  function getSyncKey() {
    return getStoredSyncKey();
  }

  function enforceSyncKeyPromptIfNeeded() {
    if (forcingSyncKeyPrompt) return;
    const currentState = getState();
    const lang = getLanguage(currentState);
    const endpoint = getSyncEndpoint(currentState);
    if (!endpoint || getSyncKey()) return;
    forcingSyncKeyPrompt = true;
    try {
      while (!getSyncKey()) {
        const entered = window.prompt(t(lang, "syncKeyRequiredPrompt"), "");
        const key = String(entered || "").trim();
        if (key) {
          setStoredSyncKey(key);
          showToast(t(lang, "syncKeySaved"));
          break;
        }
        window.alert(t(lang, "syncKeyRequiredAlert"));
      }
    } finally {
      forcingSyncKeyPrompt = false;
    }
    ensureAutoSyncLoop();
  }

  function focusSyncKeyInput() {
    const input = document.getElementById("github-sync-key");
    if (!(input instanceof HTMLInputElement)) return;
    input.focus();
    input.select();
  }

  function redirectToSettingsForSyncUnlock(message = t(getLanguage(getState()), "syncLockedSettings")) {
    if (!window.location.hash.startsWith("#/settings")) {
      window.location.hash = "#/settings";
    }
    setTimeout(() => {
      rerender();
      focusSyncKeyInput();
    }, 0);
    showToast(message, true);
  }

  function stateFingerprint(state) {
    return JSON.stringify(state);
  }

  function applyState(next, options = {}) {
    setState(next);
    rerender();
    if (!options.skipAutoPush) {
      dirtySinceLastPush = true;
      scheduleAutoPush();
    }
  }

  async function pushStateToGithub({ silent = true } = {}) {
    if (syncBusy) return false;
    const current = getState();
    const lang = getLanguage(current);
    const endpoint = getSyncEndpoint(current);
    const syncKey = getSyncKey();
    if (!endpoint || !syncKey) return false;
    syncBusy = true;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sync-Key": syncKey
        },
        body: JSON.stringify({ state: current })
      });
      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }
      if (!res.ok) {
        if (!silent) showToast(parseSyncError(payload, res.status, lang), true);
        return false;
      }
      lastSyncedSha = String(payload?.sha || lastSyncedSha || "");
      dirtySinceLastPush = false;
      if (!silent) {
        const shortCommit = payload?.commit ? ` (${String(payload.commit).slice(0, 7)})` : "";
        showToast(t(lang, "syncedToGithub", { commit: shortCommit }));
      }
      return true;
    } catch {
      if (!silent) showToast(t(lang, "syncRequestFailed"), true);
      return false;
    } finally {
      syncBusy = false;
    }
  }

  async function pullStateFromGithub({ silent = true } = {}) {
    if (syncBusy || dirtySinceLastPush) return false;
    const current = getState();
    const lang = getLanguage(current);
    const endpoint = getSyncEndpoint(current);
    const syncKey = getSyncKey();
    if (!endpoint || !syncKey) return false;
    syncBusy = true;
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          "X-Sync-Key": syncKey
        }
      });
      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }
      if (!res.ok) {
        if (!silent) showToast(parseSyncError(payload, res.status, lang), true);
        return false;
      }
      const remoteState = payload?.state;
      const remoteSha = String(payload?.sha || "");
      if (!remoteState || typeof remoteState !== "object") {
        if (!silent) showToast(t(lang, "invalidFileFormat"), true);
        return false;
      }
      if (remoteSha && remoteSha === lastSyncedSha) return true;
      if (stateFingerprint(remoteState) === stateFingerprint(current)) {
        lastSyncedSha = remoteSha || lastSyncedSha;
        return true;
      }
      const imported = replaceState({
        ...remoteState,
        settings: {
          ...(remoteState.settings || {}),
          github_sync_url: getSyncEndpoint(current)
        }
      });
      applyState(imported, { skipAutoPush: true });
      lastSyncedSha = remoteSha || lastSyncedSha;
      dirtySinceLastPush = false;
      if (!silent) showToast(t(lang, "loadedLatestGithub"));
      return true;
    } catch {
      if (!silent) showToast(t(lang, "pullFailed"), true);
      return false;
    } finally {
      syncBusy = false;
    }
  }

  function scheduleAutoPush() {
    if (autoPushTimer) clearTimeout(autoPushTimer);
    autoPushTimer = setTimeout(() => {
      pushStateToGithub({ silent: true });
    }, AUTO_SYNC_PUSH_DEBOUNCE_MS);
  }

  function ensureAutoSyncLoop() {
    const endpoint = getSyncEndpoint(getState());
    const syncKey = getSyncKey();
    if (!endpoint || !syncKey) {
      if (autoPullTimer) {
        clearInterval(autoPullTimer);
        autoPullTimer = null;
      }
      syncEndpointBound = "";
      lastSyncedSha = "";
      return;
    }
    if (endpoint !== syncEndpointBound) {
      syncEndpointBound = endpoint;
      lastSyncedSha = "";
      pullStateFromGithub({ silent: true });
    }
    if (!autoPullTimer) {
      autoPullTimer = setInterval(() => {
        pullStateFromGithub({ silent: true });
      }, AUTO_SYNC_PULL_INTERVAL_MS);
    }
    if (!visibilityHooked) {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          pullStateFromGithub({ silent: true });
        }
      });
      visibilityHooked = true;
    }
  }

  function onRouteChange() {
    rerender();
    ensureAutoSyncLoop();
  }

  function formDataObject(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function resetSubmittedForm(form) {
    form.reset();
    const defaultContext = form.querySelector("[name='measurementContext']");
    if (defaultContext instanceof HTMLSelectElement) {
      defaultContext.value = "resting";
    }
  }

  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const action = form.getAttribute("data-action");
    if (action !== "add-weight-record" && action !== "add-bp-record" && action !== "add-calendar-event") return;
    event.preventDefault();

    const state = getState();
    const currentLanguage = getLanguage(state);
    document.documentElement.lang = currentLanguage;
    document.title = t(currentLanguage, "appTitle");
    const lang = getLanguage(state);
    const userId = form.getAttribute("data-user-id") || state.settings.active_user_id;
    const data = formDataObject(form);

    if (action === "add-calendar-event") {
      const assignedTo = String(data.assigned_to || "").trim();
      const result = upsertCalendarEvent(state, {
        title: data.title,
        date: data.date,
        time: data.time,
        category: data.category,
        assigned_to: assignedTo ? [assignedTo] : [],
        note: data.note
      });
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      resetSubmittedForm(form);
      const dateInput = form.querySelector("[name='date']");
      if (dateInput instanceof HTMLInputElement) dateInput.value = result.event.date;
      showToast(t(lang, "calendarEventSaved"));
      return;
    }

    if (action === "add-weight-record") {
      const result = addWeightRecord(state, userId, {
        kg: Number(data.kg),
        note: data.note
      });
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      resetSubmittedForm(form);
      showToast(t(lang, "kgLatest", { kg: result.record.kg }));
      return;
    }

    if (action === "add-bp-record") {
      const result = addBloodPressureRecord(state, userId, {
        systolic: Number(data.systolic),
        diastolic: Number(data.diastolic),
        pulse: Number(data.pulse),
        mealStatus: String(data.mealStatus || "unknown"),
        medicationTaken: data.medicationTaken === "true",
        medicationDose: data.medicationDose,
        hadDizziness: Boolean(data.hadDizziness),
        hadBreathlessness: Boolean(data.hadBreathlessness),
        hadChestTightness: Boolean(data.hadChestTightness),
        hadVisionChange: Boolean(data.hadVisionChange),
        energyChange: String(data.energyChange || "unchanged"),
        measurementContext: String(data.measurementContext || "resting"),
        note: data.note
      });
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      resetSubmittedForm(form);
      showToast(t(lang, "latestBp", { systolic: result.record.systolic, diastolic: result.record.diastolic }));
    }
  }

  async function onGlobalClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.getAttribute("data-action");
    const state = getState();
    const lang = getLanguage(state);

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
      syncAmbientAudio(enabled, true, state);
      return;
    }

    if (action === "switch-language") {
      const next = setLanguage(state, target.getAttribute("data-language"));
      applyState(next);
      return;
    }

    if (action === "quick-add") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const points = Number(target.getAttribute("data-points"));
      const result = addEarn(state, { userId, eventId: "custom_quick", points, note: `Quick add +${points}` });
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "pointsAdded", { points }));
      return;
    }

    if (action === "quick-add-custom") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const input = document.getElementById("custom-add-points");
      const points = Math.trunc(Number(input?.value || 0));
      if (!Number.isFinite(points) || points === 0) return showToast(t(lang, "enterNonZeroNumber"), true);
      const result = addQuickPoints(state, { userId, points, note: `Quick adjust ${points > 0 ? "+" : ""}${points}` });
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      if (input) input.value = "1";
      showToast(t(lang, "pointsApplied", { points: `${points > 0 ? "+" : ""}${points}` }));
      return;
    }

    if (action === "achieve-event") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const eventId = target.getAttribute("data-event-id");
      const userEvents = state.events_by_user?.[userId] || [];
      const eventObj = userEvents.find((e) => e.id === eventId);
      if (!eventObj) return showToast(t(lang, "eventNotFound"), true);
      const result = addEarn(state, { userId, eventId: eventObj.id, points: eventObj.points, note: eventObj.title });
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "earnedPoint", { points: eventObj.points, title: eventObj.title }));
      return;
    }

    if (action === "redeem-reward" || action === "quick-redeem") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const rewardId = target.getAttribute("data-reward-id");
      const reward = getUserRewards(state, userId).find((r) => r.id === rewardId);
      if (!reward) return showToast(t(lang, "rewardNotFound"), true);
      const result = redeemReward(state, { userId, rewardId, note: reward.title });
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "redeemedPoint", { cost: reward.cost, title: reward.title }));
      return;
    }

    if (action === "delete-weight-record") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const recordId = target.getAttribute("data-record-id");
      if (!userId || !recordId) return;
      if (!window.confirm(t(lang, "deleteWeightConfirm"))) return;
      const result = deleteWeightRecord(state, userId, recordId);
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "weightDeleted"));
      return;
    }

    if (action === "delete-bp-record") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const recordId = target.getAttribute("data-record-id");
      if (!userId || !recordId) return;
      if (!window.confirm(t(lang, "deleteBloodPressureConfirm"))) return;
      const result = deleteBloodPressureRecord(state, userId, recordId);
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "bloodPressureDeleted"));
      return;
    }

    if (action === "toggle-calendar-event") {
      const eventId = target.getAttribute("data-event-id");
      if (!eventId) return;
      const result = toggleCalendarEventDone(state, eventId);
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      return;
    }

    if (action === "delete-calendar-event") {
      const eventId = target.getAttribute("data-event-id");
      if (!eventId) return;
      if (!window.confirm(t(lang, "deleteCalendarEventConfirm"))) return;
      const result = deleteCalendarEvent(state, eventId);
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "calendarEventDeleted"));
      return;
    }

    if (action === "import-ics") {
      const input = document.getElementById("calendar-ics-file");
      const file = input?.files?.[0];
      if (!file) return showToast(t(lang, "selectIcsFirst"), true);
      const reader = new FileReader();
      reader.onload = () => {
        const events = parseIcsCalendarEvents(String(reader.result || ""));
        const result = importCalendarEvents(getState(), events);
        if (!result.ok) return showToast(t(getLanguage(getState()), "noIcsEventsFound"), true);
        applyState(result.state);
        if (input) input.value = "";
        showToast(t(getLanguage(result.state), "icsImportCompleted", { count: result.count }));
      };
      reader.onerror = () => showToast(t(lang, "icsImportFailed"), true);
      reader.readAsText(file);
      return;
    }

    if (action === "export-json") {
      downloadJsonFile("data.json", exportState(state));
      showToast(t(lang, "exportedData"));
      return;
    }

    if (action === "import-json") {
      const input = document.getElementById("import-file");
      const file = input?.files?.[0];
      if (!file) return showToast(t(lang, "selectJsonFirst"), true);
      if (!askPinIfNeeded(state, t(lang, "importSelectedJson"))) return showToast(t(lang, "invalidPin"), true);
      if (!window.confirm(t(lang, "importReplaceConfirm"))) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = parseImportJson(String(reader.result || ""));
          applyState(replaceState(parsed));
          if (input) input.value = "";
          showToast(t(lang, "importCompleted"));
        } catch (error) {
          showToast(translateMessage(lang, error.message || t(lang, "importFailed")), true);
        }
      };
      reader.onerror = () => showToast(t(lang, "importFailed"), true);
      reader.readAsText(file);
      return;
    }

    if (action === "save-sync-url") {
      const input = document.getElementById("github-sync-url");
      const url = String(input?.value || "").trim();
      if (url && !/^https?:\/\//i.test(url)) {
        return showToast(t(lang, "urlMustStartHttp"), true);
      }
      const next = {
        ...state,
        settings: {
          ...state.settings,
          github_sync_url: url
        }
      };
      applyState(next);
      showToast(url ? t(lang, "urlSaved") : t(lang, "urlCleared"));
      ensureAutoSyncLoop();
      return;
    }

    if (action === "save-sync-key") {
      const input = document.getElementById("github-sync-key");
      const key = String(input?.value || "").trim();
      setStoredSyncKey(key);
      if (input) input.value = "";
      if (!key) {
        showToast(t(lang, "syncKeyEmpty"), true);
      } else {
        showToast(t(lang, "syncKeySaved"));
      }
      ensureAutoSyncLoop();
      return;
    }

    if (action === "prompt-sync-key") {
      enforceSyncKeyPromptIfNeeded();
      focusSyncKeyInput();
      return;
    }

    if (action === "sync-github") {
      const endpoint = getSyncEndpoint(state);
      if (!endpoint) {
        return showToast(t(lang, "urlMustStartHttp"), true);
      }
      if (!getSyncKey()) {
        enforceSyncKeyPromptIfNeeded();
        if (!getSyncKey()) {
          redirectToSettingsForSyncUnlock(t(lang, "syncKeyMissing"));
          return;
        }
      }
      await pushStateToGithub({ silent: false });
      return;
    }

    if (action === "reset-state") {
      if (!askPinIfNeeded(state, t(lang, "resetFactory"))) return showToast(t(lang, "invalidPin"), true);
      if (!window.confirm(t(lang, "resetConfirm"))) return;
      applyState(resetState());
      showToast(t(lang, "resetComplete"));
      return;
    }

    if (action === "set-pin") {
      const input = document.getElementById("parent-pin-input");
      const val = String(input?.value || "").trim();
      try {
        const next = setParentPin(state, val);
        applyState(next);
        if (input) input.value = "";
        showToast(t(lang, "pinSaved"));
      } catch (error) {
        showToast(translateMessage(lang, error.message || t(lang, "invalidPin")), true);
      }
      return;
    }

    if (action === "clear-pin") {
      const next = setParentPin(state, "");
      applyState(next);
      const input = document.getElementById("parent-pin-input");
      if (input) input.value = "";
      showToast(t(lang, "pinCleared"));
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
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "earningEventSaved"));
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
        if (!result.ok) return showToast(localizedError(state, result.error), true);
        nextState = result.state;
        updated += 1;
      }
      applyState(nextState);
      showToast(t(lang, "earningPointsSaved", { count: updated, plural: updated === 1 ? "" : "s" }));
      return;
    }

    if (action === "delete-event") {
      const userId = target.getAttribute("data-user-id");
      const id = target.getAttribute("data-item-id");
      if (!userId || !id) return;
      if (!window.confirm(t(lang, "deleteEventConfirm"))) return;
      const result = deleteEvent(state, userId, id);
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "eventDeleted"));
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
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "eventAdded"));
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
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "rewardSaved"));
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
        if (!result.ok) return showToast(localizedError(state, result.error), true);
        nextState = result.state;
        updated += 1;
      }
      applyState(nextState);
      showToast(t(lang, "redeemEventsSaved", { count: updated, plural: updated === 1 ? "" : "s" }));
      return;
    }

    if (action === "delete-reward") {
      const userId = target.getAttribute("data-user-id") || state.settings.active_user_id;
      const id = target.getAttribute("data-item-id");
      if (!userId || !id) return;
      if (!window.confirm(t(lang, "deleteRewardConfirm"))) return;
      const result = deleteReward(state, userId, id);
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "rewardDeleted"));
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
      if (!result.ok) return showToast(localizedError(state, result.error), true);
      applyState(result.state);
      showToast(t(lang, "rewardAdded"));
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
    enforceSyncKeyPromptIfNeeded();
    ensureAutoSyncLoop();
    const route = parseRoute(window.location.hash || "#/overview");
    const activeUserId = state.settings.active_user_id;

    if (route.kind === "alias") {
      const map = {
        events: "manage-events",
        earning: "manage-events",
        rewards: "manage-events",
        spending: "manage-events",
        health: "health",
        history: "history",
        "manage-events": "manage-events"
      };
      const section = map[route.alias] || "dashboard";
      ensureUserHash(activeUserId, section);
      return;
    }

    renderNavActive(route, activeUserId);

    if (route.kind === "overview") {
      app.innerHTML = renderOverview(state);
      syncAmbientAudio(Boolean(state.settings?.sound_enabled), false, state);
      return;
    }

    if (route.kind === "home") {
      app.innerHTML = renderHome(state);
      syncAmbientAudio(Boolean(state.settings?.sound_enabled), false, state);
      return;
    }

    if (route.kind === "calendar") {
      app.innerHTML = route.section === "today" ? renderCalendarToday(state) : renderCalendarWeek(state);
      syncAmbientAudio(Boolean(state.settings?.sound_enabled), false, state);
      return;
    }

    if (route.kind === "links") {
      app.innerHTML = renderFavoriteLinks(state);
      syncAmbientAudio(Boolean(state.settings?.sound_enabled), false, state);
      return;
    }

    if (route.kind === "guides") {
      app.innerHTML = renderGuideCenter(state);
      syncAmbientAudio(Boolean(state.settings?.sound_enabled), false, state);
      return;
    }

    if (route.kind === "settings") {
      app.innerHTML = renderSettings(state, { syncKeySet: Boolean(getSyncKey()) });
      syncAmbientAudio(Boolean(state.settings?.sound_enabled), false, state);
      return;
    }

    if (route.kind === "user") {
      const user = getUserById(state, route.userId);
      if (!user) {
        app.innerHTML = `<section class="empty">${t(getLanguage(state), "userNotFound")}</section>`;
        syncAmbientAudio(Boolean(state.settings?.sound_enabled), false, state);
        return;
      }
      if (state.settings.active_user_id !== route.userId) {
        setState(setActiveUser(state, route.userId));
      }
      if (route.section === "dashboard") {
        app.innerHTML = renderHome(getState(), renderUserDashboard(getState(), route.userId));
        syncAmbientAudio(Boolean(getState().settings?.sound_enabled), false, getState());
        return;
      }
      if (route.section === "health") {
        app.innerHTML = renderHome(getState(), renderUserHealth(getState(), route.userId));
        syncAmbientAudio(Boolean(getState().settings?.sound_enabled), false, getState());
        return;
      }
      if (route.section === "history") {
        app.innerHTML = renderHome(getState(), renderUserHistory(getState(), route.userId, historyFilters));
        syncAmbientAudio(Boolean(getState().settings?.sound_enabled), false, getState());
        return;
      }
      if (route.section === "manage-events") {
        app.innerHTML = renderHome(getState(), renderManageEvents(getState(), route.userId));
        syncAmbientAudio(Boolean(getState().settings?.sound_enabled), false, getState());
        return;
      }
    }

    app.innerHTML = renderHome(state);
    syncAmbientAudio(Boolean(state.settings?.sound_enabled), false, state);
  }

  return {
    onRouteChange,
    onGlobalClick,
    onChange,
    onSubmit,
    renderCurrent
  };
}
