import { createContext, useContext, useReducer } from "react";

const QuizContext = createContext();

const initialState = {
  gameMode: "spelling", // "spelling" | "mcq"
  mcqSource: null,      // "past" | "ai"
  level: null,
  questions: [],
  roundSet: [],      
  wrongList: [],
  flaggedList: [],      // { questionId, optionText }
  eliminatedList: [],   // { questionId, optionText }
  currentIndex: 0,
  timer: 30,            
  startTime: null,      
  endTime: null,        
  mode: "normal",    
  isFinished: false,
  // 新增: 優先從 localStorage 讀取，沒有的話才讀環境變數
  apiKey: localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY || "",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_GAME_MODE": return { ...state, gameMode: action.payload };
    case "SET_MCQ_SOURCE": return { ...state, mcqSource: action.payload };
    case "SET_LEVEL": return { ...state, level: action.payload };
    case "SET_QUESTIONS": return { ...state, questions: action.payload };
    case "SET_ROUNDSET": 
      return { 
        ...state, 
        roundSet: action.payload, 
        currentIndex: 0, 
        flaggedList: [], 
        eliminatedList: [], 
        startTime: Date.now(), 
        endTime: null 
      };
    case "NEXT_QUESTION": return { ...state, currentIndex: state.currentIndex + 1 };
    
    case "ADD_WRONG": {
      const key = state.gameMode === "spelling" 
        ? (action.payload.word || "").toLowerCase() 
        : action.payload.id;
        
      const exists = state.wrongList.some(q => {
        if (state.gameMode === "spelling") return (q.word || "").toLowerCase() === key;
        return q.id === key;
      });
      
      if (exists) return state;
      return { ...state, wrongList: [...state.wrongList, action.payload] };
    }

    case "TOGGLE_FLAG": {
      const { questionId, optionText } = action.payload;
      let newEliminatedList = state.eliminatedList;
      if (state.eliminatedList.some(e => e.questionId === questionId && e.optionText === optionText)) {
        newEliminatedList = state.eliminatedList.filter(e => !(e.questionId === questionId && e.optionText === optionText));
      }

      const exists = state.flaggedList.some(f => f.questionId === questionId && f.optionText === optionText);
      let newFlaggedList;
      if (exists) {
        newFlaggedList = state.flaggedList.filter(f => !(f.questionId === questionId && f.optionText === optionText));
      } else {
        newFlaggedList = [...state.flaggedList, action.payload];
      }

      return { ...state, flaggedList: newFlaggedList, eliminatedList: newEliminatedList };
    }

    case "TOGGLE_ELIMINATION": {
      const { questionId, optionText } = action.payload;
      let newFlaggedList = state.flaggedList;
      if (state.flaggedList.some(f => f.questionId === questionId && f.optionText === optionText)) {
        newFlaggedList = state.flaggedList.filter(f => !(f.questionId === questionId && f.optionText === optionText));
      }

      const exists = state.eliminatedList.some(e => e.questionId === questionId && e.optionText === optionText);
      let newEliminatedList;
      if (exists) {
        newEliminatedList = state.eliminatedList.filter(e => !(e.questionId === questionId && e.optionText === optionText));
      } else {
        newEliminatedList = [...state.eliminatedList, action.payload];
      }

      return { ...state, eliminatedList: newEliminatedList, flaggedList: newFlaggedList };
    }
    
    case "CLEAR_WRONGS": return { ...state, wrongList: [], flaggedList: [], eliminatedList: [] };
    case "SET_MODE": return { ...state, mode: action.payload };
    case "FINISH": return { ...state, isFinished: true, endTime: Date.now() };
    case "RESET_FINISH": return { ...state, isFinished: false, endTime: null };
    case "RESET_ALL": return initialState;

    // 新增: 設定 API Key
    case "SET_API_KEY": {
      const newKey = action.payload;
      if (newKey) {
        localStorage.setItem("gemini_api_key", newKey);
      } else {
        localStorage.removeItem("gemini_api_key");
      }
      return { ...state, apiKey: newKey };
    }

    default: return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <QuizContext.Provider value={{ state, dispatch }}>{children}</QuizContext.Provider>;
}

export const useQuiz = () => useContext(QuizContext);