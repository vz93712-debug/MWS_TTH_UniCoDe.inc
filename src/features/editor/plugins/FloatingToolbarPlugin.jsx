import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link as LinkIcon,
} from "lucide-react";

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const [isTextSelected, setIsTextSelected] = useState(false);
  const [pos, setPos] = useState({ top: -1000, left: -1000 });

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      // Базовые проверки на существование элементов
      if (nativeSelection === null || rootElement === null) {
        setIsTextSelected(false);
        return;
      }

      // Главная проверка: выделен ли текст?
      if (
        !$isRangeSelection(selection) ||
        selection.isCollapsed() ||
        selection.getTextContent().trim() === "" // Игнорируем выделение из одних пробелов
      ) {
        setIsTextSelected(false);
        return;
      }

      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      const domRange = nativeSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();

      const newPos = {
        top: rect.top - 55, // Чуть выше над текстом
        left: rect.left + rect.width / 2 - 105,
      };

      console.log("✅ Текст выделен! Координаты тулбара:", newPos);
      setPos(newPos);
      setIsTextSelected(true);
    });
  }, [editor]);

  useEffect(() => {
    // 1. Слушаем команды выделения от самого Lexical (надежный способ)
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    // 2. Слушаем любые обновления стейта (например, когда мы нажали BOLD и стейт обновился)
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => updateToolbar());
    });
  }, [editor, updateToolbar]);

  const insertLink = useCallback(() => {
    const url = window.prompt("Введите URL ссылки:", "https://");
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  }, [editor]);

  if (!isTextSelected) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "6px",
        backgroundColor: "#111827",
        border: "1px solid #374151",
        borderRadius: "8px",
        color: "#ffffff",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        pointerEvents: "auto",
      }}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={`p-1.5 rounded hover:bg-gray-700 ${isBold ? "bg-gray-700 text-blue-400" : "text-gray-300"}`}
      >
        <Bold size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={`p-1.5 rounded hover:bg-gray-700 ${isItalic ? "bg-gray-700 text-blue-400" : "text-gray-300"}`}
      >
        <Italic size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className={`p-1.5 rounded hover:bg-gray-700 ${isUnderline ? "bg-gray-700 text-blue-400" : "text-gray-300"}`}
      >
        <Underline size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
        className={`p-1.5 rounded hover:bg-gray-700 ${isStrikethrough ? "bg-gray-700 text-blue-400" : "text-gray-300"}`}
      >
        <Strikethrough size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        className={`p-1.5 rounded hover:bg-gray-700 ${isCode ? "bg-gray-700 text-blue-400" : "text-gray-300"}`}
      >
        <Code size={18} />
      </button>

      <div
        style={{
          width: "1px",
          height: "20px",
          backgroundColor: "#374151",
          margin: "0 4px",
        }}
      ></div>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertLink}
        className="p-1.5 rounded hover:bg-gray-700 text-gray-300"
      >
        <LinkIcon size={18} />
      </button>
    </div>,
    document.body,
  );
}
