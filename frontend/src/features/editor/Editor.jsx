import { LexicalComposer } from "@lexical/react/LexicalComposer";
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

// ================= ВАЖНО: ИМПОРТЫ МУЛЬТИПЛЕЕРА =================
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
// ===============================================================

// Наши кастомные элементы
import { editorTheme } from "./theme";
import { MwsTableNode } from "./nodes/MwsTableNode";
import { ImageNode } from "./nodes/ImageNode";
import { useState } from "react";
import { MwsSelectorModal } from "../../components/blocks/Modals/MwsSelectorModal";
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

// Передаем pageId в пропсы (по умолчанию тестовая страница)
export default function Editor({ pageId = "demo-page-123" }) {
  // === СТЕЙТ ДЛЯ МОДАЛКИ MWS ===
  const [isMwsModalOpen, setIsMwsModalOpen] = useState(false);

  // НАСТРОЙКА ПОДКЛЮЧЕНИЯ К DJANGO CHANNELS
  const providerFactory = (id, yjsDocMap) => {
    const doc = new Y.Doc();
    yjsDocMap.set(id, doc);

    // TODO: В будущем здесь будет реальный токен из LocalStorage / Context
    const token = "dummy_jwt_token_here";

    // Формируем URL для подключения.
    // y-websocket под капотом склеивает serverUrl + '/' + roomName.
    // Чтобы попасть точно в твой Django-роутинг, мы разбиваем путь так:
    const wsServerUrl = "ws://localhost:8000";
    const roomName = `ws/pages/${id}/?token=${token}`;

    const provider = new WebsocketProvider(wsServerUrl, roomName, doc, {
      connect: true,
    });

    // Настройка онлайн-курсора (Awareness)
    // Эти данные полетят по сокетам всем остальным пользователям на странице
    provider.awareness.setLocalStateField("user", {
      name: "Ксения",
      color: "#FF0032", // Тот самый фирменный красный
    });

    // Для отладки сокетов
    provider.on("status", (event) => {
      console.log(`WebSocket Status [${id}]:`, event.status);
    });

    return provider;
  };

  return (
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

      {/* МУЛЬТИПЛЕЕР (Заменяет стандартный HistoryPlugin) */}
      <CollaborationPlugin
        id={pageId}
        providerFactory={providerFactory}
        shouldBootstrap={true}
        username="Ксения"
      />

      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <ClickableLinkPlugin />

      {/* ПРОКИДЫВАЕМ ФУНКЦИЮ В СЛЭШ-МЕНЮ */}
      <SlashMenuPlugin openMwsModal={() => setIsMwsModalOpen(true)} />

      <DragDropImagePlugin />
      <CodeHighlightPlugin />

      {/* МОДАЛКА ВЫБОРА ТАБЛИЦЫ MWS */}
      <MwsSelectorModal
        isOpen={isMwsModalOpen}
        onClose={() => setIsMwsModalOpen(false)}
        onSelectTable={(tableId, tableName) => {
          console.log("Вставляем таблицу MWS:", tableId, tableName);
          alert(`Скоро тут вставится таблица: ${tableName}`);
        }}
      />
    </LexicalComposer>
  );
}
