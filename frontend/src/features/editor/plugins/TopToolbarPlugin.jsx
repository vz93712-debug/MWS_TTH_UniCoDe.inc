import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";
import {
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isRangeSelection,
  UNDO_COMMAND,
  REDO_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { $setBlocksType, $patchStyleText } from "@lexical/selection";
import { $createHeadingNode } from "@lexical/rich-text";
import { TopToolbar } from "../../../components/blocks/Toolbars/TopToolbar";

export function TopToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [formats, setFormats] = useState({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
  });

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

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateToolbar());
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updateToolbar]);

  // Функция для применения кастомных стилей (шрифты, цвета, размеры)
  const applyStyleText = (styles) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, styles);
      }
    });
  };

  const handleFormat = (action, value = null) => {
    // 1. История (Undo/Redo)
    if (action === "undo") editor.dispatchCommand(UNDO_COMMAND, undefined);
    if (action === "redo") editor.dispatchCommand(REDO_COMMAND, undefined);

    // 2. Базовое форматирование
    if (action === "bold") editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
    if (action === "italic")
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    if (action === "underline")
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
    if (action === "strikethrough")
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");

    // 3. Цвета и Шрифты
    if (action === "fontFamily") applyStyleText({ "font-family": value });
    if (action === "fontSize") applyStyleText({ "font-size": value });
    if (action === "fontColor") applyStyleText({ color: value });
    if (action === "bgColor") applyStyleText({ "background-color": value });

    // 4. Очистка стилей (Сброс)
    if (action === "clear") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            color: null,
            "background-color": null,
            "font-family": null,
            "font-size": null,
          });
          selection.getNodes().forEach((node) => {
            if (node.setFormat) node.setFormat(0);
          });
        }
      });
    }

    // 5. Заголовки (H1, H2, H3)
    if (["h1", "h2", "h3"].includes(action)) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(action));
        }
      });
    }
  };

  return <TopToolbar formats={formats} onFormat={handleFormat} />;
}
