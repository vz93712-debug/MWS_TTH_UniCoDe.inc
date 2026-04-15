import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const providerMap = new Map();

export function YjsProvider({ documentId }) {
  // Читаем токен напрямую (в Vite это абсолютно безопасно и не бесит линтер)
  const token = localStorage.getItem("access_token");

  // Если токена нет, просто ничего не рендерим (ждем логина)
  if (!token) {
    return null;
  }

  return (
    <CollaborationPlugin
      id={documentId}
      providerFactory={(id, yjsDocMap) => {
        if (providerMap.has(id)) {
          return providerMap.get(id);
        }

        const doc = new Y.Doc();
        yjsDocMap.set(id, doc);

        const serverUrl = "ws://127.0.0.1:8000/ws/pages";
        // ВАЖНО: Здесь стоят правильные обратные кавычки (backticks)!
        const roomName = `${id}/?token=${token}`;

        const provider = new WebsocketProvider(serverUrl, roomName, doc, {
          connect: true,
        });

        provider.on("status", (event) => {
          console.log(`[WebSockets] Статус соединения (${id}):`, event.status);
        });

        providerMap.set(id, provider);
        return provider;
      }}
      shouldBootstrap={true}
    />
  );
}
