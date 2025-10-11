import { useState } from "react";
import { useQuiz } from "../context/QuizContext";
import Modal from "./Modal";

export default function Header({ onBack }) {
  const { dispatch } = useQuiz();
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-4 left-4">
      <button
        onClick={() => setOpen(true)}
        aria-label="回初始畫面"
        className="text-2xl font-bold text-gray-700 hover:text-gray-900"
        title="回初始畫面"
      >
        ←
      </button>

      <Modal
        open={open}
        title="回到初始畫面"
        message="回到初始畫面將遺忘當前錯題紀錄。確定要返回嗎？"
        confirmText="OK"
        cancelText="Cancel"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          dispatch({ type: "RESET_ALL" });
          setOpen(false);
          onBack();
        }}
      />
    </div>
  );
}
