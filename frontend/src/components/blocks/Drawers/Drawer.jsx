import { X } from 'lucide-react';
import clsx from 'clsx';

export function Drawer({ isOpen, onClose, title, children }) {
  return (
    <>
      {/* Темный оверлей на заднем фоне */}
      <div 
        className={clsx(
          "fixed inset-0 z-[150] bg-[#19191C]/20 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Сама выезжающая панель */}
      <div 
        className={clsx(
          "fixed top-0 right-0 bottom-0 w-[350px] bg-white z-[200] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out font-sans",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Шапка шторки */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X size={20} />
          </button>
        </div>
        
        {/* Контент */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}