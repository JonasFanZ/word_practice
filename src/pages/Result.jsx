import { useMemo } from "react";
import { useQuiz } from "../context/QuizContext";
import { fetchSheet } from "../utils/fetchSheet";

const blessings = [
  "太強了！繼續保持！",
  "節奏很好，再接再厲！",
  "進步看得見，下一輪更穩！",
  "專注力滿分！再來一輪！",
  "你的記憶力開始發光了！",
];

function sample10(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(10, copy.length));
}

export default function Result({ onHome, onContinue }) {
  const { state, dispatch } = useQuiz();
  const text = useMemo(() => blessings[Math.floor(Math.random() * blessings.length)], []);

  async function handleContinue() {
    // 依目前 level 重新抓資料並抽 10 題
    const all = await fetchSheet(state.level ?? 1);
    dispatch({ type: "SET_QUESTIONS", payload: all });
    const round = sample10(all);
    dispatch({ type: "SET_ROUNDSET", payload: round });
    dispatch({ type: "SET_MODE", payload: "normal" });
    dispatch({ type: "CLEAR_WRONGS" });
    dispatch({ type: "RESET_FINISH" });
    onContinue();
  }

  return (
    <div className="w-[420px] bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
      <h2 className="text-2xl font-bold">本輪完成！</h2>
      <p className="text-gray-700">{text}</p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            dispatch({ type: "RESET_ALL" });
            onHome();
          }}
          className="w-full py-3 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
        >
          回初始畫面
        </button>
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          繼續新的十題
        </button>
      </div>
    </div>
  );
}
