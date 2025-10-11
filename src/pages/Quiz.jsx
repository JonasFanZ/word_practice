import { useEffect, useMemo, useRef, useState } from "react";
import { useQuiz } from "../context/QuizContext";
import { maskWord } from "../utils/maskWord";
import Header from "../components/Header";
import Timer from "../components/Timer";
import Counter from "../components/Counter";
import WordCard from "../components/WordCard";

function dedupeByWord(list) {
  const map = new Map();
  list.forEach(q => {
    const key = (q.word || "").toLowerCase();
    if (!map.has(key)) map.set(key, q);
  });
  return Array.from(map.values());
}

export default function Quiz({ onFinish, onBack }) {
  const { state, dispatch } = useQuiz();
  const { roundSet, currentIndex, wrongList, mode } = state;
  const [answer, setAnswer] = useState("");
  const [timer, setTimer] = useState(15);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const inputRef = useRef(null);
  const wrongRecordedRef = useRef(false);
  const nextWrongsRef = useRef([]);

  const current = roundSet[currentIndex];
  const total = roundSet.length;
  const remaining = Math.max(0, total - currentIndex);

  useEffect(() => { inputRef.current?.focus(); }, [currentIndex]);

  useEffect(() => {
    if (!current) return;
    if (timer <= 0) {
      if (!wrongRecordedRef.current) {
        if (mode === "normal") dispatch({ type: "ADD_WRONG", payload: current });
        else addToNextWrongs(current);
        wrongRecordedRef.current = true;
      }
      setIsWrong(true);
      setTimeout(() => { setIsWrong(false); gotoNext(); }, 250);
      return;
    }
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, current, mode]);

  const masked = useMemo(() => (current ? maskWord(current.word) : ""), [current]);

  function addToNextWrongs(q) {
    const key = (q.word || "").toLowerCase();
    const exists = nextWrongsRef.current.some(x => (x.word || "").toLowerCase() === key);
    if (!exists) nextWrongsRef.current = [...nextWrongsRef.current, q];
  }

  function gotoNext() {
    const isLast = currentIndex + 1 >= total;
    if (!isLast) {
      dispatch({ type: "NEXT_QUESTION" });
      resetLocal();
      return;
    }
    if (mode === "normal") {
      if (wrongList.length > 0) {
        const unique = dedupeByWord(wrongList);
        dispatch({ type: "SET_MODE", payload: "review" });
        dispatch({ type: "SET_ROUNDSET", payload: unique });
        dispatch({ type: "CLEAR_WRONGS" });
        resetLocal();
      } else {
        dispatch({ type: "FINISH" });
        onFinish();
      }
    } else {
      const next = dedupeByWord(nextWrongsRef.current);
      if (next.length > 0) {
        dispatch({ type: "SET_ROUNDSET", payload: next });
        nextWrongsRef.current = [];
        resetLocal();
      } else {
        dispatch({ type: "FINISH" });
        onFinish();
      }
    }
  }

  function resetLocal() {
    setAnswer("");
    setIsCorrect(false);
    setIsWrong(false);
    setTimer(15);
    wrongRecordedRef.current = false;
    inputRef.current?.focus();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!current) return;
    const correct = answer.trim().toLowerCase() === (current.word || "").toLowerCase();
    if (correct) {
      setIsCorrect(true);
      setTimeout(() => gotoNext(), 900);
    } else {
      if (!wrongRecordedRef.current) {
        if (mode === "normal") dispatch({ type: "ADD_WRONG", payload: current });
        else addToNextWrongs(current);
        wrongRecordedRef.current = true;
      }
      setIsWrong(true);
      setAnswer("");
      setTimeout(() => setIsWrong(false), 180);
    }
  }

  if (!current) {
    dispatch({ type: "FINISH" });
    onFinish();
    return null;
  }

  return (
    <div className="relative w-[420px] bg-white rounded-2xl shadow-lg p-12 pt-20 pb-16 flex flex-col items-center gap-8">
      <Header onBack={onBack} />
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <Timer seconds={timer} />
        <Counter remaining={remaining} total={total} />
      </div>
      <WordCard masked={masked} pos={current.pos} meaning={current.meaning} isCorrect={isCorrect} isWrong={isWrong} />
      <form onSubmit={handleSubmit} className="w-full">
        <input ref={inputRef} type="text" value={answer} onChange={(e) => setAnswer(e.target.value)}
          className="w-full mt-4 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="請輸入完整單字" autoComplete="off" />
        <button type="submit" className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">送出</button>
      </form>
      {mode === "review" && <p className="text-xs text-amber-600">目前為錯題練習模式：答錯的會進下一輪，直到全部答對。</p>}
    </div>
  );
}
