// ЗАГОТОВКА ДЛЯ ХАКАТОНА (Включать, когда бэкенд поднимет WebSockets)
/*
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function YjsCollaborationPlugin({ documentId }) {
  return (
    <CollaborationPlugin
      id={documentId}
      providerFactory={(id, yjsDocMap) => {
        const doc = new Y.Doc();
        yjsDocMap.set(id, doc);

        // Замени на URL вашего Django Channels сервера
        const provider = new WebsocketProvider('ws://localhost:8000/ws/wiki', id, doc);
        return provider;
      }}
      shouldBootstrap={true}
    />
  );
}
*/
