import { useState } from "react";
import { GlobalLayout } from "./components/layouts/GlobalLayout";
import { LoginPage } from "./pages/LoginPage";
// Важно: импортируем именно Editor, так как он умеет принимать pageId
import Editor from "./features/editor/Editor";
// import { Dashboard } from "./pages/Dashboard"; // Раскомментируй, если захочешь вернуть дашборд

function App() {
  // 1. Стейт авторизации
  const [isAuth, setIsAuth] = useState(false);

  // 2. Стейт текущей открытой страницы (вместо currentView)
  const [currentPageId, setCurrentPageId] = useState(null);

  // Если не авторизован — показываем только логин
  if (!isAuth) {
    return <LoginPage onLogin={() => setIsAuth(true)} />;
  }

  // Если вошли — показываем основную структуру
  return (
    // Передаем функцию, которая обновляет ID при клике в сайдбаре
    <GlobalLayout onPageSelect={(id) => setCurrentPageId(id)}>
      <main className="h-full w-full flex flex-col overflow-hidden relative">
        {currentPageId ? (
          // Обязательно передаем key={currentPageId}!
          // Это заставит React полностью перерисовать компонент и переподключить WebSockets
          <Editor pageId={currentPageId} key={currentPageId} />
        ) : (
          // Можно вставить <Dashboard />, но пока оставим красивую заглушку
          <div className="flex flex-col items-center justify-center h-full w-full text-gray-400 bg-gray-50/30">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <span className="text-2xl font-wide text-gray-300">W</span>
            </div>
            <p className="text-sm font-medium text-gray-500">
              Выберите страницу в меню слева
            </p>
            <p className="text-xs mt-1 text-gray-400">
              или создайте новую, чтобы начать работу
            </p>
          </div>
        )}
      </main>
    </GlobalLayout>
  );
}

export default App;
