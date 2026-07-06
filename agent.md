# WTVpts Agent Notes

這份文件記錄目前和使用者討論後形成的產品方向、程式架構慣例、資料模型、測試方式與後續 plan。未來 agent 接手時，請先讀這份文件，再動手改程式。

## 產品定位

WTVpts 原本是家庭點數與獎勵系統，現在逐步擴充成「家庭入口站」。

主要使用情境：

- iPad / 手機上快速使用
- 家人共用的首頁
- 管理家庭點數、行事曆、常用網站與遊戲攻略
- GitHub Pages 靜態部署
- vanilla HTML / CSS / JS，hash routing，無 build step

## 目前資訊架構

```text
總覽
- 今日事項
- 家庭行事曆
- 家庭儀表板
- 常用網站
- 攻略中心
- 設定
```

目前 routes：

```text
#/overview          總覽，預設首頁
#/calendar/today    今日事項
#/calendar/week     家庭行事曆，本週視圖
#/home              家庭儀表板，原本點數系統
#/links             常用網站
#/guides            攻略中心
#/settings          設定
#/user/<id>         使用者儀表板
#/user/<id>/health
#/user/<id>/history
#/user/<id>/manage-events
```

## 重要設計決策

### 今日事項屬於家庭行事曆

「今日事項」不是獨立資料模型，而是 `calendar_events` 的今日 filter。

也就是：

```text
今日事項 = calendar_events where date === today
```

這樣完成狀態、刪除、新增都會跟家庭行事曆同步。

### 常用網站與攻略中心資料分離

不要讓「常用網站」共用「攻略中心」資料。

目前資料欄位：

```js
favorite_links // 常用網站
guide_links    // 攻略中心
```

預設資料來源：

```js
makeDefaultFavoriteLinks()
makeDefaultGuideLinks()
```

`makeDefaultFavoriteLinks()` 可以留空，讓使用者之後另外編輯常用網站。

`makeDefaultGuideLinks()` 放動森、神魔之塔等遊戲攻略。

### UI 翻譯與資料內容翻譯分開

UI 固定文字放在 `i18n.js`，用：

```js
t(lang, "someKey")
```

資料內容使用雙語欄位，例如：

```js
{
  title: "Animal Crossing fish",
  title_zh: "動森：魚類",
  category: "Game Guides",
  category_zh: "遊戲攻略",
  note: "Animal Crossing: New Horizons",
  note_zh: "集合啦！動物森友會"
}
```

資料內容顯示時請使用：

```js
displayLocalizedField(lang, item, "title")
displayLocalizedField(lang, item, "category")
displayLocalizedField(lang, item, "note")
```

不要在 render function 裡到處手寫：

```js
lang === ZH_TW_LANGUAGE ? item.title_zh : item.title
```

### Emoji 放在 render，不放進 i18n

頁面標題與導覽的 emoji 目前由 `render.js` 的 `portalIcon(key)` 控制。

目前 mapping：

```text
overview  🏠
calendar  📅
home      ⭐
links     🔗
guides    🎮
settings  ⚙️
```

首頁卡片只對已有對應 mapping 的頁面加 emoji。沒有明確對應的卡片先不要加。

## 主要檔案

```text
index.html   app shell
main.js      bootstrapping，預設導到 #/overview
controls.js  hash route parsing、事件處理、state mutation wiring
render.js    view rendering
state.js     state model、migration、localStorage persistence、selectors/mutations
i18n.js      UI 翻譯與資料欄位語言 helper
style.css    responsive UI
README.md    使用與部署說明
```

## State 欄位

重要欄位：

```js
users
events_by_user
rewards_by_user
ledger
health_by_user
calendar_events
favorite_links
guide_links
settings
```

`settings.language` 使用：

```js
"en"
"zh-Hant-TW"
```

localStorage key：

```js
family_points_v2_seed_data_json
```

如果修改預設資料但瀏覽器看不到更新，通常是 localStorage 已有舊資料。測試時可在 DevTools Console 執行：

```js
localStorage.removeItem("family_points_v2_seed_data_json")
location.reload()
```

注意：這會清掉目前本機資料。

## Migration 注意事項

`state.js` 的 `migrate(input)` 會補齊新增欄位。

目前已處理：

- 舊資料補 `calendar_events`
- 舊資料補 `favorite_links`
- 舊資料補 `guide_links`
- 若舊 `favorite_links` 裡混有攻略資料，migration 會把看起來像攻略的連結搬到 `guide_links`

未來新增 state 欄位時，請同步更新：

- `cloneSeedState()`
- `migrate(input)`
- selector / mutation helpers
- README Data Notes

## 開發與測試

本機執行：

```powershell
python -m http.server 8000
```

打開：

```text
http://localhost:8000
```

常用測試 routes：

```text
http://localhost:8000/#/overview
http://localhost:8000/#/calendar/today
http://localhost:8000/#/calendar/week
http://localhost:8000/#/home
http://localhost:8000/#/links
http://localhost:8000/#/guides
http://localhost:8000/#/settings
```

基本檢查：

```powershell
node --check state.js
node --check render.js
node --check controls.js
node --check i18n.js
node --check main.js
git diff --check
```

PowerShell 顯示中文或 emoji 可能會亂碼，但瀏覽器與 git diff 內容不一定有問題。測試中文或 emoji literal 時，Node smoke test 可以用 Unicode escape，避免終端編碼干擾。

## Commit / Push 慣例

使用者有時會要求直接 push。流程：

```powershell
git status --short --branch
node --check state.js; node --check render.js; node --check controls.js; node --check i18n.js; node --check main.js
git diff --check
git add <files>
git commit -m "<message>"
git push origin main
git status --short --branch
```

不要把使用者正在編輯但與本次任務無關的變更一起 commit。

## 已完成的 v1 工作

- 新增 `#/overview` 作為預設首頁
- 新增家庭入口站導覽
- 新增 `#/calendar/today`
- 新增 `#/calendar/week`
- 新增 `calendar_events`
- 新增 `#/links`
- 新增 `#/guides`
- 拆分 `favorite_links` 與 `guide_links`
- 新增資料內容雙語欄位顯示 helper
- 新增頁面標題與導覽 emoji
- 新增首頁卡片 emoji
- 設定頁從家庭儀表板容器中獨立出上層頁面

## 建議後續 Plan

### Phase 1: 常用網站可編輯

目標：讓使用者不用改 `state.js` 就能新增/刪除常用網站。

建議：

- 在 `#/links` 加新增表單
- 欄位：title、title_zh、url、category、category_zh、note、note_zh
- 新增 `upsertFavoriteLink()`、`deleteFavoriteLink()`
- 保留 localStorage persistence 與 sync

### Phase 2: 攻略中心可編輯

目標：讓攻略中心也能從 UI 管理。

建議：

- 在 `#/guides` 加管理模式
- 使用 `guide_links`
- 卡片預設仍只顯示標題
- 可選擇之後新增「攻略分類頁」或「筆記欄位」

### Phase 3: 家庭行事曆強化

可做：

- 事件編輯
- 重複事件
- 分類顏色
- assigned_to 多人選擇
- 月視圖 `#/calendar/month`

### Phase 4: 首頁摘要

可做：

- 今日待辦數
- 本週事件數
- 最新健康紀錄摘要
- 每位使用者點數摘要

## Coding Notes

- 繼續維持 vanilla JS，不引入 build step。
- 路由走 hash route，維持 GitHub Pages compatibility。
- 編輯檔案時避免大規模 refactor。
- 新資料欄位要先保證 migration 不會破壞舊 localStorage。
- 若預設資料內有中文，請同時提供英文欄位，避免英文頁面直接顯示中文。
