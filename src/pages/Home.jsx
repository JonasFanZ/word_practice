import { useState } from "react";
import { useQuiz } from "../context/QuizContext";
import ApiKeyModal from "../components/ApiKeyModal";

export default function Home({ onSelectMode }) {
  const { state, dispatch } = useQuiz();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleModeSelect = (mode) => {
    dispatch({ type: "SET_GAME_MODE", payload: mode });
    onSelectMode(mode); 
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-8 py-10 px-4">
      {/* Settings Button */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-0 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        title="設定 API Key"
      >
        <span className="text-2xl">⚙️</span>
      </button>

      <ApiKeyModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div className="text-center space-y-2 mt-8">
        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">高中英文 7000 單</h1>
        <p className="text-gray-500 font-medium">學測衝刺特訓平台</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* 拼字模式 */}
        <button 
          onClick={() => handleModeSelect("spelling")}
          className="group relative bg-white p-8 rounded-3xl shadow-lg border-2 border-transparent hover:border-blue-400 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
             <span className="text-8xl">✍️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">單字拼寫特訓</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            透過「遮罩拼字」強化記憶。適合打底、作文與翻譯練習。
          </p>
          <div className="mt-4 inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            Level 1-6
          </div>
        </button>

        {/* 選擇題模式 */}
        <button 
          onClick={() => handleModeSelect("mcq")}
          className="group relative bg-white p-8 rounded-3xl shadow-lg border-2 border-transparent hover:border-amber-400 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
             <span className="text-8xl">🏆</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-amber-600 transition">學測詞彙題模擬</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            針對學測第一大題設計。包含歷屆試題與 AI 弱點分析。
          </p>
          
          <div className="flex gap-2 mt-4">
             <div className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
               Past Exams
             </div>
             {state.apiKey ? (
                <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                   <span>✨</span> AI Ready
                </div>
             ) : (
                <div className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                   AI 未設定
                </div>
             )}
          </div>
        </button>
      </div>
    </div>
  );
}