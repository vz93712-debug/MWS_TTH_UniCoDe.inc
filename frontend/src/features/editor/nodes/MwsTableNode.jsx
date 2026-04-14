/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { DecoratorNode, $getNodeByKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DatabaseEmbedShell } from "../../../components/blocks/EditorShells/DatabaseEmbedShell";

const MwsTableComponent = ({ nodeKey, tableId, viewType }) => {
  const [editor] = useLexicalComposerContext();

  const handleStateChange = (newTableId, newViewType) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isMwsTableNode(node)) {
        if (newTableId !== undefined) node.setTableId(newTableId);
        if (newViewType !== undefined) node.setViewType(newViewType);
      }
    });
  };

  return (
    <div
      className="my-8 relative group/block lexical-block"
      contentEditable={false}
    >
      <DatabaseEmbedShell
        tableId={tableId}
        viewType={viewType}
        // Передаем универсальный коллбек для синхронизации с Lexical
        onConnect={(id) => handleStateChange(id, undefined)}
        onViewChange={(view) => handleStateChange(undefined, view)}
      />
    </div>
  );
};

export class MwsTableNode extends DecoratorNode {
  __tableId;
  __viewType;

  static getType() {
    return "mws-table";
  }

  static clone(node) {
    return new MwsTableNode(node.__tableId, node.__viewType, node.__key);
  }

  constructor(tableId, viewType = "table", key) {
    super(key);
    this.__tableId = tableId;
    this.__viewType = viewType;
  }

  static importJSON(serializedNode) {
    return $createMwsTableNode(
      serializedNode.tableId,
      serializedNode.viewType || "table",
    );
  }

  exportJSON() {
    return {
      type: "mws-table",
      tableId: this.__tableId,
      viewType: this.__viewType,
      version: 1,
    };
  }

  createDOM() {
    return document.createElement("div");
  }

  updateDOM() {
    return false;
  }

  setTableId(tableId) {
    const writable = this.getWritable();
    writable.__tableId = tableId;
  }

  setViewType(viewType) {
    const writable = this.getWritable();
    writable.__viewType = viewType;
  }

  decorate() {
    return (
      <MwsTableComponent
        nodeKey={this.getKey()}
        tableId={this.__tableId}
        viewType={this.__viewType}
      />
    );
  }
}

export function $createMwsTableNode(tableId = null, viewType = "table") {
  return new MwsTableNode(tableId, viewType);
}

export function $isMwsTableNode(node) {
  return node instanceof MwsTableNode;
}
