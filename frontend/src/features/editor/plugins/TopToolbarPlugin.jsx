import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";
import {
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { TopToolbar } from "../../../components/blocks/Toolbars/TopToolbar"; // Путь до UI-компонента

const LowPriority = 1;

export function TopToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [formats, setFormats] = useState({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
  });

  // Функция, которая проверяет, какой текст сейчас выделен
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setFormats({
        isBold: selection.hasFormat("bold"),
        isItalic: selection.hasFormat("italic"),
        isUnderline: selection.hasFormat("underline"),
        isStrikethrough: selection.hasFormat("strikethrough"),
      });
    }
  }, []);

  // Вешаем слушатель на изменение выделения (когда юзер водит мышкой по тексту)
  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        LowPriority,
      ),
    );
  }, [editor, updateToolbar]);

  // Функция отправки команд форматирования в ядро
  const handleFormat = (formatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatType);
  };

  return <TopToolbar formats={formats} onFormat={handleFormat} />;
}
