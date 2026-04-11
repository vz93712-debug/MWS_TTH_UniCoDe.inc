import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useCallback, useRef } from "react";

export function AutoSavePlugin({ pageId }) {
  const [editor] = useLexicalComposerContext();
  const timeoutRef = useRef(null);

  const saveToBackend = useCallback(
    (jsonState) => {
      // В будущем здесь будет реальный axios.put('/api/pages/...')
      console.log(
        `🚀 [Фоновый PUSH] Сохранено в БД (Mock) для страницы ${pageId}:`,
        jsonState,
      );
    },
    [pageId],
  );

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

        editorState.read(() => {
          const json = editorState.toJSON();

          localStorage.setItem(`wikilive_page_${pageId}`, JSON.stringify(json));

          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            saveToBackend(json);
          }, 2000);
        });
      },
    );

    return () => {
      removeListener();
      clearTimeout(timeoutRef.current);
    };
  }, [editor, pageId, saveToBackend]);

  return null;
}
