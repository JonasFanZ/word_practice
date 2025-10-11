# Word Practice

幫助高中生背單字的練習網站（React + Vite + Tailwind + Framer Motion）。
- 每輪 10 題，倒數 30 秒。
- 答對綠光上跳、答錯紅光提示。
- 十題結束若有錯題，自動進入錯題循環模式，直到全部清空。
- 完成後顯示祝福語，可回首頁或再來一輪。

## 本地執行
```bash
npm install
npm run dev
```

## Google Sheet 連接
1. 在 `src/utils/fetchSheet.js` 將 `SHEET_ID` 改成你的 Sheet ID。
2. 每個分頁命名為 `Level1` ~ `Level6`，欄位為：`word | pos | meaning`。
3. Sheet 需設定為「可公開檢視」。

## 打包部署
```bash
npm run build
```
將 `dist/` 部屬到 Vercel 或 Netlify 即可。
