import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function YjsProvider({ documentId = "hackathon-demo-room" }) {
  return (
    <CollaborationPlugin
      id={documentId}
      providerFactory={(id, yjsDocMap) => {
        const doc = new Y.Doc();
        yjsDocMap.set(id, doc);

        // 1. Достаем наш токен
        const token = localStorage.getItem("access_token") || "";

        // 2. Формируем URL. Уточни у бэкендера роут, обычно это так:
        const wsUrl = `ws://127.0.0.1:8000/ws/pages/${id}/?token=${token}`;

        // 3. Подключаемся к серверу
        const provider = new WebsocketProvider(wsUrl, id, doc, {
          connect: true,
        });

        // Логируем статус для удобного дебага на защите
        provider.on("status", (event) => {
          console.log(`[WebSockets] Статус (${id}):`, event.status);
        });

        return provider;
      }}
      shouldBootstrap={true}
    />
  );
}
