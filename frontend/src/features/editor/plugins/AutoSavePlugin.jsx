import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useDebounce } from "../../hooks/useDebounce"; // Подключаем наш новый хук

export function AutoSavePlugin({ pageId }) {
  const [editor] = useLexicalComposerContext();

  // Логика сохранения в БД
  const saveToBackend = useCallback(
    async (jsonState) => {
      if (!pageId) return;
      try {
        await api.updatePage(pageId, jsonState);
        console.log(`[AutoSave] Страница ${pageId} сохранена.`);
      } catch (error) {
        console.error(`[AutoSave] Ошибка:`, error);
      }
    },
    [pageId],
  );

  // Оборачиваем сохранение в наш красивый хук (задержка 2 секунды)
  const debouncedSave = useDebounce(saveToBackend, 2000);

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

        editorState.read(() => {
          const json = editorState.toJSON();
          localStorage.setItem(`wikilive_page_${pageId}`, JSON.stringify(json));

          // Вызываем дебаунс-функцию
          debouncedSave(json);
        });
      },
    );

    return () => removeListener();
  }, [editor, pageId, debouncedSave]);

  return null;
}
