import { useState } from "react";
import { QuizProvider } from "./context/QuizContext";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";

export default function App() {
  const [route, setRoute] = useState("home"); // home | quiz | result

  return (
    <QuizProvider>
      <div className="flex items-center justify-center py-10">
        {route === "home" && <Home onStart={() => setRoute("quiz")} />}
        {route === "quiz" && (
          <Quiz
            onFinish={() => setRoute("result")}
            onBack={() => setRoute("home")}
          />
        )}
        {route === "result" && (
          <Result
            onHome={() => setRoute("home")}
            onContinue={() => setRoute("quiz")}
          />
        )}
      </div>
    </QuizProvider>
  );
}
