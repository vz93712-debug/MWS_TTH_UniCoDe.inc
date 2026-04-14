import { useState } from "react";
import { GlobalLayout } from "./components/layouts/GlobalLayout";
import { LoginPage } from "./pages/LoginPage";
import Editor from "./features/editor/Editor";
// Проверь путь к Drawer!
import { AIAssistantDrawer } from "./components/blocks/Drawers/AIAssistantDrawer";
import { Sparkles } from "lucide-react";

function App() {
  const [isAuth, setIsAuth] = useState(false);
  // Стало: При первой загрузке ищем ID в памяти
  const [currentPageId, setCurrentPageId] = useState(() => {
    return localStorage.getItem("last_opened_page") || null;
  });

  // Создаем умную функцию переключения
  const handlePageSelect = (id) => {
    setCurrentPageId(id);
    localStorage.setItem("last_opened_page", id); // Запоминаем выбор
  };

  // Стейт для панели ИИ
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  if (!isAuth) {
    return <LoginPage onLogin={() => setIsAuth(true)} />;
  }

  return (
    <GlobalLayout onPageSelect={handlePageSelect}>
      <main className="h-full w-full flex flex-col overflow-hidden relative">
        {currentPageId ? (
          <>
            <Editor pageId={currentPageId} key={currentPageId} />

            {/* Плавающая кнопка вызова ИИ */}
            <button
              onClick={() => setIsAiDrawerOpen(true)}
              className="absolute bottom-6 right-6 flex items-center gap-2 bg-[#19191C] hover:bg-gray-800 text-white text-[13px] font-bold px-5 py-3 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 z-40"
            >
              <Sparkles size={18} className="text-[#FF0032]" />
              AI-Ассистент
            </button>

            {/* Сам Drawer ИИ */}
            <AIAssistantDrawer
              isOpen={isAiDrawerOpen}
              onClose={() => setIsAiDrawerOpen(false)}
              pageId={currentPageId}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full text-gray-400 bg-gray-50/30">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <span className="text-2xl font-wide text-gray-300">W</span>
            </div>
            <p className="text-sm font-medium text-gray-500">
              Выберите страницу в меню слева
            </p>
          </div>
        )}
      </main>
    </GlobalLayout>
  );
}

export default App;
