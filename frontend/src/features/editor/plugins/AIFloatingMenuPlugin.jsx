import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  Sparkles,
  Wand2,
  Scissors,
  Briefcase,
  Expand,
  Loader2,
} from "lucide-react";
import { api } from "../../../services/api";

const ACTIONS = [
  { id: "fix", icon: Wand2, label: "Исправить" },
  { id: "shorten", icon: Scissors, label: "Сократить" },
  { id: "formalize", icon: Briefcase, label: "Официально" },
  { id: "expand", icon: Expand, label: "Расширить" },
];

export function AIFloatingMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");

  // Состояния для ИИ
  const [isProcessing, setIsProcessing] = useState(false);
  const taskIntervalRef = useRef(null);

  const updateMenuPosition = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSelection = window.getSelection();

      if (
        $isRangeSelection(selection) &&
        !selection.isCollapsed() &&
        nativeSelection.rangeCount > 0
      ) {
        const domRange = nativeSelection.getRangeAt(0);
        const rect = domRange.getBoundingClientRect();

        // Позиционируем меню ровно над выделенным текстом по центру
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY - 10,
        });
        setSelectedText(selection.getTextContent());
        setShowMenu(true);
      } else {
        if (!isProcessing) {
          setShowMenu(false);
        }
      }
    });
  }, [editor, isProcessing]);

  useEffect(() => {
    // Слушаем изменения выделения (когда юзер водит мышкой)
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateMenuPosition();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, updateMenuPosition]);

  // Запуск задачи и поллинга
  const handleAction = async (actionId) => {
    if (!selectedText.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      // 1. Отправляем текст ИИ
      const response = await api.editText(selectedText, actionId);

      if (!response.task_id) throw new Error("Нет task_id");

      // 2. Начинаем поллинг статуса
      taskIntervalRef.current = setInterval(async () => {
        try {
          const result = await api.checkTaskStatus(response.task_id);

          if (result.status === "completed") {
            clearInterval(taskIntervalRef.current);
            replaceTextWithAI(result.data.result);
          } else if (result.status === "failed") {
            clearInterval(taskIntervalRef.current);
            console.error("AI Error:", result.error);
            resetState();
          }
        } catch (err) {
          console.error("Ошибка опроса ИИ:", err);
          clearInterval(taskIntervalRef.current);
          resetState();
        }
      }, 2000); // Опрашиваем каждые 2 секунды
    } catch (error) {
      console.error("Ошибка старта AI-редактирования:", error);
      resetState();
    }
  };

  // Замена текста в редакторе
  const replaceTextWithAI = (newText) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(newText);
      }
    });
    resetState();
  };

  const resetState = () => {
    setIsProcessing(false);
    setShowMenu(false);
  };

  if (!showMenu) return null;

  return (
    <div
      className="absolute z-50 flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl shadow-lg -translate-x-1/2 -translate-y-full transition-all duration-200"
      style={{ left: position.x, top: position.y }}
    >
      {isProcessing ? (
        <div className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-[#FF0032]">
          <Loader2 size={16} className="animate-spin" />
          <span>ИИ обрабатывает текст...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center px-2 border-r border-gray-100 text-[#FF0032]">
            <Sparkles size={16} />
          </div>
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              <action.icon size={14} />
              {action.label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
