import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState, useRef } from "react";
import { api } from "../../../services/api";

export function PageSyncPlugin({ pageId }) {
  const [editor] = useLexicalComposerContext();
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const isFirstUpdate = useRef(true); // Чтобы не сохранять при первоначальной загрузке

  // 1. ЗАГРУЗКА ДАННЫХ ПРИ СМЕНЕ СТРАНИЦЫ
  useEffect(() => {
    if (!pageId) return;

    let isMounted = true;
    setIsLoaded(false);

    const fetchPage = async () => {
      try {
        const pageData = await api.getPage(pageId);

        if (isMounted && pageData.content) {
          // Если бэк вернул контент, парсим его в Lexical
          const initialEditorState = editor.parseEditorState(pageData.content);
          editor.setEditorState(initialEditorState);
        } else if (isMounted) {
          // Если контента нет, очищаем редактор
          editor.update(() => {
            const root = editor.getRoot();
            root.clear();
          });
        }
      } catch (error) {
        console.error("Ошибка загрузки страницы:", error);
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

  // 2. АВТОСОХРАНЕНИЕ ПРИ ИЗМЕНЕНИИ
  useEffect(() => {
    if (!isLoaded || !pageId) return;

    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        // Игнорируем обновления, если ничего не изменилось или это первый рендер после загрузки
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        if (isFirstUpdate.current) {
          isFirstUpdate.current = false;
          return;
        }

        // Сбрасываем таймер, если пользователь продолжает печатать
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        // Ждем 1 секунду тишины и сохраняем
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
