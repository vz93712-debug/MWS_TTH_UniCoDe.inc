import { useState, useEffect } from "react";
import { X, FileBarChart, Loader2, Database, CheckCircle2 } from "lucide-react";
import { api } from "../../../services/api";

export function AIReportModal({
  isOpen,
  onClose,
  currentSpaceId,
  onReportSuccess,
}) {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState(currentSpaceId || "");
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [prompt, setPrompt] = useState("");

  const [status, setStatus] = useState("idle"); // idle, queued, processing, completed, error
  const [taskId, setTaskId] = useState(null);

  // === ПУЛЕНЕПРОБИВАЕМЫЙ ЭКСТРАКТОР МАССИВОВ ===
  const extractArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.spaces)) return data.spaces;
    if (Array.isArray(data.nodes)) return data.nodes;
    return []; // Возвращаем пустой массив, если ничего не подошло
  };

  // 1. Грузим пространства
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStatus("idle");
        setTaskId(null);
        setPrompt("");
      }, 0);
      return;
    }

    const fetchSpaces = async () => {
      try {
        const res = await api.getMwsSpaces();
        const data = extractArray(res);
        setSpaces(data);
        if (data.length > 0 && !selectedSpaceId) setSelectedSpaceId(data[0].id);
      } catch (e) {
        console.error("Ошибка загрузки пространств:", e);
      }
    };
    fetchSpaces();
  }, [isOpen, selectedSpaceId]);

  // 2. Грузим таблицы при смене пространства
  useEffect(() => {
    if (!selectedSpaceId || !isOpen) return;

    const fetchTables = async () => {
      try {
        const res = await api.getMwsNodes(selectedSpaceId);
        const data = extractArray(res);
        setTables(data);
        if (data.length > 0) setSelectedTableId(data[0].id);
      } catch (e) {
        console.error("Ошибка загрузки таблиц:", e);
      }
    };
    fetchTables();
  }, [selectedSpaceId, isOpen]);

  // 3. Поллинг задачи
  useEffect(() => {
    let intervalId;
    const pollTask = async () => {
      if (!taskId || status === "completed" || status === "error") return;
      try {
        const result = await api.checkTaskStatus(taskId);
        if (result.status === "completed") {
          setStatus("completed");
          setTimeout(() => {
            onReportSuccess(result.page_id);
            onClose();
          }, 1500);
        } else if (result.status === "failed") {
          setStatus("error");
        } else {
          setStatus(result.status);
        }
      } catch (e) {
        console.error("Ошибка опроса статуса:", e);
        setStatus("error");
      }
    };

    if (taskId) intervalId = setInterval(pollTask, 2000);
    return () => clearInterval(intervalId);
  }, [taskId, status, onClose, onReportSuccess]);

  const handleGenerate = async () => {
    if (!selectedTableId || !selectedSpaceId || !prompt.trim()) return;
    setStatus("queued");
    try {
      const response = await api.generateReport(
        selectedTableId,
        selectedSpaceId,
        prompt,
      );
      if (response.task_id) {
        setTaskId(response.task_id);
      } else {
        throw new Error("Task ID не получен");
      }
    } catch (error) {
      console.error("Ошибка генерации:", error);
      setStatus("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#19191C]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500">
              <FileBarChart size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">AI-Аналитик</h3>
              <p className="text-xs text-gray-500 font-medium">
                Генерация отчета по таблице
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={status !== "idle" && status !== "error"}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 bg-gray-50/50">
          {status === "idle" || status === "error" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Пространство
                </label>
                <select
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-300 shadow-sm"
                >
                  {/* Защита рендера */}
                  {(spaces || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Таблица данных
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-300 shadow-sm"
                >
                  {(!tables || tables.length === 0) && (
                    <option value="">Нет таблиц</option>
                  )}
                  {(tables || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Что проанализировать?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Например: Составь список просроченных задач и сгруппируй их по исполнителям..."
                  className="w-full h-24 p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-300 resize-none shadow-sm"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-red-500 font-medium text-center">
                  Ошибка генерации. Попробуйте еще раз.
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={!selectedTableId || !prompt.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileBarChart size={16} /> Создать отчет
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              {status === "completed" ? (
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center animate-in zoom-in">
                  <CheckCircle2 size={32} />
                </div>
              ) : (
                <Loader2 size={40} className="animate-spin text-purple-600" />
              )}
              <div className="text-center">
                <h4 className="font-bold text-gray-900 text-lg">
                  {status === "queued" && "Подготовка данных..."}
                  {status === "processing" && "ИИ анализирует таблицу..."}
                  {status === "completed" && "Отчет готов!"}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {status !== "completed"
                    ? "Аналитика занимает немного времени."
                    : "Открываем результаты..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
