import { useState } from "react";
import { QuizProvider, useQuiz } from "./context/QuizContext";
import Home from "./pages/Home";
import LevelSelect from "./components/LevelSelect";
import Quiz from "./pages/Quiz";
import MCQQuiz from "./pages/MCQQuiz";
import Result from "./pages/Result";
import { fetchSheet, fetchMCQ } from "./utils/fetchSheet";
import { generatePersonalizedQuiz } from "./utils/genAI";

function sampleN(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function AppContent() {
  const { state, dispatch } = useQuiz();
  const [route, setRoute] = useState("home");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSelectMode = (mode) => {
    if (mode === 'spelling') {
      setRoute("level-select");
    } else {
      setRoute("source-select");
    }
  };

  const handleLevelSelect = async (level) => {
    dispatch({ type: "SET_LEVEL", payload: level });
    const allData = await fetchSheet(level);
    dispatch({ type: "SET_QUESTIONS", payload: allData });
    const round = sampleN(allData, 10);
    dispatch({ type: "SET_ROUNDSET", payload: round });
    dispatch({ type: "RESET_FINISH" });
    dispatch({ type: "SET_MODE", payload: "normal" });
    setRoute("quiz");
  };

  const handleSourceSelect = async (source) => {
    dispatch({ type: "SET_MCQ_SOURCE", payload: source });
    
    let questions = [];
    
    if (source === 'ai') {
      setIsAiLoading(true);
      questions = await generatePersonalizedQuiz([]); 
      setIsAiLoading(false);
      
      if (questions.length === 0) {
        alert("AI 生成失敗 (可能未設定 API Key)，將載入歷屆試題替代。");
        questions = await fetchMCQ('past');
      }
    } else {
      questions = await fetchMCQ('past');
    }

    dispatch({ type: "SET_QUESTIONS", payload: questions });
    // 確保只取 10 題
    const round = questions.length > 10 ? sampleN(questions, 10) : questions;
    
    dispatch({ type: "SET_ROUNDSET", payload: round });
    dispatch({ type: "RESET_FINISH" });
    dispatch({ type: "SET_MODE", payload: "normal" });
    dispatch({ type: "CLEAR_WRONGS" }); 
    
    setRoute("quiz");
  };

  const handleFinish = () => {
    setRoute("result");
  };

  const handleContinue = async () => {
    setRoute("quiz");
  };

  // 5. 實現分層返回邏輯
  const handleHome = () => {
    dispatch({ type: "RESET_FINISH" }); // 簡單重置結束狀態
    
    if (state.gameMode === 'mcq') {
        setRoute("source-select"); // 回字彙題選單
    } else if (state.gameMode === 'spelling') {
        setRoute("level-select"); // 回拼字等級選單
    } else {
        setRoute("home");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10">
      {route === "home" && (
        <Home onSelectMode={handleSelectMode} />
      )}
      
      {route === "level-select" && (
        <div className="flex flex-col items-center gap-6">
           <div className="text-center">
             <h2 className="text-2xl font-bold text-gray-800">選擇等級</h2>
             <p className="text-gray-500">單字拼寫模式</p>
           </div>
           <LevelSelect onSelect={handleLevelSelect} />
           <button onClick={() => setRoute("home")} className="text-gray-400 hover:text-gray-600 underline">返回主選單</button>
        </div>
      )}

      {route === "source-select" && (
        <div className="flex flex-col items-center gap-6 w-full max-w-md px-4">
           <div className="text-center">
             <h2 className="text-2xl font-bold text-gray-800">選擇題目來源</h2>
             <p className="text-gray-500">學測詞彙題模擬</p>
           </div>
           
           <div className="grid gap-4 w-full">
             <button 
               onClick={() => handleSourceSelect('past')}
               className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex items-center gap-4"
             >
               <span className="text-4xl">📜</span>
               <div>
                 <h3 className="text-lg font-bold text-gray-800">歷屆學測精選</h3>
                 <p className="text-sm text-gray-500">練習 108 課綱後的真實考題。</p>
               </div>
             </button>

             <button 
               onClick={() => handleSourceSelect('ai')}
               disabled={isAiLoading}
               className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all text-left flex items-center gap-4 disabled:opacity-50"
             >
               {isAiLoading ? (
                 <div className="w-full flex justify-center py-2"><span className="animate-spin text-2xl">⚙️</span></div>
               ) : (
                 <>
                   <span className="text-4xl">🤖</span>
                   <div>
                     <h3 className="text-lg font-bold text-gray-800">AI 仿製題目</h3>
                     <p className="text-sm text-gray-500">由 Gemini AI 生成的高品質模擬題。</p>
                   </div>
                 </>
               )}
             </button>
           </div>

           <button onClick={() => setRoute("home")} className="text-gray-400 hover:text-gray-600 underline">返回主選單</button>
        </div>
      )}

      {route === "quiz" && (
        <>
          {state.gameMode === "spelling" ? (
            <Quiz onFinish={handleFinish} onBack={() => setRoute("home")} />
          ) : (
            <MCQQuiz onFinish={handleFinish} onBack={() => handleHome()} />
          )}
        </>
      )}

      {route === "result" && (
        <Result onHome={handleHome} onContinue={handleContinue} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QuizProvider>
      <AppContent />
    </QuizProvider>
  );
}