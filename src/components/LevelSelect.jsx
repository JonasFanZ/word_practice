export default function LevelSelect({ onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {[1, 2, 3, 4, 5, 6].map(n => (
        <button 
          key={n} 
          onClick={() => onSelect(n)} 
          className="bg-white p-8 w-32 md:w-40 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-center gap-2"
        >
          <span className="text-3xl font-bold text-gray-800">{n}</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Level</span>
        </button>
      ))}
    </div>
  );
}