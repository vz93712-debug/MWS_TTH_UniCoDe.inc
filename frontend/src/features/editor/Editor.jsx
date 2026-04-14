import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
// ДОБАВЛЯЕМ ПЛАГИНЫ ДЛЯ ССЫЛОК:
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";

// Наши кастомные элементы
import { editorTheme } from "./theme";
import { MwsTableNode } from "./nodes/MwsTableNode";
import { ImageNode } from "./nodes/ImageNode";

// Наши плагины
import { DragDropImagePlugin } from "./plugins/DragDropImagePlugin";
import { SlashMenuPlugin } from "./plugins/SlashMenuPlugin";
import { CodeHighlightPlugin } from "./plugins/CodeHighlightPlugin";
import { TopToolbarPlugin } from "./plugins/TopToolbarPlugin";
import { FloatingToolbarPlugin } from "./plugins/FloatingToolbarPlugin";

const editorConfig = {
  namespace: "WikiLiveEditor",
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    AutoLinkNode,
    MwsTableNode,
    ImageNode,
  ],
  onError(error) {
    console.error("Lexical Error:", error);
  },
  theme: editorTheme,
};

export default function Editor() {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="flex flex-col h-full bg-white">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 shadow-sm">
          <TopToolbarPlugin />
        </div>

        <div className="flex-1 overflow-y-auto pb-32 pt-12 px-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-[900px] mx-auto w-full relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="outline-none min-h-[500px] text-base text-gray-800 leading-relaxed font-sans" />
              }
              placeholder={
                <div className="absolute top-0 left-0 text-gray-400 pointer-events-none text-base font-sans select-none">
                  Начните писать текст или используйте Markdown (# для
                  заголовка)...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <FloatingToolbarPlugin />
          </div>
        </div>
      </div>

      <HistoryPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <ListPlugin />
      <CheckListPlugin />

      {/* ИНИЦИАЛИЗАЦИЯ ССЫЛОК */}
      <LinkPlugin />
      <ClickableLinkPlugin />

      <SlashMenuPlugin />
      <DragDropImagePlugin />
      <CodeHighlightPlugin />
    </LexicalComposer>
  );
}
