import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function YjsProvider({ documentId }) {
  return (
    <CollaborationPlugin
      id={documentId}
      providerFactory={(id, yjsDocMap) => {
        const doc = new Y.Doc();
        yjsDocMap.set(id, doc);

        // 1. Достаем токен
        const token = localStorage.getItem("access_token") || "";

        // 2. Логика от бэкендера: y-websocket склеивает URL и roomName
        // Замени IP/порт на боевой, если будете деплоить на сервер!
        const serverUrl = "ws://127.0.0.1:8000/ws/pages";
        const roomName = `${id}/?token=${token}`;

        // 3. Подключаемся
        const provider = new WebsocketProvider(serverUrl, roomName, doc, {
          connect: true,
        });

        // Логи для отладки
        provider.on("status", (event) => {
          console.log(`[WebSockets] Статус соединения (${id}):`, event.status);
        });

        return provider;
      }}
      shouldBootstrap={true}
    />
  );
}
