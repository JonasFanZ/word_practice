export default function Timer({ seconds }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">⏱️</span>
      <span className="font-semibold">{seconds}s</span>
    </div>
  );
}
