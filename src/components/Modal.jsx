export default function Modal({ open, title, message, onConfirm, onCancel, confirmText="OK", cancelText="Cancel" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[320px] rounded-2xl p-6 shadow-xl">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
