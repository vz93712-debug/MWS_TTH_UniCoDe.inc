/* eslint-disable react-refresh/only-export-components */
import { DecoratorNode } from "lexical";
import React from "react";

// 1. Визуальный React-компонент, который рисуется внутри редактора
const MwsTableComponent = ({ tableId }) => {
  return (
    <div className="my-6 border-2 border-primary border-dashed p-6 rounded-lg bg-primary-50 flex items-center justify-center">
      <div className="text-center">
        <span className="font-bold text-primary block mb-2">
          📊 Здесь будет отрендерена таблица MWS
        </span>
        <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
          ID таблицы: {tableId}
        </span>
      </div>
    </div>
  );
};

// 2. Класс логики (Node) для движка Lexical
export class MwsTableNode extends DecoratorNode {
  __tableId;

  static getType() {
    return "mws-table";
  }

  static clone(node) {
    return new MwsTableNode(node.__tableId, node.__key);
  }

  constructor(tableId, key) {
    super(key);
    this.__tableId = tableId;
  }

  static importJSON(serializedNode) {
    return $createMwsTableNode(serializedNode.tableId);
  }

  exportJSON() {
    return {
      type: "mws-table",
      tableId: this.__tableId,
      version: 1,
    };
  }

  createDOM() {
    return document.createElement("div");
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <MwsTableComponent tableId={this.__tableId} />;
  }
}

export function $createMwsTableNode(tableId) {
  return new MwsTableNode(tableId);
}

export function $isMwsTableNode(node) {
  return node instanceof MwsTableNode;
}
