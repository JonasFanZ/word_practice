import pastExamQuestions from "./pastExams.json";

const SHEET_ID = "11bpbbLazdRwvB0uRqoGDHt_qwWCnFREYctZVLSLEU0w";

// 拼字題：從 Google Sheet 抓取
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

const mockSpellingData = [
  { word: "apple", pos: "n.", meaning: "蘋果" },
  { word: "banana", pos: "n.", meaning: "香蕉" },
  { word: "orange", pos: "n.", meaning: "橘子" },
  { word: "grape", pos: "n.", meaning: "葡萄" },
  { word: "mango", pos: "n.", meaning: "芒果" },
  { word: "peach", pos: "n.", meaning: "桃子" }
];

export async function fetchSheet(level) {
  if (SHEET_ID === "PUT_YOUR_GOOGLE_SHEET_ID_HERE") return mockSpellingData;
  try { return await fetchFromGoogle(level); }
  catch(e){ console.warn("Google Sheet error, using mock", e); return mockSpellingData; }
}

// 獲取字彙題資料 (來源可能是 'past' 或 'ai')
export async function fetchMCQ(sourceType, aiQuestions = []) {
  if (sourceType === 'ai') {
    return aiQuestions; // 直接回傳 AI 生成的題目
  }
  
  // 回傳歷屆試題 (從 JSON 檔案載入)
  return new Promise((resolve) => {
    // 模擬一點載入時間，讓體驗更自然
    setTimeout(() => {
        resolve(pastExamQuestions);
    }, 300);
  });
}