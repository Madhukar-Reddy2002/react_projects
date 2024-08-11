function Modal({ isOpen, onClose, image }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-3xl shadow-neumorphism relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-2 py-1"
        >
          X
        </button>
        <img src={image.src} alt={image.caption} className="max-w-full max-h-[400px] rounded-lg mb-4" />
        <p className="text-gray-700 text-sm font-bold">{image.caption}</p>
        <p className="text-gray-500 text-xs">{image.timestamp}</p>
      </div>
    </div>
  );
}

export default Modal;
