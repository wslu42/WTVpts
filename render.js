import {
  getUserById,
  getUserTotals,
  getTodaySummary,
  getRewardUnlockProgress,
  getUserEvents,
  getUserRewards,
  getAllEventCategories,
  getAllRewardCategories,
  listCategories,
  groupByCategory,
  resolveRefTitle,
  sortLedgerNewestFirst
} from "./state.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(ts) {
  return new Date(ts).toLocaleString();
}

function renderPointsGrid(balance) {
  const safe = Math.max(0, Math.floor(balance));
  const capped = Math.min(safe, 200);
  const cells = [];
  for (let i = 0; i < capped; i += 1) {
    cells.push(`<div class="point-cell filled" title="Point ${i + 1}"></div>`);
  }
  const remainder = Math.max(0, 20 - (capped % 20));
  const blanks = capped === 0 ? 20 : Math.min(remainder, 20);
  for (let i = 0; i < blanks; i += 1) {
    cells.push('<div class="point-cell"></div>');
  }
  return `<div class="points-grid">${cells.join("")}</div>${safe > 200 ? `<p class="muted">Showing first 200 of ${safe} points.</p>` : ""}`;
}

function userSummaryCard(state, user) {
  const totals = getUserTotals(state, user.id);
  const today = getTodaySummary(state, user.id);
  return `
    <button class="card card-clickable user-card tone-${escapeHtml(user.id)}" data-action="open-user" data-user-id="${escapeHtml(user.id)}">
      <div class="summary-head">
        <h3 class="user-name">${escapeHtml(user.name)}</h3>
        <div class="summary-keystats">
          <div class="stat-line"><span>Balance</span><strong>${totals.balance}</strong></div>
          <div class="stat-line"><span>Earned total</span><strong>${totals.earned_total}</strong></div>
        </div>
      </div>
      <div class="stat-line stat-line-plain muted"><span>Today earned</span><span>+${today.today_earned}</span></div>
      <div class="stat-line stat-line-plain muted"><span>Today redeemed</span><span>-${today.today_spent}</span></div>
    </button>
  `;
}

export function renderNavActive(route, activeUserId) {
  if (route.top === "settings") {
    document.body.setAttribute("data-user-theme", "system");
  } else if (route.kind === "home") {
    document.body.setAttribute("data-user-theme", "system");
  } else if (route.kind === "user" && route.userId) {
    document.body.setAttribute("data-user-theme", route.userId);
  } else {
    document.body.setAttribute("data-user-theme", activeUserId || "system");
  }
}

function renderUserWorkspaceTabs(userId, section, userName) {
  const tabs = [
    { key: "dashboard", label: "Dashboard", href: `#/user/${userId}` },
    { key: "history", label: "History", href: `#/user/${userId}/history` },
    { key: "manage-events", label: "Manage Events", href: `#/user/${userId}/manage-events` }
  ];
  return `
    <section class="card">
      <h1 class="page-title">${escapeHtml(userName)}</h1>
      <nav class="nav-links" aria-label="User workspace navigation">
        ${tabs.map((t) => `<a href="${t.href}" class="${section === t.key ? "active" : ""}">${t.label}</a>`).join("")}
      </nav>
    </section>
  `;
}

export function renderHome(state, embeddedHtml = "") {
  const cards = state.users.map((user) => userSummaryCard(state, user)).join("");
  return `
    <section class="card">
      <div class="home-header">
        <h1 class="page-title"><a class="home-title-link" href="#/home">Dashboard - Home</a></h1>
        <a class="btn-secondary home-settings-btn" href="#/settings">Settings</a>
      </div>
      <p class="muted">Choose a user card, then work in that user's Dashboard / History / Manage Events pages.</p>
      <div class="grid-2">${cards}</div>
      ${embeddedHtml ? `<div class="section-divider" aria-hidden="true"></div><div class="home-embedded">${embeddedHtml}</div>` : ""}
    </section>
  `;
}

export function renderUserDashboard(state, userId) {
  const user = getUserById(state, userId);
  if (!user) return `<section class="empty">User not found.</section>`;
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
            <div class="quick-card-status quick-card-status-plain">Earn</div>
            <strong>${escapeHtml(event.title)}</strong>
            <div class="muted">+${event.points} point${event.points === 1 ? "" : "s"}</div>
          </button>`
        )
        .join("");
      const spanClass = rows.length >= 4 ? "quick-category-span-2" : "";
      return `
      <section class="category-block quick-category ${spanClass}">
        <h3 class="category-title">${escapeHtml(category)}</h3>
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
            <div class="quick-card-status quick-card-status-plain">${isLocked ? "Locked" : canAfford ? "Redeem" : "Need points"}</div>
            <strong>${escapeHtml(reward.title)}</strong>
            <div class="muted">Cost ${reward.cost} | Unlock @ ${reward.unlock_at_total}</div>
          </button>`;
        })
        .join("");
      const spanClass = rows.length >= 3 ? "quick-category-span-2" : "";
      return `
      <section class="category-block quick-category ${spanClass}">
        <h3 class="category-title">${escapeHtml(category)}</h3>
        <div class="quick-items">${cards}</div>
      </section>`;
    })
    .join("");

  return `
    ${renderUserWorkspaceTabs(user.id, "dashboard", user.name)}
    <section class="card">
      <div class="inline-row">
        <span class="badge">Balance: ${totals.balance}</span>
        <span class="badge">Earned total: ${totals.earned_total}</span>
      </div>
      ${renderPointsGrid(totals.balance)}
      <div class="progress-wrap">
        <div class="muted">${unlock.next_threshold === null ? "All unlock milestones reached" : `Progress to next unlock (${unlock.next_threshold})`}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${unlock.pct.toFixed(0)}%"></div></div>
      </div>
    </section>
    <section class="card">
      <h2>Redeem</h2>
      <p class="muted">All enabled redeem events for this user.</p>
      <div class="quick-categories">${quickRewardHtml || '<p class="muted">No rewards enabled.</p>'}</div>
    </section>
    <section class="card">
      <h2>Earn</h2>
      <p class="muted">All enabled earning events for this user.</p>
      <div class="quick-categories">${quickEarnHtml || '<p class="muted">No earning events enabled.</p>'}</div>
    </section>
  `;
}

function renderCategoryCards(items, type, userId) {
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
                  <span class="badge">${escapeHtml(item.category)}</span>
                  <button class="btn-primary" data-action="achieve-event" data-user-id="${escapeHtml(userId)}" data-event-id="${escapeHtml(item.id)}">Earn</button>
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
                <span class="badge">${escapeHtml(item.category)}</span>
                <button class="btn-primary" data-action="redeem-reward" data-user-id="${escapeHtml(userId)}" data-reward-id="${escapeHtml(item.id)}">Redeem</button>
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
  const user = getUserById(state, userId);
  if (!user) return `<section class="empty">User not found.</section>`;
  const categories = [...new Set([...getAllEventCategories(state), ...getAllRewardCategories(state)])].sort((a, b) => a.localeCompare(b));
  const rows = filterUserLedger(state, userId, filters);
  const tr = rows
    .map((entry) => {
      const pts = entry.type === "earn" ? `+${entry.points}` : `-${entry.points}`;
      const displayType = entry.type === "spend" ? "redeem" : entry.type;
      return `
      <tr>
        <td>${escapeHtml(formatDate(entry.ts))}</td>
        <td>${escapeHtml(displayType)}</td>
        <td>${escapeHtml(resolveRefTitle(state, entry))}</td>
        <td>${escapeHtml(pts)}</td>
        <td>${escapeHtml(entry.note || "")}</td>
      </tr>`;
    })
    .join("");

  return `
    ${renderUserWorkspaceTabs(user.id, "history", user.name)}
    <section class="card">
      <h2>History</h2>
      <div class="filters">
        <select id="history-type-filter">
          <option value="all" ${filters.type === "all" ? "selected" : ""}>All types</option>
          <option value="earn" ${filters.type === "earn" ? "selected" : ""}>Earn</option>
          <option value="spend" ${filters.type === "spend" ? "selected" : ""}>Redeem</option>
        </select>
        <select id="history-range-filter">
          <option value="7" ${filters.range === "7" ? "selected" : ""}>Last 7 days</option>
          <option value="30" ${filters.range === "30" ? "selected" : ""}>Last 30 days</option>
          <option value="all" ${filters.range === "all" ? "selected" : ""}>All time</option>
        </select>
        <select id="history-category-filter">
          <option value="all">All categories</option>
          ${categories.map((c) => `<option value="${escapeHtml(c)}" ${filters.category === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
        </select>
      </div>
    </section>
    <section class="card table-wrap">
      ${rows.length ? `<table><thead><tr><th>Time</th><th>Type</th><th>Item</th><th>Points</th><th>Note</th></tr></thead><tbody>${tr}</tbody></table>` : '<div class="empty">No ledger entries match current filters.</div>'}
    </section>
  `;
}

export function renderManageEvents(state, userId) {
  const user = getUserById(state, userId);
  if (!user) return `<section class="empty">User not found.</section>`;
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
          <input data-field="title" type="text" value="${escapeHtml(item.title)}" placeholder="Title" />
          <input data-field="category" type="text" value="${escapeHtml(item.category)}" placeholder="Category" />
          <input data-field="points" type="number" min="1" step="1" value="${item.points}" placeholder="Points" />
          <label><input data-field="enabled" type="checkbox" ${item.enabled ? "checked" : ""} /> Enabled</label>
        </div>
        <input data-field="description" type="text" value="${escapeHtml(item.description || "")}" placeholder="Description (optional)" />
        <div class="inline-row">
          <button class="btn-delete-subtle" data-action="delete-event" data-user-id="${escapeHtml(user.id)}" data-item-id="${escapeHtml(item.id)}">delete</button>
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
          <input data-field="title" type="text" value="${escapeHtml(item.title)}" placeholder="Title" />
          <input data-field="category" type="text" value="${escapeHtml(item.category)}" placeholder="Category" />
          <input data-field="cost" type="number" min="1" step="1" value="${item.cost}" placeholder="Cost" />
          <input data-field="unlock_at_total" type="number" min="0" step="1" value="${item.unlock_at_total}" placeholder="Unlock at" />
          <label><input data-field="enabled" type="checkbox" ${item.enabled ? "checked" : ""} /> Enabled</label>
        </div>
        <div class="inline-row">
          <button class="btn-delete-subtle" data-action="delete-reward" data-user-id="${escapeHtml(user.id)}" data-item-id="${escapeHtml(item.id)}">delete</button>
          <span class="muted">id: ${escapeHtml(item.id)}</span>
        </div>
      </article>
    `
    )
    .join("");

  return `
    ${renderUserWorkspaceTabs(user.id, "manage-events", user.name)}
    <section class="card">
      <h2>Manage Events</h2>
      <p class="muted">Manage Earning and Redeem events for ${escapeHtml(user.name)}.</p>
      <section class="card manage-subsection">
        <h3>Redeem</h3>
        <article class="item-card redeem-new-card">
          <div class="inline-row">
            <input id="new-reward-title" type="text" placeholder="Title" />
            <input id="new-reward-category" type="text" placeholder="category" />
            <input id="new-reward-cost" type="number" min="1" step="1" value="1" />
            <input id="new-reward-unlock" type="number" min="0" step="1" value="0" />
            <label><input id="new-reward-enabled" type="checkbox" checked /> Enabled</label>
          </div>
          <button class="btn-primary" data-action="add-reward" data-user-id="${escapeHtml(user.id)}">Add New Redeem Event</button>
        </article>
        <div class="section-divider" aria-hidden="true"></div>
        <div class="manage-list">${rewardRows || '<div class="empty">No redeem events configured.</div>'}</div>
        <button class="btn-primary btn-block" data-action="save-all-rewards" data-user-id="${escapeHtml(user.id)}">Save All Redeem Events</button>
      </section>

      <div class="manage-block-divider" aria-hidden="true"></div>

      <section class="card manage-subsection">
        <h3>Earning</h3>
        <article class="item-card earning-new-card">
          <div class="inline-row">
            <input id="new-event-title" type="text" placeholder="Title" />
            <input id="new-event-category" type="text" placeholder="category" />
            <input id="new-event-points" type="number" min="1" step="1" value="1" />
            <label><input id="new-event-enabled" type="checkbox" checked /> Enabled</label>
          </div>
          <input id="new-event-description" type="text" placeholder="Description (optional)" />
          <button class="btn-primary" data-action="add-event" data-user-id="${escapeHtml(user.id)}">Add New Earning Event</button>
        </article>
        <div class="section-divider" aria-hidden="true"></div>
        <div class="manage-list">${eventRows || '<div class="empty">No earning events configured.</div>'}</div>
        <button class="btn-primary btn-block" data-action="save-all-events" data-user-id="${escapeHtml(user.id)}">Save All Earning Events</button>
      </section>
    </section>
  `;
}

export function renderSettings(state) {
  const hasPin = Boolean(state.settings.parent_pin_hash);

  return `
    <section class="card">
      <h1 class="page-title">Settings</h1>
      <p class="muted">Backup, restore, and safety controls.</p>
    </section>

    <section class="card">
      <h2>Import / Export</h2>
      <div class="inline-row">
        <button class="btn-primary" data-action="export-json">Export JSON</button>
        <label class="btn-secondary" for="import-file" role="button" tabindex="0">Choose Import File</label>
        <input id="import-file" type="file" accept="application/json" style="display:none" />
        <button class="btn-secondary" data-action="import-json">Import Selected JSON</button>
      </div>
      <p class="muted">Import replaces the full current dataset.</p>
    </section>

    <section class="card">
      <h2>Parent PIN</h2>
      <p class="muted">PIN currently: <strong>${hasPin ? "Enabled" : "Disabled"}</strong>. PIN guards Import and Reset.</p>
      <div class="inline-row">
        <input id="parent-pin-input" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" />
        <button class="btn-secondary" data-action="set-pin">Save PIN</button>
        <button class="btn-secondary" data-action="clear-pin">Clear PIN</button>
      </div>
    </section>

    <section class="card">
      <h2>Danger Zone</h2>
      <button class="btn-danger" data-action="reset-state">Reset To Factory Defaults</button>
    </section>
  `;
}
