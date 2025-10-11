import { useEffect, useMemo, useRef, useState } from "react";
import { useQuiz } from "../context/QuizContext";
import { maskWord } from "../utils/maskWord";
import Header from "../components/Header";
import Timer from "../components/Timer";
import Counter from "../components/Counter";
import WordCard from "../components/WordCard";

export default function Quiz({ onFinish, onBack }) {
  const { state, dispatch } = useQuiz();
  const { roundSet, currentIndex, wrongList, mode } = state;
  const [answer, setAnswer] = useState("");
  const [timer, setTimer] = useState(30);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const inputRef = useRef(null);

  const current = roundSet[currentIndex];

  // 聚焦輸入框
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  // 倒數計時
  useEffect(() => {
    if (!current) return;
    if (timer <= 0) {
      // 時間到視為錯題
      dispatch({ type: "ADD_WRONG", payload: current });
      setIsWrong(true);
      setTimeout(() => {
        setIsWrong(false);
        gotoNext();
      }, 250);
      return;
    }
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, current]);

  const masked = useMemo(() => (current ? maskWord(current.word) : ""), [current]);

  function gotoNext() {
    if (currentIndex + 1 >= 10) {
      // 10 題結束，決定是否進入錯題模式
      if (wrongList.length > 0 && mode !== "review") {
        // 進入錯題循環
        dispatch({ type: "SET_MODE", payload: "review" });
        dispatch({ type: "SET_ROUNDSET", payload: wrongList });
        dispatch({ type: "CLEAR_WRONGS" });
        resetLocal();
      } else if (mode === "review" && wrongList.length > 0) {
        // review 模式下，錯題未清空 -> 再次出題
        dispatch({ type: "SET_ROUNDSET", payload: wrongList });
        dispatch({ type: "CLEAR_WRONGS" });
        resetLocal();
      } else {
        // 全部完成
        dispatch({ type: "FINISH" });
        onFinish();
      }
    } else {
      dispatch({ type: "NEXT_QUESTION" });
      resetLocal();
    }
  }

  function resetLocal() {
    setAnswer("");
    setIsCorrect(false);
    setIsWrong(false);
    setTimer(30);
    inputRef.current?.focus();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!current) return;
    if (answer.trim().toLowerCase() === current.word.toLowerCase()) {
      setIsCorrect(true);
      setTimeout(() => gotoNext(), 250);
    } else {
      setIsWrong(true);
      setAnswer("");
      setTimeout(() => setIsWrong(false), 200);
    }
  }

  if (!current) {
    // 若沒有題目（例如資料不足）
    return (
      <div className="relative w-[420px] bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <Header onBack={onBack} />
        <p className="text-gray-600">目前沒有足夠的題目可作答。</p>
      </div>
    );
  }

  const remaining = Math.max(0, 10 - currentIndex);

  return (
    <div className="relative w-[420px] bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-6">
      <Header onBack={onBack} />

      <div className="absolute top-4 right-4 flex items-center gap-4">
        <Timer seconds={timer} />
        <Counter remaining={remaining} />
      </div>

      <WordCard
        masked={masked}
        pos={current.pos}
        meaning={current.meaning}
        isCorrect={isCorrect}
        isWrong={isWrong}
      />

      <form onSubmit={handleSubmit} className="w-full">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full mt-4 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="請輸入完整單字"
          autoComplete="off"
        />
        <button
          type="submit"
          className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          送出
        </button>
      </form>

      {mode === "review" && (
        <p className="text-xs text-amber-600">目前為錯題練習模式，將持續循環直到全對。</p>
      )}
    </div>
  );
}
