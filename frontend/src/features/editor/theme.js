export const editorTheme = {
  paragraph: "mb-4 text-gray-800 leading-relaxed",
  heading: {
    // Используем font-wide для заголовков согласно фирменному стилю
    h1: "text-3xl font-wide font-bold mb-4 mt-6 text-gray-900",
    h2: "text-2xl font-wide font-semibold mb-3 mt-5 text-gray-900",
    h3: "text-xl font-wide font-medium mb-2 mt-4 text-gray-900",
  },
  list: {
    ul: "lexical-ul mb-4 ml-2",
    ol: "list-decimal list-inside mb-4 ml-2",
    listitem: "mb-1",
    checkList: "lexical-check-list list-none mb-4 ml-2",
    nested: {
      listitem: "list-none",
    },
  },

  listItemChecked:
    "lexical-listItemChecked font-medium line-through text-gray-400",
  listItemUnchecked: "lexical-listItemUnchecked",

  // Исправлено: используем правильный красный для границы цитаты, если это необходимо,
  // либо оставляем нейтральный серый для читаемости
  quote:
    "border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4 bg-gray-50 py-2",

  // ВАЖНО: Добавлена стилизация ссылок
  // Используем точный оттенок #FF0032
  link: "text-[#FF0032] underline underline-offset-4 cursor-pointer hover:opacity-80 transition-all",

  text: {
    bold: "font-bold text-gray-900",
    italic: "italic",
    underline: "underline underline-offset-4",
    strikethrough: "line-through text-gray-500",
    underlineStrikethrough: "underline line-through",
    // Заменяем стандартный красный в инлайновом коде на фирменный #FF0032
    code: "bg-gray-100 text-[#FF0032] font-mono text-[13px] px-1.5 py-0.5 rounded-md border border-gray-200",
  },

  code: "bg-gray-900 text-gray-100 font-mono text-[13px] p-4 rounded-lg block my-4 shadow-inner relative whitespace-pre-wrap break-words tab-size-2",

  codeHighlight: {
    atrule: "text-blue-400",
    attr: "text-blue-400",
    boolean: "text-pink-400",
    builtin: "text-green-400",
    keyword: "text-pink-400",
    number: "text-orange-400",
    operator: "text-cyan-400",
    punctuation: "text-gray-400",
    string: "text-green-400",
    function: "text-yellow-300",
  },
};
