import {
  getUserById,
  getUserTotals,
  getTodaySummary,
  getRewardUnlockProgress,
  getUserEvents,
  getUserRewards,
  getUserWeightRecords,
  getUserBloodPressureRecords,
  getCalendarEventsForDate,
  getCalendarEventsForWeek,
  getFavoriteLinks,
  getGuideLinks,
  toLocalDateKey,
  getAllEventCategories,
  getAllRewardCategories,
  listCategories,
  groupByCategory,
  resolveRefTitle,
  sortLedgerNewestFirst
} from "./state.js";
import {
  ZH_TW_LANGUAGE,
  displayCategory,
  displayLocalizedField,
  displayUserName,
  formatDateForLanguage,
  formatShortDateForLanguage,
  getLanguage,
  t
} from "./i18n.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderPointsGrid(balance, lang) {
  const safe = Math.max(0, Math.floor(balance));
  const capped = Math.min(safe, 200);
  const cells = [];
  for (let i = 0; i < capped; i += 1) {
    cells.push(`<div class="point-cell filled" title="${t(lang, "point")} ${i + 1}"></div>`);
  }
  const remainder = Math.max(0, 20 - (capped % 20));
  const blanks = capped === 0 ? 20 : Math.min(remainder, 20);
  for (let i = 0; i < blanks; i += 1) {
    cells.push('<div class="point-cell"></div>');
  }
  return `<div class="points-grid">${cells.join("")}</div>${safe > 200 ? `<p class="muted">${t(lang, "showingFirstPoints", { count: safe })}</p>` : ""}`;
}

function userSummaryCard(state, user) {
  const lang = getLanguage(state);
  const totals = getUserTotals(state, user.id);
  const today = getTodaySummary(state, user.id);
  return `
    <button class="card card-clickable user-card tone-${escapeHtml(user.id)}" data-action="open-user" data-user-id="${escapeHtml(user.id)}">
      <div class="summary-head">
        <h3 class="user-name">${escapeHtml(displayUserName(lang, user))}</h3>
        <div class="summary-keystats">
          <div class="stat-line"><span>${t(lang, "balance")}</span><strong>${totals.balance}</strong></div>
          <div class="stat-line"><span>${t(lang, "earnedTotal")}</span><strong>${totals.earned_total}</strong></div>
        </div>
      </div>
      <div class="stat-line stat-line-plain muted"><span>${t(lang, "todayEarned")}</span><span>+${today.today_earned}</span></div>
      <div class="stat-line stat-line-plain muted"><span>${t(lang, "todayRedeemed")}</span><span>-${today.today_spent}</span></div>
    </button>
  `;
}

function portalIcon(key) {
  const icons = {
    overview: "\u{1F3E0}",
    calendar: "\u{1F4C5}",
    home: "\u2B50",
    links: "\u{1F517}",
    guides: "\u{1F3AE}",
    settings: "\u2699\uFE0F"
  };
  return icons[key] || "";
}

function renderPortalNav(activeKey, lang) {
  const icon = (key) =>
    ({
      overview: "🏠",
      calendar: "📅",
      home: "⭐",
      links: "🔗",
      guides: "🎮",
      settings: "⚙️"
    })[key] || "";
  const tabs = [
    { key: "overview", label: t(lang, "overview"), href: "#/overview" },
    { key: "calendar", label: t(lang, "familyCalendar"), href: "#/calendar/week" },
    { key: "home", label: t(lang, "familyDashboard"), href: "#/home" },
    { key: "links", label: t(lang, "favoriteLinks"), href: "#/links" },
    { key: "guides", label: t(lang, "guideCenter"), href: "#/guides" },
    { key: "settings", label: t(lang, "settings"), href: "#/settings" }
  ];
  return `
    <nav class="nav-links portal-nav" aria-label="${t(lang, "overview")}">
      ${tabs.map((tab) => `<a href="${tab.href}" class="${activeKey === tab.key ? "active" : ""}">${portalIcon(tab.key)} ${tab.label}</a>`).join("")}
    </nav>
  `;
}

function renderPortalHeader(state, activeKey, title, description = "") {
  const lang = getLanguage(state);
  const nextLang = lang === ZH_TW_LANGUAGE ? "en" : ZH_TW_LANGUAGE;
  const nextLangLabel = lang === ZH_TW_LANGUAGE ? t(lang, "languageEnglish") : t(lang, "languageTaiwan");
  const icon =
    {
      overview: "🏠",
      calendar: "📅",
      home: "⭐",
      links: "🔗",
      guides: "🎮",
      settings: "⚙️"
    }[activeKey] || "";
  return `
    <div class="home-header">
      <div>
        <h1 class="page-title">${portalIcon(activeKey) ? `${portalIcon(activeKey)} ` : ""}${title}</h1>
        ${description ? `<p class="muted">${description}</p>` : ""}
      </div>
      <div class="inline-row">
        <button class="btn-secondary home-settings-btn" data-action="switch-language" data-language="${nextLang}">${nextLangLabel}</button>
        <a class="btn-secondary home-settings-btn" href="#/settings">${t(lang, "settings")}</a>
      </div>
    </div>
    ${renderPortalNav(activeKey, lang)}
  `;
}

export function renderNavActive(route, activeUserId) {
  if (route.top === "settings") {
    document.body.setAttribute("data-user-theme", "system");
  } else if (route.kind === "home" || route.kind === "overview" || route.kind === "calendar" || route.kind === "links" || route.kind === "guides") {
    document.body.setAttribute("data-user-theme", "system");
  } else if (route.kind === "user" && route.userId) {
    document.body.setAttribute("data-user-theme", route.userId);
  } else {
    document.body.setAttribute("data-user-theme", activeUserId || "system");
  }
}

function renderUserWorkspaceTabs(userId, section, userName, lang) {
  const tabs = [
    { key: "dashboard", label: t(lang, "dashboard"), href: `#/user/${userId}` },
    { key: "health", label: t(lang, "health"), href: `#/user/${userId}/health` },
    { key: "history", label: t(lang, "history"), href: `#/user/${userId}/history` },
    { key: "manage-events", label: t(lang, "manageEvents"), href: `#/user/${userId}/manage-events` }
  ];
  return `
    <section class="card">
      <h1 class="page-title">${escapeHtml(userName)}</h1>
      <nav class="nav-links" aria-label="${t(lang, "manageEvents")}">
        ${tabs.map((t) => `<a href="${t.href}" class="${section === t.key ? "active" : ""}">${t.label}</a>`).join("")}
      </nav>
    </section>
  `;
}

export function renderHome(state, embeddedHtml = "") {
  const lang = getLanguage(state);
  const cards = state.users.map((user) => userSummaryCard(state, user)).join("");
  const soundEnabled = Boolean(state.settings?.sound_enabled);
  const nextLang = lang === ZH_TW_LANGUAGE ? "en" : ZH_TW_LANGUAGE;
  const nextLangLabel = lang === ZH_TW_LANGUAGE ? t(lang, "languageEnglish") : t(lang, "languageTaiwan");
  return `
    <section class="card">
      <div class="home-header">
        <h1 class="page-title"><a class="home-title-link" href="#/home">⭐ ${t(lang, "familyDashboard")}</a></h1>
        <div class="inline-row">
          <button class="btn-secondary home-settings-btn" data-action="switch-language" data-language="${nextLang}">${nextLangLabel}</button>
          <button class="btn-secondary home-settings-btn" data-action="toggle-sound" aria-pressed="${soundEnabled ? "true" : "false"}">${soundEnabled ? t(lang, "soundOn") : t(lang, "soundOff")}</button>
          <a class="btn-secondary home-settings-btn" href="#/settings">${t(lang, "settings")}</a>
        </div>
      </div>
      ${renderPortalNav("home", lang)}
      <p class="muted">${t(lang, "chooseUserCard")}</p>
      <div class="grid-2">${cards}</div>
      ${embeddedHtml ? `<div class="section-divider" aria-hidden="true"></div><div class="home-embedded">${embeddedHtml}</div>` : ""}
    </section>
  `;
}

function formatDateHeading(lang, dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(lang === ZH_TW_LANGUAGE ? "zh-TW" : undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function renderCalendarEventList(events, lang) {
  if (!events.length) {
    return `<div class="empty">${t(lang, "noCalendarEvents")}</div>`;
  }
  return `
    <div class="calendar-event-list">
      ${events
        .map(
          (event) => `
        <article class="calendar-event ${event.done ? "is-done" : ""}">
          <label class="calendar-event-check">
            <input type="checkbox" data-action="toggle-calendar-event" data-event-id="${escapeHtml(event.id)}" ${event.done ? "checked" : ""} />
            <span>
              <strong>${escapeHtml(event.title)}</strong>
              <span class="muted">${event.time ? `${escapeHtml(event.time)} | ` : ""}${escapeHtml(event.category)}</span>
              ${event.note ? `<span class="muted">${escapeHtml(event.note)}</span>` : ""}
            </span>
          </label>
          <button class="btn-delete-subtle" data-action="delete-calendar-event" data-event-id="${escapeHtml(event.id)}">${t(lang, "delete")}</button>
        </article>
      `
        )
        .join("")}
    </div>
  `;
}

function renderCalendarForm(state, dateKey, lang) {
  return `
    <form class="calendar-form" data-action="add-calendar-event">
      <input name="title" type="text" maxlength="120" placeholder="${t(lang, "title")}" required />
      <input name="date" type="date" value="${escapeHtml(dateKey)}" required />
      <input name="time" type="time" />
      <input name="category" type="text" maxlength="60" placeholder="${t(lang, "category")}" value="${t(lang, "family")}" />
      <select name="assigned_to">
        <option value="">${t(lang, "everyone")}</option>
        ${state.users.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(displayUserName(lang, user))}</option>`).join("")}
      </select>
      <input name="note" type="text" maxlength="180" placeholder="${t(lang, "noteOptional")}" />
      <button class="btn-primary" type="submit">${t(lang, "addCalendarEvent")}</button>
    </form>
  `;
}

function renderCalendarImport(lang) {
  return `
    <section class="calendar-import">
      <h2>${t(lang, "importIcs")}</h2>
      <div class="inline-row">
        <label class="btn-secondary" for="calendar-ics-file" role="button" tabindex="0">${t(lang, "chooseIcsFile")}</label>
        <input id="calendar-ics-file" type="file" accept=".ics,text/calendar" style="display:none" />
        <button class="btn-secondary" data-action="import-ics">${t(lang, "importIcs")}</button>
      </div>
      <p class="muted">${t(lang, "importIcsDescription")}</p>
    </section>
  `;
}

export function renderOverview(state) {
  const lang = getLanguage(state);
  const todayKey = toLocalDateKey(new Date());
  const todayEvents = getCalendarEventsForDate(state, todayKey);
  const remaining = todayEvents.filter((event) => !event.done).length;
  const cards = [
    {
      href: "#/calendar/today",
      title: t(lang, "todayTasks"),
      meta: t(lang, "todayTaskCount", { count: remaining }),
      body: t(lang, "todayTasksDescription")
    },
    {
      href: "#/calendar/week",
      key: "calendar",
      title: t(lang, "familyCalendar"),
      meta: t(lang, "thisWeek"),
      body: t(lang, "familyCalendarDescription")
    },
    {
      href: "#/home",
      key: "home",
      title: t(lang, "familyDashboard"),
      meta: t(lang, "pointsRewards"),
      body: t(lang, "familyDashboardDescription")
    },
    {
      href: "#/links",
      key: "links",
      title: t(lang, "favoriteLinks"),
      meta: t(lang, "quickAccess"),
      body: t(lang, "favoriteLinksDescription")
    },
    {
      href: "#/guides",
      key: "guides",
      title: t(lang, "guideCenter"),
      meta: t(lang, "gameGuides"),
      body: t(lang, "guideCenterDescription")
    },
    {
      href: "#/settings",
      key: "settings",
      title: t(lang, "settings"),
      meta: t(lang, "importExport"),
      body: t(lang, "settingsDescription")
    }
  ];
  return `
    <section class="card">
      ${renderPortalHeader(state, "overview", t(lang, "familyPortal"), t(lang, "familyPortalDescription"))}
      <div class="portal-grid">
        ${cards
          .map(
            (card) => `
          <a class="portal-card" href="${card.href}">
            <span class="badge">${card.meta}</span>
            <strong>${card.key ? `${portalIcon(card.key)} ` : ""}${card.title}</strong>
            <span class="muted">${card.body}</span>
          </a>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

export function renderCalendarToday(state) {
  const lang = getLanguage(state);
  const todayKey = toLocalDateKey(new Date());
  const events = getCalendarEventsForDate(state, todayKey);
  return `
    <section class="card">
      ${renderPortalHeader(state, "calendar", t(lang, "todayTasks"), formatDateHeading(lang, todayKey))}
      ${renderCalendarEventList(events, lang)}
      <div class="section-divider" aria-hidden="true"></div>
      <h2>${t(lang, "addCalendarEvent")}</h2>
      ${renderCalendarForm(state, todayKey, lang)}
      <div class="section-divider" aria-hidden="true"></div>
      ${renderCalendarImport(lang)}
    </section>
  `;
}

export function renderCalendarWeek(state) {
  const lang = getLanguage(state);
  const todayKey = toLocalDateKey(new Date());
  const days = getCalendarEventsForWeek(state);
  return `
    <section class="card">
      ${renderPortalHeader(state, "calendar", t(lang, "familyCalendar"), t(lang, "familyCalendarDescription"))}
      <nav class="nav-links sub-nav" aria-label="${t(lang, "familyCalendar")}">
        <a href="#/calendar/today">${t(lang, "todayTasks")}</a>
        <a class="active" href="#/calendar/week">${t(lang, "thisWeek")}</a>
      </nav>
      <div class="calendar-week">
        ${days
          .map(
            (day) => `
          <section class="calendar-day ${day.date === todayKey ? "is-today" : ""}">
            <h3>${escapeHtml(formatDateHeading(lang, day.date))}</h3>
            ${renderCalendarEventList(day.events, lang)}
          </section>
        `
          )
          .join("")}
      </div>
      <div class="section-divider" aria-hidden="true"></div>
      <h2>${t(lang, "addCalendarEvent")}</h2>
      ${renderCalendarForm(state, todayKey, lang)}
      <div class="section-divider" aria-hidden="true"></div>
      ${renderCalendarImport(lang)}
    </section>
  `;
}

function renderLinksByCategory(links, lang, options = {}) {
  const compact = Boolean(options.compact);
  if (!links.length) {
    return `<div class="empty">${t(lang, "noFavoriteLinks")}</div>`;
  }
  const linkTitle = (link) => displayLocalizedField(lang, link, "title");
  const linkCategory = (link) => displayLocalizedField(lang, link, "category");
  const linkNote = (link) => displayLocalizedField(lang, link, "note");
  const guideLinkIcon = (link) =>
    ({
      acnh_flower_breeding: "\u{1F338}",
      acnh_flower_guide: "\u{1F33C}",
      acnh_turnip_price: "\u{1F5BC}\uFE0F",
      acnh_mystery_islands: "\u{1F3DD}\uFE0F",
      acnh_bugs: "\u{1FAB2}",
      acnh_fish: "\u{1F41F}",
      tos_guide: "\u{1F9E9}"
    })[link.id] || "";
  const categories = [...new Set(links.map(linkCategory))].sort((a, b) => a.localeCompare(b));
  return categories
    .map((category) => {
      const rows = links.filter((link) => linkCategory(link) === category);
      return `
        <section class="category-block">
          <h2 class="category-title">${escapeHtml(category)}</h2>
          <div class="link-grid">
            ${rows
              .map(
                (link) => `
              <a class="link-card" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
                <strong>${compact && guideLinkIcon(link) ? `${guideLinkIcon(link)} ` : ""}${escapeHtml(linkTitle(link))}</strong>
                ${
                  compact
                    ? ""
                    : `${linkNote(link) ? `<span class="muted">${escapeHtml(linkNote(link))}</span>` : ""}
                <span class="muted">${escapeHtml(link.url)}</span>`
                }
              </a>
            `
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

export function renderFavoriteLinks(state) {
  const lang = getLanguage(state);
  return `
    <section class="card">
      ${renderPortalHeader(state, "links", t(lang, "favoriteLinks"), t(lang, "favoriteLinksDescription"))}
      ${renderLinksByCategory(getFavoriteLinks(state), lang)}
    </section>
  `;
}

export function renderGuideCenter(state) {
  const lang = getLanguage(state);
  return `
    <section class="card">
      ${renderPortalHeader(state, "guides", t(lang, "guideCenter"), t(lang, "guideCenterDescription"))}
      ${renderLinksByCategory(getGuideLinks(state), lang, { compact: true })}
    </section>
  `;
}

export function renderUserDashboard(state, userId) {
  const lang = getLanguage(state);
  const user = getUserById(state, userId);
  if (!user) return `<section class="empty">${t(lang, "userNotFound")}</section>`;
  const totals = getUserTotals(state, user.id);
  const unlock = getRewardUnlockProgress(state, user.id);
  const quickEvents = getUserEvents(state, user.id).filter((event) => event.enabled);
  const quickRewards = getUserRewards(state, user.id).filter((reward) => reward.enabled);
  const quickEarnByCategory = groupByCategory(quickEvents);
  const quickEarnHtml = listCategories(quickEvents)
    .map((category) => {
      const rows = quickEarnByCategory.get(category) || [];
      const cards = rows
        .map(
          (event) => `
          <button class="item-card quick-item-card quick-card-button quick-earn-card is-enabled" data-action="achieve-event" data-event-id="${escapeHtml(event.id)}" data-user-id="${escapeHtml(user.id)}">
            <div class="quick-card-status quick-card-status-plain">${t(lang, "earn")}</div>
            <strong>${escapeHtml(event.title)}</strong>
            <div class="muted">+${event.points} ${t(lang, event.points === 1 ? "point" : "points")}</div>
          </button>`
        )
        .join("");
      const spanClass = rows.length >= 4 ? "quick-category-span-2" : "";
      return `
      <section class="category-block quick-category ${spanClass}">
        <h3 class="category-title">${escapeHtml(displayCategory(lang, category))}</h3>
        <div class="quick-items">${cards}</div>
      </section>`;
    })
    .join("");

  const quickRewardByCategory = groupByCategory(quickRewards);
  const quickRewardHtml = listCategories(quickRewards)
    .map((category) => {
      const rows = [...(quickRewardByCategory.get(category) || [])].sort((a, b) => {
        if (a.unlock_at_total !== b.unlock_at_total) return a.unlock_at_total - b.unlock_at_total;
        if (a.cost !== b.cost) return a.cost - b.cost;
        return String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" });
      });
      const cards = rows
        .map((reward) => {
          const isLocked = totals.earned_total < reward.unlock_at_total;
          const canAfford = totals.balance >= reward.cost;
          const disabled = isLocked || !canAfford;
          return `
          <button class="item-card quick-item-card quick-card-button quick-redeem-card ${disabled ? "is-disabled" : "is-enabled"}" data-action="quick-redeem" data-reward-id="${escapeHtml(reward.id)}" data-user-id="${escapeHtml(user.id)}" ${disabled ? "disabled" : ""}>
            <div class="quick-card-status quick-card-status-plain">${isLocked ? t(lang, "locked") : canAfford ? t(lang, "redeem") : t(lang, "needPoints")}</div>
            <strong>${escapeHtml(reward.title)}</strong>
            <div class="muted">${t(lang, "cost")} ${reward.cost} | ${t(lang, "unlockAt")} ${reward.unlock_at_total}</div>
          </button>`;
        })
        .join("");
      const spanClass = rows.length >= 3 ? "quick-category-span-2" : "";
      return `
      <section class="category-block quick-category ${spanClass}">
        <h3 class="category-title">${escapeHtml(displayCategory(lang, category))}</h3>
        <div class="quick-items">${cards}</div>
      </section>`;
    })
    .join("");

  return `
    ${renderUserWorkspaceTabs(user.id, "dashboard", displayUserName(lang, user), lang)}
    <section class="card">
      <div class="inline-row">
        <span class="badge">${t(lang, "balance")}: ${totals.balance}</span>
        <span class="badge">${t(lang, "earnedTotal")}: ${totals.earned_total}</span>
      </div>
      ${renderPointsGrid(totals.balance, lang)}
      <div class="progress-wrap">
        <div class="muted">${unlock.next_threshold === null ? t(lang, "allUnlockMilestonesReached") : `${t(lang, "unlockAt")} ${unlock.next_threshold}`}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${unlock.pct.toFixed(0)}%"></div></div>
      </div>
    </section>
    <section class="card">
      <h2>${t(lang, "redeem")}</h2>
      <p class="muted">${t(lang, "allEnabledRedeemEvents")}</p>
      <div class="quick-categories">${quickRewardHtml || `<p class="muted">${t(lang, "noRewardsEnabled")}</p>`}</div>
    </section>
    <section class="card">
      <h2>${t(lang, "earn")}</h2>
      <p class="muted">${t(lang, "allEnabledEarningEvents")}</p>
      <div class="quick-categories">${quickEarnHtml || `<p class="muted">${t(lang, "earningEventsConfiguredEmpty")}</p>`}</div>
    </section>
  `;
}

function renderCategoryCards(items, type, userId, lang = "en") {
  const categories = listCategories(items);
  const grouped = groupByCategory(items);

  return categories
    .map((category) => {
      const rows = grouped.get(category) || [];
      const rowHtml = rows
        .map((item) => {
          if (type === "event") {
            return `
              <article class="item-card">
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <div class="muted">+${item.points} point${item.points === 1 ? "" : "s"}</div>
                  ${item.description ? `<div class="muted">${escapeHtml(item.description)}</div>` : ""}
                </div>
                <div class="item-footer">
                  <span class="badge">${escapeHtml(displayCategory(lang, item.category))}</span>
                  <button class="btn-primary" data-action="achieve-event" data-user-id="${escapeHtml(userId)}" data-event-id="${escapeHtml(item.id)}">${t(lang, "earn")}</button>
                </div>
              </article>
            `;
          }

          return `
            <article class="item-card" data-reward-id="${escapeHtml(item.id)}">
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <div class="muted">Cost: ${item.cost} | Unlock @ ${item.unlock_at_total}</div>
              </div>
              <div class="item-footer">
                <span class="badge">${escapeHtml(displayCategory(lang, item.category))}</span>
                <button class="btn-primary" data-action="redeem-reward" data-user-id="${escapeHtml(userId)}" data-reward-id="${escapeHtml(item.id)}">${t(lang, "redeem")}</button>
              </div>
            </article>
          `;
        })
        .join("");

      return `
        <section class="category-block card">
          <h3 class="category-title">${escapeHtml(category)}</h3>
          <div class="grid-2">${rowHtml}</div>
        </section>
      `;
    })
    .join("");
}

function filterUserLedger(state, userId, filters) {
  const now = Date.now();
  let earliest = 0;
  if (filters.range === "7") earliest = now - 7 * 24 * 60 * 60 * 1000;
  if (filters.range === "30") earliest = now - 30 * 24 * 60 * 60 * 1000;

  return sortLedgerNewestFirst(state.ledger).filter((entry) => {
    if (entry.user_id !== userId) return false;
    if (filters.type !== "all" && entry.type !== filters.type) return false;
    if (entry.ts < earliest) return false;
    if (filters.category !== "all") {
      if (entry.ref_kind === "event") {
        const event = getUserEvents(state, userId).find((e) => e.id === entry.ref_id);
        if (event?.category !== filters.category) return false;
      }
      if (entry.ref_kind === "reward") {
        const reward = getUserRewards(state, userId).find((r) => r.id === entry.ref_id);
        if (reward?.category !== filters.category) return false;
      }
    }
    return true;
  });
}

export function renderUserHistory(state, userId, filters) {
  const lang = getLanguage(state);
  const user = getUserById(state, userId);
  if (!user) return `<section class="empty">${t(lang, "userNotFound")}</section>`;
  const categories = [...new Set([...getAllEventCategories(state), ...getAllRewardCategories(state)])].sort((a, b) => a.localeCompare(b));
  const rows = filterUserLedger(state, userId, filters);
  const tr = rows
    .map((entry) => {
      const pts = entry.type === "earn" ? `+${entry.points}` : `-${entry.points}`;
      const displayType = entry.type === "spend" ? "redeem" : entry.type;
      return `
      <tr>
        <td>${escapeHtml(formatDateForLanguage(lang, entry.ts))}</td>
        <td>${displayType === "redeem" ? t(lang, "redeem") : t(lang, "earn")}</td>
        <td>${escapeHtml(resolveRefTitle(state, entry))}</td>
        <td>${escapeHtml(pts)}</td>
        <td>${escapeHtml(entry.note || "")}</td>
      </tr>`;
    })
    .join("");

  return `
    ${renderUserWorkspaceTabs(user.id, "history", displayUserName(lang, user), lang)}
    <section class="card">
      <h2>${t(lang, "history")}</h2>
      <div class="filters">
        <select id="history-type-filter">
          <option value="all" ${filters.type === "all" ? "selected" : ""}>${t(lang, "allTypes")}</option>
          <option value="earn" ${filters.type === "earn" ? "selected" : ""}>${t(lang, "earn")}</option>
          <option value="spend" ${filters.type === "spend" ? "selected" : ""}>${t(lang, "redeem")}</option>
        </select>
        <select id="history-range-filter">
          <option value="7" ${filters.range === "7" ? "selected" : ""}>${t(lang, "last7Days")}</option>
          <option value="30" ${filters.range === "30" ? "selected" : ""}>${t(lang, "last30Days")}</option>
          <option value="all" ${filters.range === "all" ? "selected" : ""}>${t(lang, "allTime")}</option>
        </select>
        <select id="history-category-filter">
          <option value="all">${t(lang, "allCategories")}</option>
          ${categories.map((c) => `<option value="${escapeHtml(c)}" ${filters.category === c ? "selected" : ""}>${escapeHtml(displayCategory(lang, c))}</option>`).join("")}
        </select>
      </div>
    </section>
    <section class="card table-wrap">
      ${rows.length ? `<table><thead><tr><th>${t(lang, "time")}</th><th>${t(lang, "type")}</th><th>${t(lang, "item")}</th><th>${t(lang, "points")}</th><th>${t(lang, "note")}</th></tr></thead><tbody>${tr}</tbody></table>` : `<div class="empty">${t(lang, "noLedgerMatches")}</div>`}
    </section>
  `;
}

function renderWeightTrend(records, lang) {
  const oldest = [...records].sort((a, b) => a.ts - b.ts).slice(-12);
  if (!oldest.length) {
    return `<div class="empty health-empty">${t(lang, "noWeightRecords")}</div>`;
  }
  const min = Math.min(...oldest.map((record) => record.kg));
  const max = Math.max(...oldest.map((record) => record.kg));
  const span = Math.max(max - min, 1);
  const points = oldest
    .map((record, index) => {
      const x = oldest.length === 1 ? 50 : 8 + (index / (oldest.length - 1)) * 84;
      const y = 84 - ((record.kg - min) / span) * 68;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return `
    <div class="health-trend" aria-label="${t(lang, "weightTrend")}">
      <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
        <polyline points="${points}" />
        ${oldest
          .map((record, index) => {
            const x = oldest.length === 1 ? 50 : 8 + (index / (oldest.length - 1)) * 84;
            const y = 84 - ((record.kg - min) / span) * 68;
            return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4"><title>${escapeHtml(formatShortDateForLanguage(lang, record.ts))}: ${record.kg} kg</title></circle>`;
          })
          .join("")}
      </svg>
      <div class="health-trend-labels">
        <span>${escapeHtml(formatShortDateForLanguage(lang, oldest[0].ts))}</span>
        <strong>${oldest[oldest.length - 1].kg} kg</strong>
        <span>${escapeHtml(formatShortDateForLanguage(lang, oldest[oldest.length - 1].ts))}</span>
      </div>
    </div>
  `;
}

function renderWeightRows(records, userId, lang) {
  if (!records.length) {
    return `<div class="empty">${t(lang, "noWeightRecords")}</div>`;
  }
  return `
    <div class="health-list">
      ${records
        .map(
          (record) => `
        <article class="health-record-row">
          <div>
            <strong>${record.kg} kg</strong>
            <div class="muted">${escapeHtml(formatDateForLanguage(lang, record.ts))}</div>
            ${record.note ? `<div class="muted">${escapeHtml(record.note)}</div>` : ""}
          </div>
          <button class="btn-delete-subtle" data-action="delete-weight-record" data-user-id="${escapeHtml(userId)}" data-record-id="${escapeHtml(record.id)}">${t(lang, "delete")}</button>
        </article>
      `
        )
        .join("")}
    </div>
  `;
}

function renderBloodPressureRows(records, userId, lang) {
  if (!records.length) {
    return `<div class="empty">${t(lang, "noBloodPressureRecords")}</div>`;
  }
  return `
    <div class="health-list">
      ${records
        .map(
          (record) => `
        <article class="health-record-row">
          <div>
            <strong>${record.systolic}/${record.diastolic} mmHg</strong>
            <div class="muted">${t(lang, "pulse")} ${record.pulse} | ${escapeHtml(formatDateForLanguage(lang, record.ts))}</div>
            <div class="muted">${formatBloodPressureDetails(record, lang)}</div>
          </div>
          <button class="btn-delete-subtle" data-action="delete-bp-record" data-user-id="${escapeHtml(userId)}" data-record-id="${escapeHtml(record.id)}">${t(lang, "delete")}</button>
        </article>
      `
        )
        .join("")}
    </div>
  `;
}

function formatBloodPressureDetails(record, lang) {
  const meal = { before_meal: t(lang, "beforeMeal"), after_meal: t(lang, "afterMeal"), unknown: t(lang, "mealUnknown") }[record.mealStatus] || t(lang, "mealUnknown");
  const context = { resting: t(lang, "resting"), post_exercise: t(lang, "postExercise"), unknown: t(lang, "contextUnknown") }[record.measurementContext] || t(lang, "contextUnknown");
  const symptoms = [];
  if (record.hadDizziness) symptoms.push(t(lang, "dizzy"));
  if (record.hadBreathlessness) symptoms.push(t(lang, "breathless"));
  if (record.hadChestTightness) symptoms.push(t(lang, "chestTightness"));
  if (record.hadVisionChange) symptoms.push(t(lang, "visionChange"));
  const medicine = record.medicationTaken ? `${t(lang, "medicineTaken")}${record.medicationDose ? `: ${escapeHtml(record.medicationDose)}` : ""}` : t(lang, "noMedicine");
  const note = record.note ? ` | ${escapeHtml(record.note)}` : "";
  return `${meal} | ${context} | ${medicine} | ${symptoms.length ? symptoms.join(", ") : t(lang, "none")}${note}`;
}

export function renderUserHealth(state, userId) {
  const lang = getLanguage(state);
  const user = getUserById(state, userId);
  if (!user) return `<section class="empty">${t(lang, "userNotFound")}</section>`;
  const weightRecords = getUserWeightRecords(state, userId);
  const bpRecords = getUserBloodPressureRecords(state, userId);
  const latestWeight = weightRecords[0];
  const isGrandpa = userId === "grandpa";

  return `
    ${renderUserWorkspaceTabs(user.id, "health", displayUserName(lang, user), lang)}
    <section class="card">
      <div class="health-header">
        <div>
          <h2>${t(lang, "weight")}</h2>
          <p class="muted">${t(lang, "trackWeightKg", { name: escapeHtml(displayUserName(lang, user)) })}</p>
        </div>
        <span class="badge">${latestWeight ? t(lang, "kgLatest", { kg: latestWeight.kg }) : t(lang, "noRecords")}</span>
      </div>
      <form class="health-form" data-action="add-weight-record" data-user-id="${escapeHtml(user.id)}">
        <input name="kg" type="number" min="1" max="500" step="0.1" placeholder="kg" required />
        <input name="note" type="text" maxlength="120" placeholder="${t(lang, "noteOptional")}" />
        <button class="btn-primary" type="submit">${t(lang, "addWeight")}</button>
      </form>
      ${renderWeightTrend(weightRecords, lang)}
      ${renderWeightRows(weightRecords, user.id, lang)}
    </section>
    ${
      isGrandpa
        ? `
      <section class="card">
        <div class="health-header">
          <div>
            <h2>${t(lang, "bloodPressure")}</h2>
            <p class="muted">${t(lang, "bloodPressureOnlyGrandpa")}</p>
          </div>
          <span class="badge">${bpRecords[0] ? t(lang, "latestBp", { systolic: bpRecords[0].systolic, diastolic: bpRecords[0].diastolic }) : t(lang, "noRecords")}</span>
        </div>
        <form class="health-form health-form-grid" data-action="add-bp-record" data-user-id="${escapeHtml(user.id)}">
          <input name="systolic" type="number" min="60" max="250" step="1" placeholder="${t(lang, "systolic")}" required />
          <input name="diastolic" type="number" min="30" max="150" step="1" placeholder="${t(lang, "diastolic")}" required />
          <input name="pulse" type="number" min="30" max="220" step="1" placeholder="${t(lang, "pulse")}" required />
          <select name="mealStatus">
            <option value="unknown">${t(lang, "mealUnknown")}</option>
            <option value="before_meal">${t(lang, "beforeMeal")}</option>
            <option value="after_meal">${t(lang, "afterMeal")}</option>
          </select>
          <select name="medicationTaken">
            <option value="false">${t(lang, "noMedicine")}</option>
            <option value="true">${t(lang, "medicineTaken")}</option>
          </select>
          <input name="medicationDose" type="text" maxlength="120" placeholder="${t(lang, "medicineNote")}" />
          <select name="energyChange">
            <option value="unchanged">${t(lang, "energyUnchanged")}</option>
            <option value="better">${t(lang, "energyBetter")}</option>
            <option value="worse">${t(lang, "energyWorse")}</option>
          </select>
          <select name="measurementContext">
            <option value="resting">${t(lang, "resting")}</option>
            <option value="post_exercise">${t(lang, "postExercise")}</option>
            <option value="unknown">${t(lang, "contextUnknown")}</option>
          </select>
          <label><input name="hadDizziness" type="checkbox" /> ${t(lang, "dizzy")}</label>
          <label><input name="hadBreathlessness" type="checkbox" /> ${t(lang, "breathless")}</label>
          <label><input name="hadChestTightness" type="checkbox" /> ${t(lang, "chestTightness")}</label>
          <label><input name="hadVisionChange" type="checkbox" /> ${t(lang, "visionChange")}</label>
          <input class="health-form-wide" name="note" type="text" maxlength="240" placeholder="${t(lang, "noteOptional")}" />
          <button class="btn-primary health-form-wide" type="submit">${t(lang, "addBloodPressure")}</button>
        </form>
        ${renderBloodPressureRows(bpRecords, user.id, lang)}
      </section>`
        : ""
    }
  `;
}

export function renderManageEvents(state, userId) {
  const lang = getLanguage(state);
  const user = getUserById(state, userId);
  if (!user) return `<section class="empty">${t(lang, "userNotFound")}</section>`;
  const compareByCategoryThenTitle = (a, b) => {
    const aCategory = String(a.category || "").trim();
    const bCategory = String(b.category || "").trim();
    const byCategory = aCategory.localeCompare(bCategory, undefined, { sensitivity: "base" });
    if (byCategory !== 0) return byCategory;
    const aTitle = String(a.title || "").trim();
    const bTitle = String(b.title || "").trim();
    return aTitle.localeCompare(bTitle, undefined, { sensitivity: "base" });
  };
  const userEvents = [...getUserEvents(state, userId)].sort(compareByCategoryThenTitle);
  const userRewards = [...getUserRewards(state, userId)].sort(compareByCategoryThenTitle);
  const eventRows = userEvents
    .map(
      (item) => `
      <article class="item-card manage-card" data-kind="event" data-item-id="${escapeHtml(item.id)}" data-user-id="${escapeHtml(user.id)}">
        <div class="inline-row">
          <input data-field="title" type="text" value="${escapeHtml(item.title)}" placeholder="${t(lang, "title")}" />
          <input data-field="category" type="text" value="${escapeHtml(item.category)}" placeholder="${t(lang, "category")}" />
          <input data-field="points" type="number" min="1" step="1" value="${item.points}" placeholder="${t(lang, "points")}" />
          <label><input data-field="enabled" type="checkbox" ${item.enabled ? "checked" : ""} /> ${t(lang, "pinEnabled")}</label>
        </div>
        <input data-field="description" type="text" value="${escapeHtml(item.description || "")}" placeholder="${t(lang, "descriptionOptional")}" />
        <div class="inline-row">
          <button class="btn-delete-subtle" data-action="delete-event" data-user-id="${escapeHtml(user.id)}" data-item-id="${escapeHtml(item.id)}">${t(lang, "delete")}</button>
          <span class="muted">id: ${escapeHtml(item.id)}</span>
        </div>
      </article>
    `
    )
    .join("");

  const rewardRows = userRewards
    .map(
      (item) => `
      <article class="item-card manage-card" data-kind="reward" data-user-id="${escapeHtml(user.id)}" data-item-id="${escapeHtml(item.id)}">
        <div class="inline-row">
          <input data-field="title" type="text" value="${escapeHtml(item.title)}" placeholder="${t(lang, "title")}" />
          <input data-field="category" type="text" value="${escapeHtml(item.category)}" placeholder="${t(lang, "category")}" />
          <input data-field="cost" type="number" min="1" step="1" value="${item.cost}" placeholder="${t(lang, "cost")}" />
          <input data-field="unlock_at_total" type="number" min="0" step="1" value="${item.unlock_at_total}" placeholder="${t(lang, "unlockAt")}" />
          <label><input data-field="enabled" type="checkbox" ${item.enabled ? "checked" : ""} /> ${t(lang, "pinEnabled")}</label>
        </div>
        <div class="inline-row">
          <button class="btn-delete-subtle" data-action="delete-reward" data-user-id="${escapeHtml(user.id)}" data-item-id="${escapeHtml(item.id)}">${t(lang, "delete")}</button>
          <span class="muted">id: ${escapeHtml(item.id)}</span>
        </div>
      </article>
    `
    )
    .join("");

  return `
    ${renderUserWorkspaceTabs(user.id, "manage-events", displayUserName(lang, user), lang)}
    <section class="card">
      <h2>${t(lang, "manageEvents")}</h2>
      <p class="muted">${t(lang, "manageEventsForUser", { name: escapeHtml(displayUserName(lang, user)) })}</p>
      <section class="card manage-subsection">
        <h3>${t(lang, "redeem")}</h3>
        <article class="item-card redeem-new-card">
          <div class="inline-row">
            <input id="new-reward-title" type="text" placeholder="${t(lang, "title")}" />
            <input id="new-reward-category" type="text" placeholder="${t(lang, "category")}" />
            <input id="new-reward-cost" type="number" min="1" step="1" value="1" />
            <input id="new-reward-unlock" type="number" min="0" step="1" value="0" />
            <label><input id="new-reward-enabled" type="checkbox" checked /> ${t(lang, "pinEnabled")}</label>
          </div>
          <button class="btn-primary" data-action="add-reward" data-user-id="${escapeHtml(user.id)}">${t(lang, "addNewRedeemEvent")}</button>
        </article>
        <div class="section-divider" aria-hidden="true"></div>
        <div class="manage-list">${rewardRows || `<div class="empty">${t(lang, "redeemEventsConfiguredEmpty")}</div>`}</div>
        <button class="btn-primary btn-block" data-action="save-all-rewards" data-user-id="${escapeHtml(user.id)}">${t(lang, "saveAllRedeemEvents")}</button>
      </section>

      <div class="manage-block-divider" aria-hidden="true"></div>

      <section class="card manage-subsection">
        <h3>${t(lang, "earning")}</h3>
        <article class="item-card earning-new-card">
          <div class="inline-row">
            <input id="new-event-title" type="text" placeholder="${t(lang, "title")}" />
            <input id="new-event-category" type="text" placeholder="${t(lang, "category")}" />
            <input id="new-event-points" type="number" min="1" step="1" value="1" />
            <label><input id="new-event-enabled" type="checkbox" checked /> ${t(lang, "pinEnabled")}</label>
          </div>
          <input id="new-event-description" type="text" placeholder="${t(lang, "descriptionOptional")}" />
          <button class="btn-primary" data-action="add-event" data-user-id="${escapeHtml(user.id)}">${t(lang, "addNewEarningEvent")}</button>
        </article>
        <div class="section-divider" aria-hidden="true"></div>
        <div class="manage-list">${eventRows || `<div class="empty">${t(lang, "earningEventsConfiguredEmpty")}</div>`}</div>
        <button class="btn-primary btn-block" data-action="save-all-events" data-user-id="${escapeHtml(user.id)}">${t(lang, "saveAllEarningEvents")}</button>
      </section>
    </section>
  `;
}

export function renderSettings(state, syncMeta = {}) {
  const lang = getLanguage(state);
  const hasPin = Boolean(state.settings.parent_pin_hash);
  const syncUrl = String(state.settings?.github_sync_url || "");
  const autoSyncOn = Boolean(syncUrl);
  const syncKeySet = Boolean(syncMeta.syncKeySet);

  return `
    <section class="card">
      ${renderPortalHeader(state, "settings", t(lang, "settings"), t(lang, "backupRestoreSafety"))}
    </section>

    <section class="card">
      <h2>${t(lang, "language")}</h2>
      <div class="inline-row">
        <button class="btn-secondary ${lang === "en" ? "active" : ""}" data-action="switch-language" data-language="en">${t(lang, "languageEnglish")}</button>
        <button class="btn-secondary ${lang === ZH_TW_LANGUAGE ? "active" : ""}" data-action="switch-language" data-language="${ZH_TW_LANGUAGE}">${t(lang, "languageTaiwan")}</button>
      </div>
    </section>

    <section class="card">
      <h2>${t(lang, "importExport")}</h2>
      <div class="inline-row">
        <button class="btn-primary" data-action="export-json">${t(lang, "exportJson")}</button>
        <label class="btn-secondary" for="import-file" role="button" tabindex="0">${t(lang, "chooseImportFile")}</label>
        <input id="import-file" type="file" accept="application/json" style="display:none" />
        <button class="btn-secondary" data-action="import-json">${t(lang, "importSelectedJson")}</button>
      </div>
      <p class="muted">${t(lang, "importReplacesDataset")}</p>
    </section>

    <section class="card">
      <h2>${t(lang, "githubSync")}</h2>
      <p class="muted">${t(lang, "saveCurrentToGithub")} ${t(lang, "autoSync")}: <strong>${autoSyncOn ? t(lang, "on") : t(lang, "off")}</strong>. ${t(lang, "syncLock")}: <strong>${syncKeySet ? t(lang, "unlocked") : t(lang, "locked")}</strong>.</p>
      <p class="muted">${t(lang, "syncKeyMemory")}</p>
      ${!syncKeySet ? `<p class="muted"><strong>${t(lang, "firstTimeSetup")}</strong> ${t(lang, "firstTimeSetupText")}</p>` : ""}
      <div class="inline-row">
        <input id="github-sync-url" type="text" placeholder="https://your-worker.workers.dev" value="${escapeHtml(syncUrl)}" />
        <input id="github-sync-key" type="password" placeholder="SYNC_KEY" value="" />
        <button class="btn-secondary" data-action="save-sync-url">${t(lang, "saveUrl")}</button>
        <button class="btn-secondary" data-action="save-sync-key">${t(lang, "saveKey")}</button>
        ${!syncKeySet ? `<button class="btn-secondary" data-action="prompt-sync-key">${t(lang, "unlockSync")}</button>` : ""}
        <button class="btn-primary" data-action="sync-github">${t(lang, "syncToGithub")}</button>
      </div>
    </section>

    <section class="card">
      <h2>${t(lang, "parentPin")}</h2>
      <p class="muted">${t(lang, "pinCurrent")}: <strong>${hasPin ? t(lang, "pinEnabled") : t(lang, "pinDisabled")}</strong>. ${t(lang, "pinGuards")}</p>
      <div class="inline-row">
        <input id="parent-pin-input" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" />
        <button class="btn-secondary" data-action="set-pin">${t(lang, "savePin")}</button>
        <button class="btn-secondary" data-action="clear-pin">${t(lang, "clearPin")}</button>
      </div>
    </section>

    <section class="card">
      <h2>${t(lang, "dangerZone")}</h2>
      <button class="btn-danger" data-action="reset-state">${t(lang, "resetFactory")}</button>
    </section>
  `;
}
