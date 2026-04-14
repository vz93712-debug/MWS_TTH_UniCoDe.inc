import { useState } from "react";
import { GlobalLayout } from "./components/layouts/GlobalLayout";
import { Dashboard } from "./pages/Dashboard";
import { EditorPage } from "./pages/EditorPage";
import { LoginPage } from "./pages/LoginPage"; // Та самая форма из прошлого шага

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard"); // По умолчанию после входа — дашборд

  // 1. Если не авторизован — показываем только логин
  if (!isAuth) {
    return <LoginPage onLogin={() => setIsAuth(true)} />;
  }

  // 2. Если вошли — показываем основную структуру
  return (
    <GlobalLayout activeView={currentView} onNavigate={setCurrentView}>
      <main className="h-full w-full">
        {currentView === "dashboard" ? (
          <Dashboard onNavigate={setCurrentView} />
        ) : (
          <EditorPage />
        )}
      </main>
    </GlobalLayout>
  );
}

export default App;
