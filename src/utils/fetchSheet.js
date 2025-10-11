const SHEET_ID = "11bpbbLazdRwvB0uRqoGDHt_qwWCnFREYctZVLSLEU0w";
async function fetchFromGoogle(level) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Level${level}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));
  const rows = json.table.rows.map(r => ({
    word: r.c?.[0]?.v?.toString() ?? "",
    pos: r.c?.[1]?.v?.toString() ?? "",
    meaning: r.c?.[2]?.v?.toString() ?? ""
  })).filter(r => r.word);
  return rows;
}
const mockData = [
  { word: "apple", pos: "n.", meaning: "蘋果" },
  { word: "banana", pos: "n.", meaning: "香蕉" },
  { word: "orange", pos: "n.", meaning: "橘子" },
  { word: "grape", pos: "n.", meaning: "葡萄" },
  { word: "mango", pos: "n.", meaning: "芒果" },
  { word: "peach", pos: "n.", meaning: "桃子" }
];
export async function fetchSheet(level) {
  if (SHEET_ID === "PUT_YOUR_GOOGLE_SHEET_ID_HERE") return mockData;
  try { return await fetchFromGoogle(level); }
  catch(e){ console.warn("Google Sheet 讀取失敗，改用 mock 資料", e); return mockData; }
}
