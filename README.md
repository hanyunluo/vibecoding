# IINE 手把虛擬游標（iPad Chrome）

本專案提供一個可部署至 GitHub Pages 的測試與引導頁，並以 bookmarklet 將控制程式注入目前開啟的網頁。它不使用 iframe，因此不需要從中介頁讀取 ahaboard.ai 的跨來源 DOM。

## 檔案

- `index.html`：Gamepad API 測試器、書籤複製按鈕、操作步驟。
- `gamepad-mouse.js`：完整註解版控制器。
- `standalone-bookmarklet.txt`：單檔自包含 bookmarklet；執行建置指令後產生。
- `scripts/build-bookmarklet.mjs`：以 Node.js 壓縮註解與空白並生成單檔 bookmarklet。

## 部署

將這些檔案提交到 GitHub repository，並在 **Settings → Pages** 選擇發布分支與根目錄。部署完成後，使用該 Pages HTTPS 網址開啟 `index.html`。中介頁會依當前網址自動產生正確的 `gamepad-mouse.js` 載入網址，支援 `username.github.io/repository/` 專案頁路徑。

若要提供單檔備用書籤，先在專案根目錄執行：

```sh
node scripts/build-bookmarklet.mjs
```

再把產生的 `standalone-bookmarklet.txt` 一起部署。每次修改控制程式後都重新產生該檔。

## 3 步驟使用

1. 在 iPad「設定 → 藍牙」配對 IINE 手把；在 Pages 引導頁按「開始 / 重新偵測」，確認連線與實體按鍵索引。
2. 複製外部載入 bookmarklet，在 Chrome 將引導頁加入書籤，透過「⋯ → 書籤 → 編輯」把書籤網址替換為 `javascript:…` 程式碼。
3. 開啟 `https://ahaboard.ai/`，從 Chrome 書籤執行該工具。左搖桿移動，A 點擊，B/X 右鍵，右搖桿 Y 或十字鍵上下捲動；按 Esc 或再次執行書籤停止。

## 按鍵設定

程式預設 Switch 配列實體按鍵索引：A=1、B=0、X=3。標準 Gamepad mapping 以按鍵位置回報；若測試器顯示不同索引，請修改 `gamepad-mouse.js` 開頭的 `primaryButton` 與 `rightClickButtons`，再重新部署並重建單檔書籤。

## 相容性限制

- iPadOS Chrome 使用 WebKit；Gamepad API 是否能在指定 Chrome/iPadOS 版本看見藍牙手把，必須以引導頁測試器實測。若瀏覽器沒有回報 Gamepad，bookmarklet 無法補出系統層的輸入權限。
- 程式派發的 PointerEvent、MouseEvent 和 click 都是未受信任的合成事件。一般 DOM 事件監聽、部分按鈕與連結可運作，但不能保證拖曳、檔案選取、彈出視窗、需要使用者啟用的 API 或要求可信任事件的應用程式。
- 外部載入書籤受 ahaboard.ai 的 CSP `script-src` 限制。單檔書籤不依賴 GitHub script 載入來源，但仍可能被 CSP 封鎖 JavaScript URL / inline script；嚴格 CSP 沒有可由頁面外部 bookmarklet 保證成功的繞過方式。
- `z-index: 2147483647` 可置於一般頁面內容上層，但瀏覽器 UI、系統選單及 HTML top layer（例如 modal dialog）仍可能覆蓋它。
