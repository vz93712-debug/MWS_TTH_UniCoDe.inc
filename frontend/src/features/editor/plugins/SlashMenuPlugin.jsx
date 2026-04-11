import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom"; // <--- Добавь эту строку
// 1. Класс для опций нашего меню
class SlashOption extends MenuOption {
  constructor(title, icon, onSelect) {
    super(title);
    this.title = title;
    this.icon = icon;
    this.onSelect = onSelect;
  }
}

export function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState(null);

  // 2. Определяем список доступных команд (Итерация 5 из спеки)
  const options = useMemo(() => {
    const baseOptions = [
      new SlashOption("Заголовок 1", "H1", () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode("h1"));
          }
        });
      }),
      new SlashOption("Заголовок 2", "H2", () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode("h2"));
          }
        });
      }),
      new SlashOption("Цитата", "💬", () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode());
          }
        });
      }),
      new SlashOption("Таблица MWS", "📊", () => {
        // Здесь мы позже вызовем модалку выбора таблицы (Итерация 4)
        alert("Тут откроется модалка для выбора таблицы из базы!");
        // editor.dispatchCommand(INSERT_MWS_TABLE_COMMAND, undefined);
      }),
    ];

    // Простая фильтрация по введенному тексту после '/'
    return queryString
      ? baseOptions.filter((option) =>
          option.title.toLowerCase().includes(queryString.toLowerCase()),
        )
      : baseOptions;
  }, [editor, queryString]);

  const onSelectOption = useCallback(
    (selectedOption, nodeToRemove, closeMenu) => {
      editor.update(() => {
        // Удаляем сам слэш и текст запроса
        if (nodeToRemove) {
          nodeToRemove.remove();
        }
        // Выполняем действие выбранной опции
        selectedOption.onSelect();
      });
      closeMenu();
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={(text) => {
        // Регулярка ловит ввод '/', после которого идет текст
        const regex = /(^|\s)\/([a-zA-Zа-яА-Я0-9_]*)$/;
        const match = regex.exec(text);
        if (match !== null) {
          return {
            leadOffset: match.index + match[1].length,
            matchingString: match[2],
            replaceableString: match[2],
          };
        }
        return null;
      }}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        // Если нет якоря (курсора) или опций — ничего не рендерим
        if (anchorElementRef.current == null || options.length === 0) {
          return null;
        }

        return createPortal(
          <div className="absolute z-50 w-64 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden flex flex-col p-1">
            {options.map((option, i) => (
              <button
                key={option.key}
                className={`flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                  selectedIndex === i
                    ? "bg-primary-50 text-primary font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                tabIndex={-1}
                ref={(el) => {
                  if (el && selectedIndex === i) {
                    el.scrollIntoView({ block: "nearest" });
                  }
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
                onClick={() => selectOptionAndCleanUp(option)}
              >
                <span className="text-gray-400 w-6 text-center">
                  {option.icon}
                </span>
                {option.title}
              </button>
            ))}
          </div>,
          anchorElementRef.current, // Привязываем к координатам курсора
        );
      }}
    />
  );
}
