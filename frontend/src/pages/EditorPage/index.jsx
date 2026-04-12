import { useState } from 'react';
import { GripVertical, Play } from 'lucide-react';
import { TopToolbar } from '../../components/blocks/Toolbars/TopToolbar';
import { SlashMenu } from '../../components/blocks/Popovers/SlashMenu';

export function EditorPage({ children }) {
  // Локальные стейты для нашей UI-заглушки
  const [text, setText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Имитируем вызов слэш-меню
  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    
    // Если ввели слэш — открываем меню. Если стерли — закрываем.
    if (value.includes('/')) {
      setIsMenuOpen(true);
    } else {
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative font-sans">
      
      {/* Тулбар */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-3">
        <TopToolbar />
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-[900px] mx-auto w-full pt-16 px-8 cursor-text">
          
          <input 
            type="text" 
            className="w-full text-[40px] font-bold font-serif text-gray-900 placeholder:text-gray-300 focus:outline-none mb-6 bg-transparent"
            placeholder="Новая страница"
            defaultValue="Новая страница"
          />

          {/* ИМИТАЦИЯ БЛОКА РЕДАКТОРА (UI-заглушка) */}
          <div className="relative flex items-start gap-1 group">
            
            {/* Левые иконки (появляются при наведении) */}
            <div className="flex items-center mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-0.5 text-gray-300 hover:bg-gray-100 rounded cursor-grab transition-colors">
                <GripVertical size={16} />
              </button>
              <button className="p-0.5 text-gray-300 hover:bg-gray-100 rounded transition-colors mr-1">
                <Play size={10} className="fill-current" />
              </button>
            </div>

            {/* Поле ввода блока */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={text}
                onChange={handleChange}
                placeholder="Начните вводить содержимое или нажмите / чтобы использовать команды"
                className="w-full text-gray-700 text-[15px] bg-transparent focus:outline-none py-0.5 placeholder:text-gray-400"
              />

              {/* Наше Slash-меню (появляется прямо под текстом) */}
              {isMenuOpen && (
                <div className="absolute top-full left-0 mt-2 z-50">
                  <SlashMenu />
                </div>
              )}
            </div>
            
          </div>

          {/* Скрытый контейнер для будущего движка Вовы */}
          <div className="hidden">
            {children}
          </div>

        </div>
      </div>

    </div>
  );
}