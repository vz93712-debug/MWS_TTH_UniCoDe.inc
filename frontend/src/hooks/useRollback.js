import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { api } from "../services/api";

export function useRollback(pageId) {
  const [editor] = useLexicalComposerContext();

  const rollbackToVersion = async (versionId) => {
    try {
      // Запрашиваем старую версию с бэкенда
      const versionData = await api.getVersionDetail(pageId, versionId);
      const oldLexicalJson = versionData.content;

      // Принудительно меняем состояние редактора
      const editorState = editor.parseEditorState(oldLexicalJson);
      editor.setEditorState(editorState);

      alert(
        "Версия успешно восстановлена! Изменения отправлены всем участникам.",
      );
    } catch (error) {
      console.error("Ошибка при откате версии:", error);
      alert("Не удалось восстановить версию.");
    }
  };

  return rollbackToVersion;
}
