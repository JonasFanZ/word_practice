import { createContext, useContext, useReducer } from "react";
const QuizContext = createContext();
const initialState = {
  level: null,
  questions: [],
  roundSet: [],      // 本輪題目（10 題或 review 題）
  wrongList: [],     // 僅在 normal 模式累積錯題（review 模式不使用它換輪）
  currentIndex: 0,
  timer: 30,
  mode: "normal",    // normal | review
  isFinished: false,
};
function reducer(state, action) {
  switch (action.type) {
    case "SET_LEVEL": return { ...state, level: action.payload };
    case "SET_QUESTIONS": return { ...state, questions: action.payload };
    case "SET_ROUNDSET": return { ...state, roundSet: action.payload, currentIndex: 0 };
    case "NEXT_QUESTION": return { ...state, currentIndex: state.currentIndex + 1 };
    case "ADD_WRONG": {
      const key = (action.payload.word || "").toLowerCase();
      const exists = state.wrongList.some(q => (q.word || "").toLowerCase() === key);
      if (exists) return state;
      return { ...state, wrongList: [...state.wrongList, action.payload] };
    }
    case "CLEAR_WRONGS": return { ...state, wrongList: [] };
    case "SET_MODE": return { ...state, mode: action.payload };
    case "FINISH": return { ...state, isFinished: true };
    case "RESET_FINISH": return { ...state, isFinished: false };
    case "RESET_ALL": return initialState;
    default: return state;
  }
}
export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <QuizContext.Provider value={{ state, dispatch }}>{children}</QuizContext.Provider>;
}
export const useQuiz = () => useContext(QuizContext);
