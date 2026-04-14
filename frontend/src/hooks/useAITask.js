import { useState } from "react";
import { api } from "../services/api";

export function useAITask() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskStatus, setTaskStatus] = useState("");

  const runTask = async (startTaskPromise, onSuccess) => {
    setIsProcessing(true);
    setTaskStatus("Запуск ИИ...");

    try {
      // 1. Отправляем промпт, получаем ID задачи
      const response = await startTaskPromise();
      const taskId = response.task_id;

      if (!taskId) throw new Error("task_id не получен");

      // 2. Запускаем цикл опроса (Polling) каждые 2 секунды
      const pollInterval = setInterval(async () => {
        try {
          const statusData = await api.checkTaskStatus(taskId);

          if (statusData.status === "completed") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setTaskStatus("Готово!");
            if (onSuccess) onSuccess(statusData.result);
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setTaskStatus("Ошибка при генерации");
            console.error("Ошибка задачи Celery:", statusData.error);
          } else {
            // Статусы pending или processing
            setTaskStatus("ИИ думает... 🧠");
          }
        } catch (pollError) {
          console.error("Ошибка поллинга:", pollError);
        }
      }, 2000);
    } catch (error) {
      console.error("Ошибка старта задачи:", error);
      setIsProcessing(false);
      setTaskStatus("Ошибка сети");
    }
  };

  return { runTask, isProcessing, taskStatus };
}
