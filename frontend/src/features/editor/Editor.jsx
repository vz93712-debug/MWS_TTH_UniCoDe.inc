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

import { editorTheme } from "./theme";
import { MwsTableNode } from "./nodes/MwsTableNode";
import { AutoSavePlugin } from "./plugins/AutoSavePlugin";
import { ImageNode } from "./nodes/ImageNode";
import { DragDropImagePlugin } from "./plugins/DragDropImagePlugin";
import { SlashMenuPlugin } from "./plugins/SlashMenuPlugin";
import { FloatingToolbarPlugin } from "./plugins/FloatingToolbarPlugin";
import { CodeHighlightPlugin } from "./plugins/CodeHighlightPlugin";
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
      <div className="relative w-full h-full min-h-[500px] outline-none">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="outline-none min-h-[400px]" />
          }
          placeholder={
            <div className="absolute top-8 left-8 text-gray-400 pointer-events-none">
              Начните писать текст или используйте Markdown (# для заголовка)...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

        {/* 2. РЕНДЕРИМ ЕГО ВНУТРИ КОМПОЗЕРА */}
        <SlashMenuPlugin />

        <AutoSavePlugin pageId="demo-page-1" />
      </div>
      <SlashMenuPlugin />
      <DragDropImagePlugin /> {/* <--- Плагин загрузки картинок */}
      <AutoSavePlugin pageId="demo-page-1" />
      {/* Наши кастомные плагины */}
      <SlashMenuPlugin />
      <DragDropImagePlugin />
      <FloatingToolbarPlugin /> {/* <--- Тот самый тулбар */}
      <AutoSavePlugin pageId="demo-page-1" />
      <FloatingToolbarPlugin />
      <CodeHighlightPlugin />
      <AutoSavePlugin pageId="demo-page-1" />
    </LexicalComposer>
  );
}
