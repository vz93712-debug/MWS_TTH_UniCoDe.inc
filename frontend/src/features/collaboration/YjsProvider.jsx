import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// Кэшируем провайдеры вне компонента, чтобы React Strict Mode не создавал дубликаты
const providerMap = new Map();

export function YjsProvider({ documentId }) {
  return (
    <CollaborationPlugin
      id={documentId}
      providerFactory={(id, yjsDocMap) => {
        // Если провайдер для этой страницы уже создан — просто возвращаем его
        if (providerMap.has(id)) {
          return providerMap.get(id);
        }

        const doc = new Y.Doc();
        yjsDocMap.set(id, doc);

        const token = localStorage.getItem("access_token") || "";
        const serverUrl = "ws://127.0.0.1:8000/ws/pages";
        const roomName = `${id}/?token=${token}`;

        const provider = new WebsocketProvider(serverUrl, roomName, doc, {
          connect: true,
        });

        provider.on("status", (event) => {
          console.log(`[WebSockets] Статус соединения (${id}):`, event.status);
        });

        // Сохраняем в кэш
        providerMap.set(id, provider);

        return provider;
      }}
      shouldBootstrap={true}
    />
  );
}
