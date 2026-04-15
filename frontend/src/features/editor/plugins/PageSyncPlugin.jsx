import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState, useRef } from "react";
import { api } from "../../../services/api";

export function PageSyncPlugin({ pageId }) {
  const [editor] = useLexicalComposerContext();
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const isFirstUpdate = useRef(true);

  // 1. ЗАГРУЗКА ДАННЫХ (ОТКЛЮЧЕНО ДЛЯ СОВМЕСТИМОСТИ С YJS)
  useEffect(() => {
    if (!pageId) return;

    let isMounted = true;
    setIsLoaded(false);

    const fetchPage = async () => {
      try {
        const pageData = await api.getPage(pageId);

        if (isMounted && pageData.content) {
          console.log(
            "Страница найдена, но загрузка передана Yjs (WebSockets)",
          );
          // ВАЖНО: Закомментировали, чтобы избежать ошибки `splice: could not find collab element node`
          // const initialEditorState = editor.parseEditorState(pageData.content);
          // editor.setEditorState(initialEditorState);
        }
      } catch (error) {
        console.error("Ошибка проверки страницы:", error);
      } finally {
        if (isMounted) {
          setIsLoaded(true);
          isFirstUpdate.current = true;
        }
      }
    };

    fetchPage();

    return () => {
      isMounted = false;
    };
  }, [pageId, editor]);

  // 2. АВТОСОХРАНЕНИЕ ПРИ ИЗМЕНЕНИИ (ОСТАВЛЯЕМ РАБОТАТЬ)
  useEffect(() => {
    if (!isLoaded || !pageId) return;

    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        if (isFirstUpdate.current) {
          isFirstUpdate.current = false;
          return;
        }

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(async () => {
          try {
            const jsonState = editorState.toJSON();
            await api.updatePage(pageId, jsonState);
            console.log("💾 Автосохранение прошло успешно:", pageId);
          } catch (error) {
            console.error("❌ Ошибка автосохранения:", error);
          }
        }, 1000);
      },
    );
  }, [editor, pageId, isLoaded]);

  return null;
}
