import { useState } from "react";
import { api } from "../../services/api";

export function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Реальный запрос к бэкенду
      const data = await api.login(email, password);

      // Сохраняем токены
      localStorage.setItem("access_token", data.tokens.access);
      localStorage.setItem("refresh_token", data.tokens.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Даем сигнал в App.jsx, что мы вошли
      onLogin();
    } catch (error) {
      setErrorMsg(error.message || "Неверный логин или пароль");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 p-10">
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-14 h-14 bg-[#FF0032] rounded-2xl text-white flex items-center justify-center font-wide font-bold text-2xl shadow-lg mb-4">
            W
          </div>
          <h1 className="font-wide font-bold text-2xl text-gray-900">
            WikiLive
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Войдите для доступа к системе
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#FF0032] focus:ring-1 focus:ring-[#FF0032] transition-colors"
              placeholder="admin@admin.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#FF0032] focus:ring-1 focus:ring-[#FF0032] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF0032] hover:bg-[#CC0028] text-white font-wide font-bold text-lg py-3.5 rounded-xl transition-all shadow-md mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? "Подключение..." : "Войти в систему"}
          </button>
        </form>
      </div>
    </div>
  );
}
