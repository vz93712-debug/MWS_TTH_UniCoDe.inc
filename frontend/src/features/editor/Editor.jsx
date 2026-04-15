import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { CollaborationContext } from "@lexical/react/LexicalCollaborationContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";

import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";

import { editorTheme } from "./theme";
import { MwsTableNode } from "./nodes/MwsTableNode";
import { ImageNode } from "./nodes/ImageNode";
import { DragDropImagePlugin } from "./plugins/DragDropImagePlugin";
import { SlashMenuPlugin } from "./plugins/SlashMenuPlugin";
import { CodeHighlightPlugin } from "./plugins/CodeHighlightPlugin";
import { TopToolbarPlugin } from "./plugins/TopToolbarPlugin";
import { FloatingToolbarPlugin } from "./plugins/FloatingToolbarPlugin";
import { PageSyncPlugin } from "./plugins/PageSyncPlugin";
import { AIFloatingMenuPlugin } from "./plugins/AIFloatingMenuPlugin";
import { YjsProvider } from "../collaboration/YjsProvider";

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
    TableNode,
    TableCellNode,
    TableRowNode,
  ],
  onError(error) {
    console.error("Lexical Error:", error);
  },
  theme: editorTheme,
};

const yjsDocMap = new Map();
const CURSOR_COLORS = ["#FF0032", "#00B4D8", "#00CC66", "#FFB703", "#9D4EDD"];
const myColor = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
const myName = "User " + Math.floor(Math.random() * 100);

export default function Editor({ pageId = "demo-page-123" }) {
  return (
    <CollaborationContext.Provider
      value={{
        isCollabActive: true,
        yjsDocMap: yjsDocMap,
        name: myName,
        color: myColor,
      }}
    >
      <LexicalComposer initialConfig={editorConfig}>
        <div className="flex flex-col h-full bg-white relative">
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
                    Начните писать текст или используйте Markdown (# для заголовка)...
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <FloatingToolbarPlugin />
            </div>
          </div>
        </div>

        <YjsProvider documentId={pageId} />

        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <ListPlugin />
        <CheckListPlugin />
        <TablePlugin />
        <LinkPlugin />
        <ClickableLinkPlugin />
<DragDropImagePlugin />
        <CodeHighlightPlugin />
        <AIFloatingMenuPlugin />
        <PageSyncPlugin pageId={pageId} />
        
        {/* Чистое слэш-меню без пропсов модалки */}
        <SlashMenuPlugin />
        
      </LexicalComposer>
    </CollaborationContext.Provider>
  );
}