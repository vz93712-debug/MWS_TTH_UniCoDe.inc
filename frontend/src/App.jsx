import { useState } from 'react';
import { GlobalLayout } from "./components/layouts/GlobalLayout";
import { Dashboard } from "./pages/Dashboard";
import { EditorPage } from "./pages/EditorPage";
import { UIKitShowcase } from './UIKitShowcase';

function App() {
  // Меняй тут начальное состояние, чтобы тестировать разные экраны
  // 'editor' | 'dashboard' | 'showcase'
  const [currentView, setCurrentView] = useState('editor'); 

  // === РЕЖИМ ВИТРИНЫ КОМПОНЕНТОВ ===
  if (currentView === 'showcase') {
    return (
      <div className="relative bg-gray-50 min-h-screen">
        <button 
          onClick={() => setCurrentView('editor')}
          className="fixed top-4 right-4 z-[100] bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-colors"
        >
          ← Вернуться в Приложение
        </button>
        <UIKitShowcase />
      </div>
    );
  }

  // === РЕЖИМ БОЕВОГО ПРИЛОЖЕНИЯ ===
  return (
    <div className="relative h-screen w-full overflow-hidden">
      
      {/* Кнопка для перехода на витрину (висит в углу) */}
      <button 
        onClick={() => setCurrentView('showcase')}
        className="fixed bottom-6 right-6 z-[100] bg-[#E33A3A] hover:bg-red-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
      >
        🎨 UI Kit
      </button>

      {/* Глобальная оболочка (Сайдбар + Шапка) */}
      <GlobalLayout>
        {/* Переключаем экраны */}
        {currentView === 'dashboard' ? (
          <Dashboard />
        ) : (
          <EditorPage>
            {/* Сюда позже пойдет <Editor /> от Вовы */}
          </EditorPage>
        )}
      </GlobalLayout>

    </div>
  );
}

export default App;