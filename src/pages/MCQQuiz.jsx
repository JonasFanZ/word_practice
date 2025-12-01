import { useEffect, useState, useRef } from "react";
import { useQuiz } from "../context/QuizContext";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Counter from "../components/Counter";

export default function MCQQuiz({ onFinish, onBack }) {
  const { state, dispatch } = useQuiz();
  const { roundSet, currentIndex, flaggedList, eliminatedList } = state;
  
  const [selectedOption, setSelectedOption] = useState(null); 
  const [isRevealed, setIsRevealed] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const wrongRecordedRef = useRef(false);

  const current = roundSet[currentIndex];
  const total = roundSet.length;
  const remaining = Math.max(0, total - currentIndex);

  // 1. 計時器邏輯
  useEffect(() => {
    const timer = setInterval(() => {
      if (state.startTime && !state.endTime) {
        setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [state.startTime, state.endTime]);

  // 2. 初始化每題狀態
  useEffect(() => {
    setSelectedOption(null);
    setIsRevealed(false);
    wrongRecordedRef.current = false;
  }, [currentIndex]);

  // 3. 鍵盤綁定邏輯 (Q,W,E,R, Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!current) return;

      const key = e.key.toLowerCase();

      // Enter: 如果已經揭曉，進入下一題
      if (key === "enter" && isRevealed) {
        gotoNext();
        return;
      }

      // Q, W, E, R: 選擇答案 (尚未揭曉時)
      if (!isRevealed) {
        const keyMap = { 'q': 0, 'w': 1, 'e': 2, 'r': 3 };
        const index = keyMap[key];

        if (index !== undefined && index < current.options.length) {
          const option = current.options[index];
          // 檢查是否被刪去
          const isEliminated = eliminatedList.some(elim => elim.questionId === current.id && elim.optionText === option);
          
          if (!isEliminated) {
            handleSelect(option, false);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, current, eliminatedList]); 

  function handleSelect(option, isEliminated) {
    if (isRevealed) return;
    if (isEliminated) return; 

    setSelectedOption(option);
    setIsRevealed(true);

    // 優化 1: 移除自動跳轉 setTimeout，僅記錄對錯，等待使用者按下一題
    if (option !== current.answer) {
      recordWrong(option);
    }
  }

  function recordWrong(userChoice) {
    if (!wrongRecordedRef.current) {
      const wrongData = { ...current, userChoice: userChoice };
      dispatch({ type: "ADD_WRONG", payload: wrongData });
      wrongRecordedRef.current = true;
    }
  }

  function handleFlag(e, option) {
    e.stopPropagation();
    if (isRevealed) return;
    
    const isEliminated = eliminatedList.some(e => e.questionId === current.id && e.optionText === option);
    if (isEliminated) {
        dispatch({ type: "TOGGLE_ELIMINATION", payload: { questionId: current.id, optionText: option } });
    }
    
    dispatch({ type: "TOGGLE_FLAG", payload: { questionId: current.id, optionText: option } });
  }

  function handleEliminate(e, option) {
    e.stopPropagation();
    if (isRevealed) return;

    const isFlagged = flaggedList.some(f => f.questionId === current.id && f.optionText === option);
    if (isFlagged) {
        dispatch({ type: "TOGGLE_FLAG", payload: { questionId: current.id, optionText: option } });
    }

    dispatch({ type: "TOGGLE_ELIMINATION", payload: { questionId: current.id, optionText: option } });
  }

  function gotoNext() {
    const isLast = currentIndex + 1 >= total;
    if (!isLast) {
      dispatch({ type: "NEXT_QUESTION" });
    } else {
      dispatch({ type: "FINISH" });
      onFinish();
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!current) return null;

  return (
    <div className="relative w-full max-w-[600px] bg-white rounded-3xl shadow-xl p-8 md:p-12 flex flex-col gap-6">
      <Header onBack={onBack} />
      
      {/* 頂部資訊列 */}
      <div className="flex items-center justify-between mb-2 pl-12">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
             <span className="text-xs font-bold text-gray-500">
               {state.mcqSource === 'ai' ? '🤖 AI 仿製題' : '📜 歷屆試題'}
             </span>
           </div>
           <div className="flex items-center gap-1 text-gray-500 font-mono text-sm bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
             <span>⏱️</span>
             <span>{formatTime(elapsedTime)}</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <Counter remaining={remaining} total={total} />
        </div>
      </div>

      {/* 題目區 */}
      <div className="space-y-4">
        <h3 className="text-xl md:text-2xl font-serif font-medium leading-relaxed text-gray-800">
          {current.question.split('______').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className={`inline-block min-w-[80px] border-b-2 text-center font-bold mx-1 transition-colors ${
                  isRevealed 
                    ? "border-blue-500 text-blue-600" 
                    : "border-gray-400 text-transparent"
                }`}>
                  {isRevealed ? current.answer : "?"}
                </span>
              )}
            </span>
          ))}
        </h3>
        
        {/* 優化 3: 固定高度容器，防止位移 */}
        <div className="min-h-[80px] flex items-start transition-opacity duration-300" style={{ opacity: isRevealed ? 1 : 0 }}>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 w-full">
            <span className="font-bold mr-2">翻譯:</span> {current.translation}
          </div>
        </div>
      </div>

      {/* 選項區 */}
      <div className="grid grid-cols-1 gap-3">
        {current.options.map((opt, idx) => {
          const isFlagged = flaggedList.some(f => f.questionId === current.id && f.optionText === opt);
          const isEliminated = eliminatedList.some(e => e.questionId === current.id && e.optionText === opt);
          
          let containerClass = "rounded-xl border-2 text-lg font-medium transition-all duration-200 text-left relative group flex items-stretch justify-between overflow-hidden ";
          
          if (isRevealed) {
            if (opt === current.answer) {
              containerClass += " bg-green-100 border-green-500 text-green-800"; 
            } else if (opt === selectedOption) {
              containerClass += " bg-red-100 border-red-500 text-red-800";     
            } else {
              containerClass += " bg-gray-50 border-gray-100 text-gray-400 opacity-50"; 
            }
          } else {
            if (isEliminated) {
               containerClass += " bg-gray-100 border-gray-200 text-gray-400 decoration-2 decoration-gray-400 opacity-70"; 
            } else {
               containerClass += " bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 cursor-pointer hover:shadow-md";
            }
          }

          // 鍵盤提示字元
          const hotkey = ['Q', 'W', 'E', 'R'][idx];

          return (
            <div key={idx} className={containerClass}>
                <div 
                  onClick={() => handleSelect(opt, isEliminated)} 
                  className={`flex-grow p-4 flex items-center ${isEliminated ? "cursor-not-allowed line-through" : ""}`}
                >
                  {/* 優化 2: 鍵盤提示 */}
                  {!isRevealed && !isEliminated && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-mono border border-gray-200 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                        {hotkey}
                    </span>
                  )}

                  <span className="mr-3 opacity-60 text-sm font-bold no-underline inline-block pl-4 md:pl-6">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                </div>

                {!isRevealed && (
                    <div className="flex items-center gap-2 pr-3 pl-3 bg-gray-50/80 border-l border-gray-100/50">
                        <button 
                            onClick={(e) => handleEliminate(e, opt)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                            isEliminated 
                                ? "bg-gray-600 text-white border-gray-600 shadow-sm transform scale-110" 
                                : "bg-white text-gray-400 border-gray-200 hover:border-red-400 hover:text-red-500 hover:bg-red-50"
                            }`}
                            title="刪去選項 (排除)"
                        >
                            <span className="text-sm font-bold">✕</span>
                        </button>

                        <button 
                            onClick={(e) => handleFlag(e, opt)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                            isFlagged 
                                ? "bg-amber-400 text-white border-amber-400 shadow-sm transform scale-110" 
                                : "bg-white text-gray-400 border-gray-200 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50"
                            }`}
                            title="標記疑問 (AI解釋)"
                        >
                            <span className="text-sm font-bold">?</span>
                        </button>
                    </div>
                )}
            </div>
          );
        })}
      </div>
      
      {/* 底部功能區 */}
      <div className="mt-4 flex items-center justify-between h-14">
          <div className="flex gap-4 text-xs text-gray-400 items-center">
            <div className="flex items-center gap-1">
                <span className="w-4 h-4 bg-white border border-gray-300 text-gray-300 rounded-full flex items-center justify-center text-[10px]">✕</span>
                <span>刪去</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="w-4 h-4 bg-white border border-gray-300 text-gray-300 rounded-full flex items-center justify-center text-[10px]">?</span>
                <span>疑問</span>
            </div>
          </div>

          {/* 優化 1: 手動下一題按鈕 (只在揭曉後顯示) */}
          {isRevealed && (
              <button 
                  onClick={gotoNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2 animate-bounce-short"
              >
                  下一題 <span className="text-xs opacity-70 font-mono border border-blue-400 px-1 rounded hidden md:inline-block">ENTER</span>
              </button>
          )}
      </div>
    </div>
  );
}