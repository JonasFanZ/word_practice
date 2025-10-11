import { useQuiz } from "../context/QuizContext";
import LevelSelect from "../components/LevelSelect";
import { fetchSheet } from "../utils/fetchSheet";

function sample10(arr) {
  // 隨機取 10 題（不足則取全部）
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(10, copy.length));
}

export default function Home({ onStart }) {
  const { dispatch } = useQuiz();

  const handleSelect = async (level) => {
    dispatch({ type: "SET_LEVEL", payload: level });
    const all = await fetchSheet(level);
    dispatch({ type: "SET_QUESTIONS", payload: all });
    const round = sample10(all);
    dispatch({ type: "SET_ROUNDSET", payload: round });
    dispatch({ type: "RESET_FINISH" });
    onStart();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold mb-2">📘 單字練習</h1>
      <p className="text-gray-600 mb-2">選擇一個等級開始練習（每輪 10 題，30 秒作答）。</p>
      <LevelSelect onSelect={handleSelect} />
    </div>
  );
}
