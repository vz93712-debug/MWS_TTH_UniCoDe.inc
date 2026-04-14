import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND, $getSelection, $isRangeSelection } from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $patchStyleText } from "@lexical/selection";
import { INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FloatingToolbar } from "../../../components/blocks/Toolbars/FloatingToolbar";

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [pos, setPos] = useState({ top: -1000, left: -1000 });

  const [selectionState, setSelectionState] = useState({
    isBold: false,
    isItalic: false,
    isStrikethrough: false,
    isLink: false,
  });

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSelection = window.getSelection();

      if (
        !$isRangeSelection(selection) ||
        selection.isCollapsed() ||
        selection.getTextContent().trim() === "" ||
        !nativeSelection ||
        nativeSelection.rangeCount === 0
      ) {
        setIsTextSelected(false);
        return;
      }

      setSelectionState({
        isBold: selection.hasFormat("bold"),
        isItalic: selection.hasFormat("italic"),
        isStrikethrough: selection.hasFormat("strikethrough"),
        isLink: selection
          .getNodes()
          .some((node) => $isLinkNode(node.getParent() || node)),
      });

      const domRange = nativeSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();

      setPos({
        top: rect.top - 60 + window.scrollY,
        left: rect.left + rect.width / 2,
      });
      setIsTextSelected(true);
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => updateToolbar());
    });
  }, [editor, updateToolbar]);

  const handleAction = (action, value) => {
    if (action === "bold") editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
    if (action === "italic")
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    if (action === "strikethrough")
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");

    if (action === "fontFamily") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection))
          $patchStyleText(selection, { "font-family": value });
      });
    }

    if (action === "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }

    if (action === "link") {
      // Если передали null или пустоту — удаляем ссылку
      if (!value) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      } else {
        // Умная обработка URL (добавляем https:// если юзер забыл)
        let parsedUrl = value;
        if (
          !parsedUrl.startsWith("http://") &&
          !parsedUrl.startsWith("https://")
        ) {
          parsedUrl = "https://" + parsedUrl;
        }
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, parsedUrl);
      }
    }
  };

  if (!isTextSelected) return null;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        transform: "translateX(-50%)",
        zIndex: 50,
      }}
    >
      <FloatingToolbar
        selectionState={selectionState}
        onAction={handleAction}
      />
    </div>,
    document.body,
  );
}
