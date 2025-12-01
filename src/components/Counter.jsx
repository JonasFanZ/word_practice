export default function Counter({ remaining, total }) {
  // remaining 是剩餘題數，total 是總題數
  // 剛進來：remaining = 10, current = 1
  // 做完最後一題：remaining = 1, current = 10
  
  const currentQuestionNumber = total - remaining + 1;

  return (
    <div className="font-bold text-gray-500 text-lg flex items-baseline">
        <span className="text-blue-600 text-2xl font-black mr-1">{currentQuestionNumber}</span>
        <span className="text-sm text-gray-400">/ {total}</span>
    </div>
  );
}