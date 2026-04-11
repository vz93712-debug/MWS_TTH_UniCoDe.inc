export const editorTheme = {
  paragraph: "mb-4 text-gray-800 leading-relaxed",
  heading: {
    h1: "text-3xl font-bold mb-4 mt-6 text-gray-900",
    h2: "text-2xl font-semibold mb-3 mt-5 text-gray-900",
    h3: "text-xl font-medium mb-2 mt-4 text-gray-900",
  },
  list: {
    ul: "list-disc list-inside mb-4 ml-2",
    ol: "list-decimal list-inside mb-4 ml-2",
    listitem: "mb-1",
  },
  quote:
    "border-l-4 border-primary pl-4 italic text-gray-600 mb-4 bg-surface-muted py-2",

  // 1. Стили для инлайн-форматирования (из Плавающего Тулбара)
  text: {
    bold: "font-bold text-gray-900",
    italic: "italic",
    underline: "underline underline-offset-4",
    strikethrough: "line-through text-gray-500",
    underlineStrikethrough: "underline line-through",
    // Инлайн-код (короткие фрагменты в тексте)
    code: "bg-gray-100 text-red-500 font-mono text-[13px] px-1.5 py-0.5 rounded-md border border-gray-200",
  },

  // 2. Стили для больших Блоков Кода
  code: "bg-gray-900 text-gray-100 font-mono text-[13px] p-4 rounded-lg block my-4 shadow-inner relative whitespace-pre-wrap break-words tab-size-2",
  // 3. Подсветка синтаксиса (цветовая схема в стиле One Dark / VS Code)
  codeHighlight: {
    atrule: "text-blue-400",
    attr: "text-blue-400",
    boolean: "text-pink-400",
    builtin: "text-green-400",
    cdata: "text-gray-500 italic",
    char: "text-yellow-300",
    class: "text-blue-400",
    "class-name": "text-yellow-400",
    comment: "text-gray-500 italic",
    constant: "text-pink-400",
    deleted: "text-red-400",
    doctype: "text-gray-500 italic",
    entity: "text-yellow-400",
    function: "text-yellow-300",
    important: "text-pink-400",
    inserted: "text-green-400",
    keyword: "text-pink-400",
    namespace: "text-blue-400",
    number: "text-orange-400",
    operator: "text-cyan-400",
    prolog: "text-gray-500 italic",
    property: "text-blue-400",
    punctuation: "text-gray-400",
    regex: "text-red-400",
    selector: "text-green-400",
    string: "text-green-400",
    symbol: "text-cyan-400",
    tag: "text-pink-400",
    url: "text-cyan-400",
    variable: "text-orange-400",
  },
};
