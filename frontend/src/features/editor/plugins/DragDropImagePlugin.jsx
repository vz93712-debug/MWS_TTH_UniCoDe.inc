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
    return editor.registerCommand(
      DROP_COMMAND,
      (event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          const file = files[0];

          if (!file.type.startsWith("image/")) return false;
          event.preventDefault();

          let imageNodeKey;
          editor.update(() => {
            const imageNode = $createImageNode("loading", file.name);
            $insertNodes([imageNode]);
            imageNodeKey = imageNode.getKey();
          });

          // ⚠️ ВАЖНО ДЛЯ YJS:
          // При переходе на мультиплеер URL.createObjectURL(file) вызовет рассинхрон,
          // так как blob-ссылка работает только локально.
          // Здесь нужно будет сделать formData.append('file', file)
          // и отправить реальный POST-запрос на Django, а в setSrc() передать вернувшийся публичный URL.
          setTimeout(() => {
            const localPreviewUrl = URL.createObjectURL(file);
            editor.update(() => {
              const node = $getNodeByKey(imageNodeKey);
              if (node) {
                node.setSrc(localPreviewUrl);
              }
            });
          }, 2000);

          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}
