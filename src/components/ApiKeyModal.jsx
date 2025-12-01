import { useState, useEffect } from "react";
import { useQuiz } from "../context/QuizContext";

export default function ApiKeyModal({ open, onClose }) {
  const { state, dispatch } = useQuiz();
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (open) {
      setInputValue(state.apiKey || "");
    }
  }, [open, state.apiKey]);

  if (!open) return null;

  const handleSave = () => {
    dispatch({ type: "SET_API_KEY", payload: inputValue.trim() });
    onClose();
  };

  const handleClear = () => {
    setInputValue("");
    dispatch({ type: "SET_API_KEY", payload: "" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-xl font-bold text-gray-800">Gemini API 設定</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <p className="text-sm text-gray-600 leading-relaxed">
          為了使用 AI 出題與分析功能，請輸入您的 Google Gemini API Key。<br/>
          <span className="text-xs text-gray-400">您的 Key 僅會儲存在瀏覽器本地端 (LocalStorage)，不會上傳至其他伺服器。</span>
        </p>

        <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">API Key</label>
            <input 
              type="password" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="貼上您的 API Key..."
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono text-sm"
            />
        </div>

        <div className="flex items-center justify-between mt-4">
            <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
                取得 API Key ↗
            </a>
            
            <div className="flex gap-2">
                {state.apiKey && (
                    <button 
                        onClick={handleClear}
                        className="px-4 py-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 font-medium text-sm"
                    >
                        移除
                    </button>
                )}
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition"
                >
                    儲存
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}