import { useMemo, useState, useEffect } from "react";
import { useQuiz } from "../context/QuizContext";
import { fetchSheet, fetchMCQ } from "../utils/fetchSheet";
import { generatePersonalizedQuiz, analyzeMistakes } from "../utils/genAI";

function sampleN(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

export default function Result({ onHome, onContinue }) {
  const { state, dispatch } = useQuiz();
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingNextRound, setIsGeneratingNextRound] = useState(false); // 新增：下一輪生成中狀態
  
  const wrongHistory = useMemo(() => state.wrongList || [], [state.wrongList]);
  const flaggedHistory = useMemo(() => state.flaggedList || [], [state.flaggedList]);
  const eliminatedHistory = useMemo(() => state.eliminatedList || [], [state.eliminatedList]);
  const allQuestions = useMemo(() => state.roundSet || [], [state.roundSet]);
  
  const totalQuestions = state.roundSet.length || 10;
  const correctCount = totalQuestions - wrongHistory.length;
  const score = Math.round((correctCount / totalQuestions) * 100);

  const durationSeconds = useMemo(() => {
    if (state.startTime && state.endTime) {
      return Math.floor((state.endTime - state.startTime) / 1000);
    }
    return 0;
  }, [state.startTime, state.endTime]);

  const timeEvaluation = useMemo(() => {
    const avgTime = durationSeconds / totalQuestions;
    if (avgTime < 15) return { 
        title: "🚀 極速刷題", 
        desc: "速度非常快，有充裕時間應對閱讀測驗，但要小心粗心。", 
        color: "text-green-600", 
        bgColor: "bg-green-50" 
    };
    if (avgTime <= 45) return { 
        title: "✅ 標準節奏", 
        desc: "時間分配非常安全，這是考試的理想速度。", 
        color: "text-blue-600", 
        bgColor: "bg-blue-50" 
    };
    if (avgTime <= 60) return { 
        title: "⚠️ 稍嫌猶豫", 
        desc: "平均每題花費近一分鐘，可能會壓縮到後面閱讀測驗的時間。", 
        color: "text-amber-600", 
        bgColor: "bg-amber-50" 
    };
    return { 
        title: "🛑 危險邊緣", 
        desc: "單字題耗時過久，建議多刷題提升對單字的直覺反應。", 
        color: "text-red-600", 
        bgColor: "bg-red-50" 
    };
  }, [durationSeconds, totalQuestions]);

  useEffect(() => {
    if (state.gameMode === "mcq" && (wrongHistory.length > 0 || flaggedHistory.length > 0) && !aiAnalysis) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const report = await analyzeMistakes(wrongHistory, flaggedHistory, eliminatedHistory, allQuestions);
            setAiAnalysis(report);
        } catch (err) {
            console.error("Analysis Error:", err);
            setAiAnalysis("分析發生錯誤。");
        } finally {
            setIsAnalyzing(false);
        }
      };
      runAnalysis();
    }
  }, [state.gameMode, wrongHistory, flaggedHistory, eliminatedHistory, allQuestions, aiAnalysis]);

  async function handleContinue() {
    setIsGeneratingNextRound(true); // 開始 loading
    let allData = [];
    
    try {
        if (state.gameMode === "mcq") {
          if (state.mcqSource === 'ai' && wrongHistory.length > 0) {
             // 1. AI 針對弱點出題
             let newAiQuestions = await generatePersonalizedQuiz(wrongHistory);
             
             // 2. 如果 AI 題目不足 10 題，用歷屆試題補足
             if (!newAiQuestions) newAiQuestions = [];
             
             if (newAiQuestions.length < 10) {
                 const pastQuestions = await fetchMCQ('past');
                 const needed = 10 - newAiQuestions.length;
                 const randomExtras = sampleN(pastQuestions, needed);
                 
                 // 確保不重複 ID (簡單防呆)
                 const existingIds = new Set(newAiQuestions.map(q => q.id));
                 const uniqueExtras = randomExtras.filter(q => !existingIds.has(q.id));
                 
                 allData = [...newAiQuestions, ...uniqueExtras];
             } else {
                 allData = newAiQuestions.slice(0, 10);
             }
          } else {
             // 歷屆試題模式，重新隨機抽 10 題
             const freshData = await fetchMCQ('past');
             allData = sampleN(freshData, 10);
          }
        } else {
          // 拼字模式
          allData = await fetchSheet(state.level ?? 1);
          allData = sampleN(allData, 10); // 確保拼字也是 10 題
        }
        
        if (!allData || allData.length === 0) {
            alert("無法載入題目，請檢查網路連線");
            return;
        }

        // 這裡不需要再 sampleN，因為上面邏輯已經確保是 10 題了 (或是接近 10 題)
        const round = allData;
        
        dispatch({ type: "SET_QUESTIONS", payload: allData }); // 這行其實在 MCQ 模式下意義不大，因為 roundSet 才是重點，但保持一致性
        dispatch({ type: "SET_ROUNDSET", payload: round });
        dispatch({ type: "SET_MODE", payload: "normal" });
        dispatch({ type: "CLEAR_WRONGS" });
        dispatch({ type: "RESET_FINISH" });
        onContinue();

    } catch (e) {
        console.error("Error generating next round:", e);
        alert("生成題目時發生錯誤，請重試");
    } finally {
        setIsGeneratingNextRound(false); // 結束 loading
    }
  }

  const handleBackToMenu = () => {
    onHome(); 
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}分${sec}秒`;
  };

  return (
    <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
      
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-800">測驗完成！</h2>
        
        <div className="flex justify-center items-center gap-8 py-2">
          <div className="text-center">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Score</p>
            <p className={`text-5xl font-black ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {score}
            </p>
          </div>
          <div className="text-left text-sm text-gray-600 space-y-1">
            <p>✅ 答對：{correctCount} 題</p>
            <p>❌ 答錯：{wrongHistory.length} 題</p>
            <p>⏱️ 總時：{formatTime(durationSeconds)}</p>
          </div>
        </div>

        {state.gameMode === "mcq" && (
            <div className={`text-left p-4 rounded-xl border ${timeEvaluation.bgColor} ${timeEvaluation.color} border-current border-opacity-20`}>
                <p className="font-bold text-lg mb-1">{timeEvaluation.title}</p>
                <p className="text-sm opacity-90">{timeEvaluation.desc}</p>
            </div>
        )}
      </div>

      {state.gameMode === "mcq" && (wrongHistory.length > 0 || flaggedHistory.length > 0) && (
        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-inner">
          <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
            <span>🤖</span> 
            {isAnalyzing ? "AI 老師正在批改試卷..." : "試題深度解析"}
          </h3>
          
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 text-indigo-400">
              <span className="animate-spin text-3xl">⚙️</span>
              <p className="text-sm animate-pulse">正在分析你的標記與刪去邏輯...</p>
            </div>
          ) : (
            <div className="prose prose-sm prose-indigo max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed font-medium font-sans">
              {aiAnalysis}
            </div>
          )}
        </div>
      )}

      {state.gameMode === "mcq" && wrongHistory.length === 0 && flaggedHistory.length === 0 && (
        <div className="bg-green-50 rounded-xl p-6 text-center text-green-700">
          <p className="font-bold text-lg">完美通關！💯</p>
          <p className="text-sm mt-1">全對且完全沒有疑問，你的實力非常穩固！</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-4">
        <button 
            onClick={handleContinue} 
            disabled={isGeneratingNextRound}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGeneratingNextRound ? (
             <>
               <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
               題目生成中...
             </>
          ) : (
             <>
               {wrongHistory.length > 0 && state.mcqSource === 'ai' ? "🔄 針對弱點再練一輪 (AI)" : "➡️ 繼續下一輪挑戰"}
             </>
          )}
        </button>
        
        <button onClick={handleBackToMenu}
          className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-medium">
          回題目選單
        </button>
      </div>
    </div>
  );
}