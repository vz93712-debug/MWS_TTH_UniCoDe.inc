import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import {
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  $insertNodes,
  $getNodeByKey,
} from "lexical";
import { $createImageNode } from "../nodes/ImageNode";
export function DragDropImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Регистрируем слушатель события DROP (когда пользователь бросил файл)
    return editor.registerCommand(
      DROP_COMMAND,
      (event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          const file = files[0];

          // Проверяем, что это картинка
          if (!file.type.startsWith("image/")) return false;

          event.preventDefault();

          // 1. Создаем узел в состоянии "loading" и вставляем в документ
          let imageNodeKey;
          editor.update(() => {
            const imageNode = $createImageNode("loading", file.name);
            $insertNodes([imageNode]);
            imageNodeKey = imageNode.getKey(); // Запоминаем ключ, чтобы потом обновить этот конкретный узел
          });

          // 2. Имитируем загрузку на бэкенд (2 секунды)
          setTimeout(() => {
            // В реальности тут будет URL ответа от Django (S3 / MWS Object Storage)
            // Для локального теста мы просто создаем временную ссылку в памяти браузера
            const localPreviewUrl = URL.createObjectURL(file);

            // Стало (правильный Lexical-путь)
            editor.update(() => {
              const node = $getNodeByKey(imageNodeKey);
              if (node) {
                node.setSrc(localPreviewUrl);
              }
            });
            console.log("✅ Файл успешно загружен на MWS-сервер (mock)");
          }, 2000);

          return true; // Команда перехвачена, стандартное поведение браузера отменяется
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}
