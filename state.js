import { seedState } from "./seed-data.js";

const STORAGE_KEY = "family_points_v2_seed_data_json";
const DEFAULT_SYNC_URL = "https://wtvpts-sync.wslu42-wtvpts.workers.dev";

function makeBaseEvents() {
  return [
    { id: "eat_veg", category: "Food", title: "Ate a vegetable", points: 1, enabled: true, description: "Any green or colorful veggie." },
    { id: "drink_water", category: "Food", title: "Drank water", points: 1, enabled: true, description: "Finished one full cup." },
    { id: "set_table", category: "Chores", title: "Set the table", points: 2, enabled: true, description: "Ready before meal." },
    { id: "tidy_room", category: "Chores", title: "Tidy room", points: 3, enabled: true, description: "Room tidy check passed." },
    { id: "read_15", category: "Learning", title: "Read 15 minutes", points: 2, enabled: true, description: "Book or educational reading." },
    { id: "math_practice", category: "Learning", title: "Math practice", points: 3, enabled: true, description: "Completed assigned practice." },
    { id: "help_others", category: "Other", title: "Helped someone kindly", points: 2, enabled: true, description: "Parent verified helpful act." },
    { id: "exercise", category: "Other", title: "Exercise session", points: 2, enabled: true, description: "At least 15 active minutes." }
  ];
}

function cloneEvents(events) {
  return events.map((e) => ({ ...e }));
}

function makeBaseRewards() {
  return [
    { id: "minigame_1", category: "Game", title: "Play a mini game", cost: 2, unlock_at_total: 0, enabled: true },
    { id: "dessert_pick", category: "Family", title: "Pick family dessert", cost: 4, unlock_at_total: 0, enabled: true },
    { id: "me_time_5", category: "Me-time", title: "Me time 5 min", cost: 3, unlock_at_total: 10, enabled: true },
    { id: "movie_choice", category: "Family", title: "Choose movie tonight", cost: 8, unlock_at_total: 10, enabled: true },
    { id: "extra_game_15", category: "Game", title: "Extra game time 15 min", cost: 10, unlock_at_total: 20, enabled: true },
    { id: "stay_up_15", category: "Me-time", title: "Stay up 15 min later", cost: 12, unlock_at_total: 20, enabled: true },
    { id: "friend_call", category: "Other", title: "Friend video call", cost: 16, unlock_at_total: 50, enabled: true },
    { id: "weekend_pick", category: "Family", title: "Pick weekend activity", cost: 20, unlock_at_total: 50, enabled: true }
  ];
}

function cloneRewards(rewards) {
  return rewards.map((r) => ({ ...r }));
}

function makeDefaultUsers() {
  return [
    { id: "mom", name: "Mom" },
    { id: "dad", name: "Dad" },
    { id: "will", name: "Willow" },
    { id: "grandpa", name: "Grandpa" },
    { id: "grandma", name: "Grandma" },
    { id: "niece", name: "Niece" }
  ];
}

function makeDefaultEventsByUser(users) {
  const base = makeBaseEvents();
  const out = {};
  for (const user of users) {
    out[user.id] = cloneEvents(base);
  }
  return out;
}

function makeDefaultRewardsByUser(users) {
  const base = makeBaseRewards();
  const out = {};
  for (const user of users) {
    out[user.id] = cloneRewards(base);
  }
  return out;
}

function cloneSeedState() {
  const cloned = typeof structuredClone === "function" ? structuredClone(seedState) : JSON.parse(JSON.stringify(seedState));
  return {
    ...cloned,
    settings: {
      parent_pin_hash: "",
      sound_enabled: false,
      github_sync_url: DEFAULT_SYNC_URL,
      ...(cloned.settings || {})
    }
  };
}

export function makeDefaultState() {
  return cloneSeedState();
}

function hashPin(pin) {
  let hash = 2166136261;
  for (let i = 0; i < pin.length; i += 1) {
    hash ^= pin.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isValidSchema(data) {
  const hasEvents = data?.events_by_user && typeof data.events_by_user === "object";
  const hasRewardsByUser = data?.rewards_by_user && typeof data.rewards_by_user === "object";
  const hasLegacyRewards = Array.isArray(data?.rewards);
  return Boolean(
    data &&
      typeof data === "object" &&
      Array.isArray(data.users) &&
      hasEvents &&
      (hasRewardsByUser || hasLegacyRewards) &&
      Array.isArray(data.ledger) &&
      data.settings &&
      typeof data.settings === "object"
  );
}

function migrate(input) {
  if (!input || typeof input !== "object") {
    return makeDefaultState();
  }
  if (!input.version || input.version < 2) {
    return makeDefaultState();
  }
  const defaults = makeDefaultState();
  const defaultUsersById = new Map(defaults.users.map((u) => [u.id, u]));
  const sourceUsers = Array.isArray(input.users) && input.users.length ? input.users : defaults.users;
  const usersById = new Map();
  for (const rawUser of sourceUsers) {
    if (!rawUser || typeof rawUser !== "object") continue;
    const originalId = String(rawUser.id || "").trim();
    if (!originalId) continue;
    const id = originalId === "guest" ? "grandpa" : originalId;
    const defaultName = defaultUsersById.get(id)?.name || id;
    const rawName = String(rawUser.name || "").trim();
    let name = rawName || defaultName;
    if (id === "will" && /^will$/i.test(name)) name = "Willow";
    if (id === "grandpa" && /^guest$/i.test(name)) name = "Grandpa";
    if (!usersById.has(id)) {
      usersById.set(id, { ...rawUser, id, name });
    }
  }
  for (const defUser of defaults.users) {
    if (!usersById.has(defUser.id)) {
      usersById.set(defUser.id, { ...defUser });
    }
  }
  const users = [...usersById.values()];
  const output = {
    ...defaults,
    ...input,
    users,
    settings: {
      ...defaults.settings,
      ...(input.settings || {})
    }
  };

  if (output.settings.active_user_id === "guest") {
    output.settings.active_user_id = "grandpa";
  }
  if (!String(output.settings.github_sync_url || "").trim()) {
    output.settings.github_sync_url = DEFAULT_SYNC_URL;
  }

  if (!output.version || output.version < 1) {
    output.version = 1;
  }

  const rawInputEventsByUser = input.events_by_user && typeof input.events_by_user === "object" ? input.events_by_user : null;
  const rawInputRewardsByUser = input.rewards_by_user && typeof input.rewards_by_user === "object" ? input.rewards_by_user : null;
  const inputEventsByUser = rawInputEventsByUser ? { ...rawInputEventsByUser, grandpa: rawInputEventsByUser.grandpa || rawInputEventsByUser.guest } : null;
  const inputRewardsByUser = rawInputRewardsByUser ? { ...rawInputRewardsByUser, grandpa: rawInputRewardsByUser.grandpa || rawInputRewardsByUser.guest } : null;
  const legacyRewards = Array.isArray(input.rewards) ? input.rewards.filter(Boolean).map((r) => ({ ...r })) : null;
  const nextEventsByUser = {};
  const nextRewardsByUser = {};

  for (const user of users) {
    const rows = inputEventsByUser?.[user.id];
    if (Array.isArray(rows)) {
      nextEventsByUser[user.id] = rows.filter(Boolean).map((r) => ({ ...r }));
      continue;
    }
    nextEventsByUser[user.id] = cloneEvents(makeBaseEvents());
  }
  output.events_by_user = nextEventsByUser;

  for (const user of users) {
    const rows = inputRewardsByUser?.[user.id];
    if (Array.isArray(rows)) {
      nextRewardsByUser[user.id] = rows.filter(Boolean).map((r) => ({ ...r }));
      continue;
    }
    if (legacyRewards?.length) {
      nextRewardsByUser[user.id] = cloneRewards(legacyRewards);
      continue;
    }
    nextRewardsByUser[user.id] = cloneRewards(makeBaseRewards());
  }
  output.rewards_by_user = nextRewardsByUser;
  delete output.rewards;

  // Ensure Grandma/Niece templates are copied from Willow when they are newly introduced.
  const willowEvents = Array.isArray(output.events_by_user?.will) ? output.events_by_user.will.map((e) => ({ ...e })) : null;
  const willowRewards = Array.isArray(output.rewards_by_user?.will) ? output.rewards_by_user.will.map((r) => ({ ...r })) : null;
  for (const targetId of ["grandma", "niece"]) {
    const hadEvents = Boolean(rawInputEventsByUser && Array.isArray(rawInputEventsByUser[targetId]));
    const hadRewards = Boolean(rawInputRewardsByUser && Array.isArray(rawInputRewardsByUser[targetId]));
    if (!hadEvents && willowEvents) {
      output.events_by_user[targetId] = willowEvents.map((e) => ({ ...e }));
    }
    if (!hadRewards && willowRewards) {
      output.rewards_by_user[targetId] = willowRewards.map((r) => ({ ...r }));
    }
  }

  if (!output.users.find((u) => u.id === output.settings.active_user_id)) {
    output.settings.active_user_id = output.users[0]?.id || "";
  }

  output.ledger = output.ledger.filter((row) => {
    if (!row || typeof row !== "object") return false;
    if (row.user_id === "guest") row.user_id = "grandpa";
    return (
      typeof row.user_id === "string" &&
      (row.type === "earn" || row.type === "spend") &&
      Number.isFinite(row.points) &&
      Number.isFinite(row.ts)
    );
  });

  output.version = 2;

  return output;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultState();
    const parsed = JSON.parse(raw);
    if (!isValidSchema(parsed)) return makeDefaultState();
    return migrate(parsed);
  } catch {
    return makeDefaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function replaceState(nextState) {
  const migrated = migrate(nextState);
  saveState(migrated);
  return migrated;
}

export function resetState() {
  const fresh = makeDefaultState();
  saveState(fresh);
  return fresh;
}

export function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getActiveUser(state) {
  return state.users.find((u) => u.id === state.settings.active_user_id) || state.users[0] || null;
}

export function getUserById(state, userId) {
  return state.users.find((u) => u.id === userId) || null;
}

export function getUserEvents(state, userId) {
  const rows = state.events_by_user?.[userId];
  return Array.isArray(rows) ? rows : [];
}

export function getUserRewards(state, userId) {
  const rows = state.rewards_by_user?.[userId];
  return Array.isArray(rows) ? rows : [];
}

export function getAllEventCategories(state) {
  const cats = [];
  for (const user of state.users) {
    for (const event of getUserEvents(state, user.id)) {
      cats.push(event.category);
    }
  }
  return [...new Set(cats)].sort((a, b) => a.localeCompare(b));
}

export function getAllRewardCategories(state) {
  const cats = [];
  for (const user of state.users) {
    for (const reward of getUserRewards(state, user.id)) {
      cats.push(reward.category);
    }
  }
  return [...new Set(cats)].sort((a, b) => a.localeCompare(b));
}

export function getUserLedger(state, userId) {
  return state.ledger.filter((entry) => entry.user_id === userId);
}

export function getUserTotals(state, userId) {
  const rows = getUserLedger(state, userId);
  let earned = 0;
  let spent = 0;
  for (const row of rows) {
    if (row.type === "earn") earned += row.points;
    if (row.type === "spend") spent += row.points;
  }
  return {
    earned_total: earned,
    spent_total: spent,
    balance: earned - spent
  };
}

export function getTodaySummary(state, userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  const rows = getUserLedger(state, userId).filter((entry) => entry.ts >= startMs);
  let earned = 0;
  let spent = 0;
  for (const row of rows) {
    if (row.type === "earn") earned += row.points;
    if (row.type === "spend") spent += row.points;
  }
  return { today_earned: earned, today_spent: spent };
}

export function getRewardUnlockProgress(state, userId) {
  const { earned_total } = getUserTotals(state, userId);
  const thresholds = [...new Set(getUserRewards(state, userId).filter((r) => r.enabled).map((r) => r.unlock_at_total))]
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  const next = thresholds.find((threshold) => threshold > earned_total) ?? null;
  if (next === null) {
    return { next_threshold: null, pct: 100 };
  }
  const prev = [...thresholds].reverse().find((threshold) => threshold <= earned_total) ?? 0;
  const span = Math.max(next - prev, 1);
  const pct = Math.min(100, Math.max(0, ((earned_total - prev) / span) * 100));
  return { next_threshold: next, pct };
}

function uniqueIdFromTitle(items, title, fallbackPrefix) {
  const base = String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const seed = base || `${fallbackPrefix}_${Date.now().toString(36)}`;
  const used = new Set(items.map((row) => row.id));
  if (!used.has(seed)) return seed;
  let i = 2;
  while (used.has(`${seed}_${i}`)) i += 1;
  return `${seed}_${i}`;
}

function withAppendedLedger(state, entry) {
  return {
    ...state,
    ledger: [...state.ledger, entry]
  };
}

export function setActiveUser(state, userId) {
  if (!getUserById(state, userId)) return state;
  return {
    ...state,
    settings: {
      ...state.settings,
      active_user_id: userId
    }
  };
}

export function addEarn(state, { userId, eventId, points, note = "" }) {
  if (!getUserById(state, userId)) {
    return { ok: false, error: "User not found." };
  }
  if (!Number.isFinite(points) || points <= 0) {
    return { ok: false, error: "Points must be a positive number." };
  }
  const event = getUserEvents(state, userId).find((e) => e.id === eventId);
  const entry = {
    id: createId(),
    ts: Date.now(),
    user_id: userId,
    type: "earn",
    ref_kind: "event",
    ref_id: eventId || "custom",
    points: Math.floor(points),
    note: String(note || event?.title || "")
  };
  return {
    ok: true,
    state: withAppendedLedger(state, entry),
    entry
  };
}

export function addQuickPoints(state, { userId, points, note = "" }) {
  if (!getUserById(state, userId)) {
    return { ok: false, error: "User not found." };
  }
  if (!Number.isFinite(points) || points === 0) {
    return { ok: false, error: "Points must be a non-zero number." };
  }
  const whole = Math.trunc(points);
  if (whole === 0) {
    return { ok: false, error: "Points must be a non-zero integer." };
  }
  const entry = {
    id: createId(),
    ts: Date.now(),
    user_id: userId,
    type: whole > 0 ? "earn" : "spend",
    ref_kind: whole > 0 ? "event" : "reward",
    ref_id: "custom_quick",
    points: Math.abs(whole),
    note: String(note || `Quick adjust ${whole > 0 ? "+" : ""}${whole}`)
  };
  return {
    ok: true,
    state: withAppendedLedger(state, entry),
    entry
  };
}

export function redeemReward(state, { userId, rewardId, note = "" }) {
  const user = getUserById(state, userId);
  if (!user) {
    return { ok: false, error: "User not found." };
  }
  const reward = getUserRewards(state, userId).find((r) => r.id === rewardId && r.enabled);
  if (!reward) {
    return { ok: false, error: "Reward not found." };
  }
  const totals = getUserTotals(state, userId);
  if (totals.earned_total < reward.unlock_at_total) {
    return { ok: false, error: "Reward is still locked." };
  }
  if (totals.balance < reward.cost) {
    return { ok: false, error: "Not enough balance points." };
  }
  const entry = {
    id: createId(),
    ts: Date.now(),
    user_id: userId,
    type: "spend",
    ref_kind: "reward",
    ref_id: rewardId,
    points: Math.floor(reward.cost),
    note: String(note || reward.title || "")
  };
  return {
    ok: true,
    state: withAppendedLedger(state, entry),
    entry
  };
}

export function getTopRedeemedRewards(state, userId, limit = 3) {
  const enabledRewards = getUserRewards(state, userId).filter((r) => r.enabled);
  const statMap = new Map();
  for (const row of state.ledger) {
    if (row.user_id !== userId || row.type !== "spend" || row.ref_kind !== "reward") continue;
    if (!statMap.has(row.ref_id)) {
      statMap.set(row.ref_id, { count: 0, latest_ts: 0 });
    }
    const stat = statMap.get(row.ref_id);
    stat.count += 1;
    stat.latest_ts = Math.max(stat.latest_ts, row.ts);
  }

  const ranked = enabledRewards
    .filter((reward) => statMap.has(reward.id))
    .map((reward) => ({ reward, ...statMap.get(reward.id) }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (b.latest_ts !== a.latest_ts) return b.latest_ts - a.latest_ts;
      return a.reward.title.localeCompare(b.reward.title);
    })
    .map((row) => row.reward);

  const picked = ranked.slice(0, limit);
  if (picked.length >= limit) return picked;
  for (const reward of enabledRewards) {
    if (picked.find((p) => p.id === reward.id)) continue;
    picked.push(reward);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function getTopAchievedEvents(state, userId, limit = 3) {
  const enabledEvents = getUserEvents(state, userId).filter((e) => e.enabled);
  const statMap = new Map();
  for (const row of state.ledger) {
    if (row.user_id !== userId || row.type !== "earn" || row.ref_kind !== "event") continue;
    if (!statMap.has(row.ref_id)) {
      statMap.set(row.ref_id, { count: 0, latest_ts: 0 });
    }
    const stat = statMap.get(row.ref_id);
    stat.count += 1;
    stat.latest_ts = Math.max(stat.latest_ts, row.ts);
  }

  const ranked = enabledEvents
    .filter((event) => statMap.has(event.id))
    .map((event) => ({ event, ...statMap.get(event.id) }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (b.latest_ts !== a.latest_ts) return b.latest_ts - a.latest_ts;
      return a.event.title.localeCompare(b.event.title);
    })
    .map((row) => row.event);

  const picked = ranked.slice(0, limit);
  if (picked.length >= limit) return picked;
  for (const event of enabledEvents) {
    if (picked.find((p) => p.id === event.id)) continue;
    picked.push(event);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function upsertEvent(state, userId, payload) {
  if (!getUserById(state, userId)) return { ok: false, error: "User not found." };
  const title = String(payload?.title || "").trim();
  const category = String(payload?.category || "").trim() || "Other";
  const description = String(payload?.description || "").trim();
  const points = Math.floor(Number(payload?.points));
  const enabled = Boolean(payload?.enabled);
  if (!title) return { ok: false, error: "Event title is required." };
  if (!Number.isFinite(points) || points <= 0) return { ok: false, error: "Event points must be a positive integer." };

  const userEvents = getUserEvents(state, userId);
  const incomingId = String(payload?.id || "").trim();
  const existing = userEvents.find((row) => row.id === incomingId);
  const id = existing ? existing.id : uniqueIdFromTitle(userEvents, incomingId || title, "event");
  const nextEvent = { id, title, category, description, points, enabled };
  const nextEvents = existing
    ? userEvents.map((row) => (row.id === id ? nextEvent : row))
    : [...userEvents, nextEvent];

  return {
    ok: true,
    state: {
      ...state,
      events_by_user: {
        ...state.events_by_user,
        [userId]: nextEvents
      }
    },
    item: nextEvent,
    mode: existing ? "updated" : "created"
  };
}

export function deleteEvent(state, userId, id) {
  if (!getUserById(state, userId)) return { ok: false, error: "User not found." };
  const targetId = String(id || "").trim();
  const userEvents = getUserEvents(state, userId);
  const exists = userEvents.some((row) => row.id === targetId);
  if (!exists) return { ok: false, error: "Event not found." };
  return {
    ok: true,
    state: {
      ...state,
      events_by_user: {
        ...state.events_by_user,
        [userId]: userEvents.filter((row) => row.id !== targetId)
      }
    }
  };
}

export function upsertReward(state, userId, payload) {
  if (!getUserById(state, userId)) return { ok: false, error: "User not found." };
  const title = String(payload?.title || "").trim();
  const category = String(payload?.category || "").trim() || "Other";
  const cost = Math.floor(Number(payload?.cost));
  const unlockAt = Math.floor(Number(payload?.unlock_at_total));
  const enabled = Boolean(payload?.enabled);
  if (!title) return { ok: false, error: "Reward title is required." };
  if (!Number.isFinite(cost) || cost <= 0) return { ok: false, error: "Reward cost must be a positive integer." };
  if (!Number.isFinite(unlockAt) || unlockAt < 0) return { ok: false, error: "Unlock threshold must be 0 or higher." };

  const userRewards = getUserRewards(state, userId);
  const incomingId = String(payload?.id || "").trim();
  const existing = userRewards.find((row) => row.id === incomingId);
  const id = existing ? existing.id : uniqueIdFromTitle(userRewards, incomingId || title, "reward");
  const nextReward = { id, title, category, cost, unlock_at_total: unlockAt, enabled };

  const nextRewards = existing
    ? userRewards.map((row) => (row.id === id ? nextReward : row))
    : [...userRewards, nextReward];

  return {
    ok: true,
    state: {
      ...state,
      rewards_by_user: {
        ...state.rewards_by_user,
        [userId]: nextRewards
      }
    },
    item: nextReward,
    mode: existing ? "updated" : "created"
  };
}

export function deleteReward(state, userId, id) {
  if (!getUserById(state, userId)) return { ok: false, error: "User not found." };
  const targetId = String(id || "").trim();
  const userRewards = getUserRewards(state, userId);
  const exists = userRewards.some((row) => row.id === targetId);
  if (!exists) return { ok: false, error: "Reward not found." };
  return {
    ok: true,
    state: {
      ...state,
      rewards_by_user: {
        ...state.rewards_by_user,
        [userId]: userRewards.filter((row) => row.id !== targetId)
      }
    }
  };
}

export function exportState(state) {
  return JSON.stringify(state, null, 2);
}

export function parseImportJson(text) {
  const parsed = JSON.parse(text);
  if (!isValidSchema(parsed)) {
    throw new Error("Invalid file format.");
  }
  return migrate(parsed);
}

export function listCategories(items) {
  return [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b));
}

export function groupByCategory(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.category)) {
      map.set(item.category, []);
    }
    map.get(item.category).push(item);
  }
  return map;
}

export function resolveRefTitle(state, entry) {
  if (entry.ref_kind === "event") {
    const event = getUserEvents(state, entry.user_id).find((e) => e.id === entry.ref_id);
    return event?.title || entry.note || entry.ref_id;
  }
  if (entry.ref_kind === "reward") {
    const reward = getUserRewards(state, entry.user_id).find((r) => r.id === entry.ref_id);
    return reward?.title || entry.note || entry.ref_id;
  }
  return entry.note || "";
}

export function sortLedgerNewestFirst(ledgerRows) {
  return [...ledgerRows].sort((a, b) => b.ts - a.ts);
}

export function verifyPin(state, inputPin) {
  const hash = state.settings.parent_pin_hash;
  if (!hash) return true;
  return hash === hashPin(inputPin);
}

export function setParentPin(state, newPin) {
  if (!newPin) {
    return {
      ...state,
      settings: {
        ...state.settings,
        parent_pin_hash: ""
      }
    };
  }
  if (!/^\d{4}$/.test(newPin)) {
    throw new Error("PIN must be exactly 4 digits.");
  }
  return {
    ...state,
    settings: {
      ...state.settings,
      parent_pin_hash: hashPin(newPin)
    }
  };
}

export { STORAGE_KEY };
