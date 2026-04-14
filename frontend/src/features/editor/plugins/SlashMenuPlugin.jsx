import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  $createTextNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { $createMwsTableNode } from "../nodes/MwsTableNode";
import { SlashMenu } from "../../../components/blocks/Popovers/SlashMenu";

const INSERT_MWS_TABLE_COMMAND = createCommand("INSERT_MWS_TABLE_COMMAND");

export function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/") {
        setTimeout(() => {
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // УМНОЕ ПОЗИЦИОНИРОВАНИЕ
            const menuHeight = 350; // Примерная максимальная высота меню
            const spaceBelow = window.innerHeight - rect.bottom;

            let yPos = rect.bottom + window.scrollY + 10;

            // Если внизу мало места, открываем меню ВВЕРХ
            if (spaceBelow < menuHeight) {
              yPos = Math.max(10, rect.top + window.scrollY - menuHeight - 10);
            }

            setCoords({
              x: rect.left,
              y: yPos,
            });
            setIsOpen(true);
          }
        }, 50);
      }

      if (isOpen && (e.key === "Escape" || e.key === "Enter")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_MWS_TABLE_COMMAND,
      (payload) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const tableNode = $createMwsTableNode(payload.tableId);
            selection.insertNodes([tableNode, $createTextNode("")]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_NORMAL,
    );
  }, [editor]);

  const handleSelect = useCallback(
    (itemId) => {
      editor.focus();
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          selection.modify("extend", "backward", "character");
          selection.removeText();

          try {
            switch (itemId) {
              case "h1":
                $setBlocksType(selection, () => $createHeadingNode("h1"));
                break;
              case "h2":
                $setBlocksType(selection, () => $createHeadingNode("h2"));
                break;
              case "h3":
                $setBlocksType(selection, () => $createHeadingNode("h3"));
                break;
              case "quote":
                $setBlocksType(selection, () => $createQuoteNode());
                break;
              case "code":
                $setBlocksType(selection, () => $createCodeNode());
                break;
              case "ul":
                editor.dispatchCommand(
                  INSERT_UNORDERED_LIST_COMMAND,
                  undefined,
                );
                break;
              case "ol":
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
                break;
              case "check":
                editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
                break;
              case "mws-table":
              case "table":
                editor.dispatchCommand(INSERT_MWS_TABLE_COMMAND, {
                  tableId: `mws-${Date.now()}`,
                });
                break;
              default:
                break;
            }
          } catch (err) {
            console.error("Ошибка вставки блока:", err);
          }
        }
      });
      setIsOpen(false);
    },
    [editor],
  );

  return (
    <SlashMenu
      isOpen={isOpen}
      x={coords.x}
      y={coords.y}
      onClose={() => setIsOpen(false)}
      onSelect={handleSelect}
    />
  );
}
