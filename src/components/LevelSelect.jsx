export default function LevelSelect({ onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {[1,2,3,4,5,6].map(n => (
        <button
          key={n}
          onClick={() => onSelect(n)}
          className="bg-white p-10 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition text-xl font-semibold"
        >
          Level {n}
        </button>
      ))}
    </div>
  );
}
