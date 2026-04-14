import { useState, useEffect } from "react";
import Editor from "../../features/editor/Editor";

import { CommentsDrawer } from "../../components/blocks/Drawers/CommentsDrawer";
import { HistoryDrawer } from "../../components/blocks/Drawers/HistoryDrawer";

export function EditorPage({ children }) {
  // Стейты для панелей
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Слушаем события от кнопок из Lexical TopToolbar
  useEffect(() => {
    const openComments = () => setIsCommentsOpen(true);
    const openHistory = () => setIsHistoryOpen(true);

    document.addEventListener("OPEN_COMMENTS", openComments);
    document.addEventListener("OPEN_HISTORY", openHistory);

    return () => {
      document.removeEventListener("OPEN_COMMENTS", openComments);
      document.removeEventListener("OPEN_HISTORY", openHistory);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white relative font-sans w-full overflow-hidden">
      {/* ГЛАВНЫЙ РЕДАКТОР */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <Editor />
        <div className="hidden">{children}</div>
      </div>

      {/* ВЫДВИЖНЫЕ ПАНЕЛИ (Справа) */}
      <CommentsDrawer
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      />
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* OVERLAY (затемнение фона). Закрывает панели по клику вне их зоны */}
      {(isCommentsOpen || isHistoryOpen) && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/5 backdrop-blur-[1px] transition-all"
          onClick={() => {
            setIsCommentsOpen(false);
            setIsHistoryOpen(false);
          }}
        />
      )}
    </div>
  );
}
