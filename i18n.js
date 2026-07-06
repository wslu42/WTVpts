export const DEFAULT_LANGUAGE = "en";
export const ZH_TW_LANGUAGE = "zh-Hant-TW";

const dictionaries = {
  en: {
    addBloodPressure: "Add Blood Pressure",
    addNewEarningEvent: "Add New Earning Event",
    addNewRedeemEvent: "Add New Redeem Event",
    addWeight: "Add Weight",
    appTitle: "Family Points & Rewards",
    allCategories: "All categories",
    allEnabledEarningEvents: "All enabled earning events for this user.",
    allEnabledRedeemEvents: "All enabled redeem events for this user.",
    allTime: "All time",
    allTypes: "All types",
    allUnlockMilestonesReached: "All unlock milestones reached",
    autoSync: "Auto sync",
    backupRestoreSafety: "Backup, restore, and safety controls.",
    balance: "Balance",
    bloodPressure: "Blood Pressure",
    bloodPressureDeleted: "Blood pressure record deleted.",
    bloodPressureOnlyGrandpa: "Grandpa-only blood pressure, pulse, medicine, and symptom tracking.",
    bloodPressureRangeError: "Blood pressure or pulse values are outside the supported range.",
    bloodPressureTrackingOnlyGrandpa: "Blood pressure tracking is only enabled for Grandpa.",
    breathless: "breathless",
    category: "Category",
    chooseImportFile: "Choose Import File",
    chooseUserCard: "Choose a user card, then work in that user's Dashboard / Health / History / Manage Events pages.",
    clearPin: "Clear PIN",
    contextUnknown: "context unknown",
    cost: "Cost",
    dashboard: "Dashboard",
    dashboardHome: "Dashboard - Home",
    dangerZone: "Danger Zone",
    delete: "delete",
    deleteBloodPressureConfirm: "Delete this blood pressure record?",
    deleteEventConfirm: "Delete this event?",
    deleteRewardConfirm: "Delete this reward?",
    deleteWeightConfirm: "Delete this weight record?",
    descriptionOptional: "Description (optional)",
    diastolic: "diastolic",
    dizzy: "dizzy",
    earn: "Earn",
    earnedPoint: "Earned +{points}: {title}",
    earnedTotal: "Earned total",
    earning: "Earning",
    earningEventSaved: "Event saved.",
    earningEventsConfiguredEmpty: "No earning events configured.",
    earningPointsSaved: "Saved {count} earning event{plural}.",
    energyBetter: "energy better",
    energyUnchanged: "energy unchanged",
    energyWorse: "energy worse",
    enterNonZeroNumber: "Enter a non-zero number.",
    enterParentPin: "Enter Parent PIN to continue ({action}):",
    eventAdded: "Event added.",
    eventDeleted: "Event deleted.",
    eventNotFound: "Event not found.",
    exportJson: "Export JSON",
    exportedData: "Exported data.json",
    firstTimeSetup: "First-time setup:",
    firstTimeSetupText: "sync stays locked until you enter SYNC_KEY.",
    githubSync: "GitHub Sync",
    health: "Health",
    history: "History",
    importExport: "Import / Export",
    importCompleted: "Import completed.",
    importFailed: "Import failed.",
    importReplacesDataset: "Import replaces the full current dataset.",
    importReplaceConfirm: "Import will replace all current data. Continue?",
    importSelectedJson: "Import Selected JSON",
    invalidFileFormat: "Invalid file format.",
    invalidPin: "Invalid PIN.",
    item: "Item",
    kgLatest: "{kg} kg latest",
    language: "Language",
    languageEnglish: "English",
    languageTaiwan: "繁體中文（台灣）",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    latestBp: "{systolic}/{diastolic} latest",
    loadedLatestGithub: "Loaded latest data from GitHub.",
    locked: "Locked",
    manageEvents: "Manage Events",
    manageEventsForUser: "Manage Earning and Redeem events for {name}.",
    mealUnknown: "meal unknown",
    medicineNote: "medicine note",
    medicineTaken: "medicine taken",
    beforeMeal: "before meal",
    afterMeal: "after meal",
    chestTightness: "chest tightness",
    needPoints: "Need points",
    noBloodPressureRecords: "No blood pressure records yet.",
    noLedgerMatches: "No ledger entries match current filters.",
    noMedicine: "no medicine",
    noRecords: "No records",
    noRewardsEnabled: "No rewards enabled.",
    noWeightRecords: "No weight records yet.",
    none: "none",
    off: "Off",
    on: "On",
    note: "Note",
    noteOptional: "note optional",
    parentPin: "Parent PIN",
    pinCleared: "PIN cleared.",
    pinCurrent: "PIN currently",
    pinEnabled: "Enabled",
    pinDisabled: "Disabled",
    pinGuards: "PIN guards Import and Reset.",
    pinSaved: "PIN saved.",
    pinFourDigits: "PIN must be exactly 4 digits.",
    point: "point",
    points: "points",
    pointsAdded: "+{points} points added",
    pointsApplied: "{points} points applied",
    pulse: "Pulse",
    postExercise: "post exercise",
    pullFailed: "Pull request failed. Check Worker URL/CORS/network.",
    redeem: "Redeem",
    redeemedPoint: "Redeemed -{cost}: {title}",
    redeemEventsConfiguredEmpty: "No redeem events configured.",
    redeemEventsSaved: "Saved {count} redeem event{plural}.",
    resetComplete: "State reset complete.",
    resetConfirm: "Reset all data to factory defaults?",
    resetFactory: "Reset To Factory Defaults",
    resting: "resting",
    rewardDeleted: "Reward deleted.",
    rewardNotFound: "Reward not found.",
    rewardSaved: "Reward saved.",
    rewardAdded: "Reward added.",
    saveAllEarningEvents: "Save All Earning Events",
    saveAllRedeemEvents: "Save All Redeem Events",
    saveCurrentToGithub: "Save current data to your GitHub repo through Cloudflare Worker.",
    saveKey: "Save Key",
    savePin: "Save PIN",
    saveUrl: "Save URL",
    selectJsonFirst: "Select a JSON file first.",
    settings: "Settings",
    showingFirstPoints: "Showing first 200 of {count} points.",
    soundOff: "Sound Off",
    soundOn: "Sound On",
    syncFailed: "Sync failed",
    syncKeyEmpty: "SYNC_KEY is empty. Sync remains locked.",
    syncKeyMissing: "SYNC_KEY is still missing.",
    syncKeyRequiredAlert: "SYNC_KEY is required before continuing.",
    syncKeyRequiredPrompt: "SYNC_KEY is required on this device. Please enter SYNC_KEY to continue:",
    syncKeySaved: "Sync key saved on this device.",
    syncKeyMemory: "SYNC_KEY is kept in memory only and is cleared on page reload.",
    syncLock: "Sync lock",
    syncLockedSettings: "Sync is locked. Enter SYNC_KEY in Settings.",
    syncRequestFailed: "Sync request failed. Check Worker URL/CORS/network.",
    syncToGithub: "Sync to GitHub",
    syncedToGithub: "Synced to GitHub{commit}",
    systolic: "systolic",
    time: "Time",
    title: "Title",
    todayEarned: "Today earned",
    todayRedeemed: "Today redeemed",
    trackWeightKg: "Track {name}'s weight in kg.",
    type: "Type",
    unableStartAudio: "Unable to start audio on this browser.",
    unlockAt: "Unlock @",
    unlockSync: "Unlock Sync",
    unlocked: "Unlocked",
    urlCleared: "Sync URL cleared.",
    urlSaved: "Sync URL saved.",
    urlMustStartHttp: "Sync URL must start with http:// or https://",
    userNotFound: "User not found.",
    visionChange: "vision change",
    weight: "Weight",
    weightDeleted: "Weight record deleted.",
    weightRangeError: "Weight must be between 1 and 500 kg.",
    weightTrend: "Weight trend"
  },
  "zh-Hant-TW": {
    addBloodPressure: "新增血壓紀錄",
    addNewEarningEvent: "新增得分項目",
    addNewRedeemEvent: "新增兌換項目",
    addWeight: "新增體重",
    appTitle: "家庭點數與獎勵",
    allCategories: "所有分類",
    allEnabledEarningEvents: "這位使用者所有已啟用的得分項目。",
    allEnabledRedeemEvents: "這位使用者所有已啟用的兌換項目。",
    allTime: "全部時間",
    allTypes: "所有類型",
    allUnlockMilestonesReached: "已達成所有解鎖里程碑",
    autoSync: "自動同步",
    backupRestoreSafety: "備份、還原與安全控制。",
    balance: "可用點數",
    bloodPressure: "血壓",
    bloodPressureDeleted: "血壓紀錄已刪除。",
    bloodPressureOnlyGrandpa: "爺爺專用的血壓、脈搏、用藥與症狀紀錄。",
    bloodPressureRangeError: "血壓或脈搏數值超出支援範圍。",
    bloodPressureTrackingOnlyGrandpa: "血壓追蹤目前只開放給爺爺使用。",
    breathless: "會喘",
    category: "分類",
    chooseImportFile: "選擇匯入檔案",
    chooseUserCard: "選擇一位使用者，進入該使用者的儀表板 / 健康 / 歷史 / 管理項目頁面。",
    clearPin: "清除 PIN",
    contextUnknown: "量測狀態不確定",
    cost: "花費",
    dashboard: "儀表板",
    dashboardHome: "家庭儀表板",
    dangerZone: "危險區",
    delete: "刪除",
    deleteBloodPressureConfirm: "要刪除這筆血壓紀錄嗎？",
    deleteEventConfirm: "要刪除這個得分項目嗎？",
    deleteRewardConfirm: "要刪除這個兌換項目嗎？",
    deleteWeightConfirm: "要刪除這筆體重紀錄嗎？",
    descriptionOptional: "說明（選填）",
    diastolic: "舒張壓",
    dizzy: "頭暈",
    earn: "得分",
    earnedPoint: "已得到 +{points}：{title}",
    earnedTotal: "累積得分",
    earning: "得分",
    earningEventSaved: "得分項目已儲存。",
    earningEventsConfiguredEmpty: "尚未設定得分項目。",
    earningPointsSaved: "已儲存 {count} 個得分項目。",
    energyBetter: "體力變好",
    energyUnchanged: "體力差不多",
    energyWorse: "體力變差",
    enterNonZeroNumber: "請輸入非零數字。",
    enterParentPin: "請輸入家長 PIN 以繼續（{action}）：",
    eventAdded: "得分項目已新增。",
    eventDeleted: "得分項目已刪除。",
    eventNotFound: "找不到項目。",
    exportJson: "匯出 JSON",
    exportedData: "已匯出 data.json",
    firstTimeSetup: "首次設定：",
    firstTimeSetupText: "必須輸入 SYNC_KEY 才能解除同步鎖定。",
    githubSync: "GitHub 同步",
    health: "健康",
    history: "歷史",
    importExport: "匯入 / 匯出",
    importCompleted: "匯入完成。",
    importFailed: "匯入失敗。",
    importReplacesDataset: "匯入會取代目前完整資料集。",
    importReplaceConfirm: "匯入會取代目前所有資料。要繼續嗎？",
    importSelectedJson: "匯入所選 JSON",
    invalidFileFormat: "檔案格式無效。",
    invalidPin: "PIN 無效。",
    item: "項目",
    kgLatest: "最新 {kg} kg",
    language: "語言",
    languageEnglish: "English",
    languageTaiwan: "繁體中文（台灣）",
    last7Days: "最近 7 天",
    last30Days: "最近 30 天",
    latestBp: "最新 {systolic}/{diastolic}",
    loadedLatestGithub: "已從 GitHub 載入最新資料。",
    locked: "已鎖定",
    manageEvents: "管理項目",
    manageEventsForUser: "管理 {name} 的得分與兌換項目。",
    mealUnknown: "用餐狀態不確定",
    medicineNote: "用藥備註",
    medicineTaken: "已服藥",
    beforeMeal: "飯前",
    afterMeal: "飯後",
    chestTightness: "胸悶",
    needPoints: "點數不足",
    noBloodPressureRecords: "尚無血壓紀錄。",
    noLedgerMatches: "沒有符合目前篩選條件的紀錄。",
    noMedicine: "未服藥",
    noRecords: "尚無紀錄",
    noRewardsEnabled: "尚無已啟用的兌換項目。",
    noWeightRecords: "尚無體重紀錄。",
    none: "無",
    off: "關閉",
    on: "開啟",
    note: "備註",
    noteOptional: "備註（選填）",
    parentPin: "家長 PIN",
    pinCleared: "PIN 已清除。",
    pinCurrent: "目前 PIN",
    pinEnabled: "已啟用",
    pinDisabled: "未啟用",
    pinGuards: "PIN 會保護匯入與重設功能。",
    pinSaved: "PIN 已儲存。",
    pinFourDigits: "PIN 必須是 4 位數字。",
    point: "點",
    points: "點",
    pointsAdded: "已新增 +{points} 點",
    pointsApplied: "已套用 {points} 點",
    pulse: "脈搏",
    postExercise: "運動後量測",
    pullFailed: "拉取資料失敗。請檢查 Worker URL、CORS 或網路連線。",
    redeem: "兌換",
    redeemedPoint: "已兌換 -{cost}：{title}",
    redeemEventsConfiguredEmpty: "尚未設定兌換項目。",
    redeemEventsSaved: "已儲存 {count} 個兌換項目。",
    resetComplete: "狀態已重設完成。",
    resetConfirm: "要將所有資料重設為預設值嗎？",
    resetFactory: "重設為預設值",
    resting: "休息後量測",
    rewardDeleted: "兌換項目已刪除。",
    rewardNotFound: "找不到兌換項目。",
    rewardSaved: "兌換項目已儲存。",
    rewardAdded: "兌換項目已新增。",
    saveAllEarningEvents: "儲存所有得分項目",
    saveAllRedeemEvents: "儲存所有兌換項目",
    saveCurrentToGithub: "透過 Cloudflare Worker 將目前資料儲存到你的 GitHub repo。",
    saveKey: "儲存金鑰",
    savePin: "儲存 PIN",
    saveUrl: "儲存 URL",
    selectJsonFirst: "請先選擇 JSON 檔案。",
    settings: "設定",
    showingFirstPoints: "顯示前 200 點，共 {count} 點。",
    soundOff: "音效關閉",
    soundOn: "音效開啟",
    syncFailed: "同步失敗",
    syncKeyEmpty: "SYNC_KEY 為空，同步仍保持鎖定。",
    syncKeyMissing: "仍缺少 SYNC_KEY。",
    syncKeyRequiredAlert: "必須輸入 SYNC_KEY 才能繼續。",
    syncKeyRequiredPrompt: "此裝置需要 SYNC_KEY。請輸入 SYNC_KEY 以繼續：",
    syncKeySaved: "同步金鑰已儲存在此裝置。",
    syncKeyMemory: "SYNC_KEY 只會保存在記憶體中，重新載入頁面後會清除。",
    syncLock: "同步鎖定",
    syncLockedSettings: "同步已鎖定。請在設定中輸入 SYNC_KEY。",
    syncRequestFailed: "同步請求失敗。請檢查 Worker URL、CORS 或網路連線。",
    syncToGithub: "同步到 GitHub",
    syncedToGithub: "已同步到 GitHub{commit}",
    systolic: "收縮壓",
    time: "時間",
    title: "標題",
    todayEarned: "今日得分",
    todayRedeemed: "今日兌換",
    trackWeightKg: "追蹤 {name} 的體重（kg）。",
    type: "類型",
    unableStartAudio: "此瀏覽器無法啟動音效。",
    unlockAt: "解鎖門檻",
    unlockSync: "解除同步鎖定",
    unlocked: "已解除",
    urlCleared: "同步 URL 已清除。",
    urlSaved: "同步 URL 已儲存。",
    urlMustStartHttp: "同步 URL 必須以 http:// 或 https:// 開頭",
    userNotFound: "找不到使用者。",
    visionChange: "視力變化",
    weight: "體重",
    weightDeleted: "體重紀錄已刪除。",
    weightRangeError: "體重必須介於 1 到 500 kg。",
    weightTrend: "體重趨勢"
  }
};

const messageKeyByEnglish = new Map(
  Object.entries({
    "Blood pressure or pulse values are outside the supported range.": "bloodPressureRangeError",
    "Blood pressure tracking is only enabled for Grandpa.": "bloodPressureTrackingOnlyGrandpa",
    "Event not found.": "eventNotFound",
    "Event points must be a positive integer.": "eventPointsPositive",
    "Event title is required.": "eventTitleRequired",
    "Invalid file format.": "invalidFileFormat",
    "Not enough balance points.": "needPoints",
    "PIN must be exactly 4 digits.": "pinFourDigits",
    "Points must be a non-zero integer.": "enterNonZeroNumber",
    "Points must be a non-zero number.": "enterNonZeroNumber",
    "Points must be a positive number.": "eventPointsPositive",
    "Reward cost must be a positive integer.": "rewardCostPositive",
    "Reward is still locked.": "locked",
    "Reward not found.": "rewardNotFound",
    "Reward title is required.": "rewardTitleRequired",
    "Unlock threshold must be 0 or higher.": "unlockThreshold",
    "User not found.": "userNotFound",
    "Weight must be between 1 and 500 kg.": "weightRangeError"
  })
);

dictionaries.en.eventPointsPositive = "Points must be a positive integer.";
dictionaries.en.eventTitleRequired = "Event title is required.";
dictionaries.en.rewardCostPositive = "Reward cost must be a positive integer.";
dictionaries.en.rewardTitleRequired = "Reward title is required.";
dictionaries.en.unlockThreshold = "Unlock threshold must be 0 or higher.";
dictionaries.en.addCalendarEvent = "Add Calendar Event";
dictionaries.en.calendarEventDeleted = "Calendar event deleted.";
dictionaries.en.calendarEventSaved = "Calendar event saved.";
dictionaries.en.deleteCalendarEventConfirm = "Delete this calendar event?";
dictionaries.en.everyone = "Everyone";
dictionaries.en.family = "Family";
dictionaries.en.familyCalendar = "Family Calendar";
dictionaries.en.familyCalendarDescription = "Review today's schedule and the week ahead.";
dictionaries.en.familyDashboard = "Family Dashboard";
dictionaries.en.familyDashboardDescription = "Points, rewards, history, and health records.";
dictionaries.en.familyPortal = "Family Portal";
dictionaries.en.familyPortalDescription = "A shared home base for the family on iPad and phone.";
dictionaries.en.favoriteLinks = "Favorite Links";
dictionaries.en.favoriteLinksDescription = "Quick access to common family sites and references.";
dictionaries.en.gameGuides = "Game guides";
dictionaries.en.guideCenter = "Guide Center";
dictionaries.en.guideCenterDescription = "Game guides and notes collected in one place.";
dictionaries.en.noCalendarEvents = "No calendar events yet.";
dictionaries.en.noFavoriteLinks = "No favorite links yet.";
dictionaries.en.overview = "Overview";
dictionaries.en.pointsRewards = "Points & rewards";
dictionaries.en.quickAccess = "Quick access";
dictionaries.en.settingsDescription = "Language, sync, backup, and safety controls.";
dictionaries.en.thisWeek = "This week";
dictionaries.en.todayTaskCount = "{count} open today";
dictionaries.en.todayTasks = "Today Tasks";
dictionaries.en.todayTasksDescription = "Only today's calendar events, ready for quick check-off.";
dictionaries["zh-Hant-TW"].addCalendarEvent = "新增行事曆事件";
dictionaries["zh-Hant-TW"].calendarEventDeleted = "行事曆事件已刪除。";
dictionaries["zh-Hant-TW"].calendarEventSaved = "行事曆事件已儲存。";
dictionaries["zh-Hant-TW"].deleteCalendarEventConfirm = "確定要刪除這個行事曆事件嗎？";
dictionaries["zh-Hant-TW"].everyone = "所有人";
dictionaries["zh-Hant-TW"].family = "家庭";
dictionaries["zh-Hant-TW"].familyCalendar = "家庭行事曆";
dictionaries["zh-Hant-TW"].familyCalendarDescription = "查看今天與本週的家庭安排。";
dictionaries["zh-Hant-TW"].familyDashboard = "家庭儀表板";
dictionaries["zh-Hant-TW"].familyDashboardDescription = "點數、獎勵、紀錄與健康資料。";
dictionaries["zh-Hant-TW"].familyPortal = "家庭入口站";
dictionaries["zh-Hant-TW"].familyPortalDescription = "給家人在 iPad 與手機上共用的家庭首頁。";
dictionaries["zh-Hant-TW"].favoriteLinks = "常用網站";
dictionaries["zh-Hant-TW"].favoriteLinksDescription = "快速開啟家裡常用的網站與參考資料。";
dictionaries["zh-Hant-TW"].gameGuides = "遊戲攻略";
dictionaries["zh-Hant-TW"].guideCenter = "攻略中心";
dictionaries["zh-Hant-TW"].guideCenterDescription = "集中整理遊戲攻略與筆記。";
dictionaries["zh-Hant-TW"].noCalendarEvents = "目前沒有行事曆事件。";
dictionaries["zh-Hant-TW"].noFavoriteLinks = "目前沒有常用網站。";
dictionaries["zh-Hant-TW"].overview = "總覽";
dictionaries["zh-Hant-TW"].pointsRewards = "點數與獎勵";
dictionaries["zh-Hant-TW"].quickAccess = "快速入口";
dictionaries["zh-Hant-TW"].settingsDescription = "語言、同步、備份與安全設定。";
dictionaries["zh-Hant-TW"].thisWeek = "本週";
dictionaries["zh-Hant-TW"].todayTaskCount = "今天尚有 {count} 件";
dictionaries["zh-Hant-TW"].todayTasks = "今日事項";
dictionaries["zh-Hant-TW"].todayTasksDescription = "只顯示今天的行事曆事件，方便快速勾選完成。";
dictionaries["zh-Hant-TW"].eventPointsPositive = "點數必須是正整數。";
dictionaries["zh-Hant-TW"].eventTitleRequired = "請輸入得分項目標題。";
dictionaries["zh-Hant-TW"].rewardCostPositive = "兌換花費必須是正整數。";
dictionaries["zh-Hant-TW"].rewardTitleRequired = "請輸入兌換項目標題。";
dictionaries["zh-Hant-TW"].unlockThreshold = "解鎖門檻必須為 0 或更高。";

export function normalizeLanguage(value) {
  return value === ZH_TW_LANGUAGE ? ZH_TW_LANGUAGE : DEFAULT_LANGUAGE;
}

export function getLanguage(state) {
  return normalizeLanguage(state?.settings?.language);
}

export function t(language, key, values = {}) {
  const normalized = normalizeLanguage(language);
  const template = dictionaries[normalized]?.[key] ?? dictionaries.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
}

export function translateMessage(language, message) {
  const key = messageKeyByEnglish.get(String(message || ""));
  return key ? t(language, key) : String(message || "");
}

export function formatDateForLanguage(language, ts) {
  return new Date(ts).toLocaleString(normalizeLanguage(language) === ZH_TW_LANGUAGE ? "zh-TW" : undefined);
}

export function formatShortDateForLanguage(language, ts) {
  return new Date(ts).toLocaleDateString(normalizeLanguage(language) === ZH_TW_LANGUAGE ? "zh-TW" : undefined, {
    month: "short",
    day: "numeric"
  });
}

const userNamesZhTw = {
  mom: "媽媽",
  dad: "爸爸",
  will: "Willow",
  grandpa: "爺爺",
  grandma: "奶奶",
  niece: "姪女"
};

const categoryZhTw = {
  Chores: "家事",
  Family: "家庭",
  Food: "飲食",
  Game: "遊戲",
  Learning: "學習",
  "Me-time": "個人時間",
  Other: "其他"
};

export function displayUserName(language, user) {
  if (normalizeLanguage(language) !== ZH_TW_LANGUAGE) return user?.name || "";
  return userNamesZhTw[user?.id] || user?.name || "";
}

export function displayCategory(language, category) {
  if (normalizeLanguage(language) !== ZH_TW_LANGUAGE) return category;
  return categoryZhTw[category] || category;
}

export function displayLocalizedField(language, item, field) {
  const base = String(item?.[field] || "");
  if (normalizeLanguage(language) !== ZH_TW_LANGUAGE) return base;
  return String(item?.[`${field}_zh`] || base);
}
