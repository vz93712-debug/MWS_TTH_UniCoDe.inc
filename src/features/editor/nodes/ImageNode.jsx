/* eslint-disable react-refresh/only-export-components */
import { DecoratorNode } from "lexical";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import clsx from "clsx";
import { useCallback } from "react";

// 1. React-компонент для рендера внутри редактора
const ImageComponent = ({ src, alt, nodeKey }) => {
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const onClick = useCallback(
    (e) => {
      e.preventDefault();
      clearSelection();
      setSelected(true);
    },
    [clearSelection, setSelected],
  );

  const isLoading = src === "loading";

  return (
    <div
      className={clsx(
        "relative my-6 max-w-2xl mx-auto rounded-lg overflow-hidden transition-all select-none group",
        isSelected
          ? "ring-4 ring-primary-500 shadow-lg"
          : "ring-1 ring-surface-border",
        isLoading
          ? "bg-surface-muted animate-pulse h-64 flex items-center justify-center"
          : "bg-surface",
      )}
      onClick={onClick}
    >
      {isLoading ? (
        <div className="text-gray-400 flex flex-col items-center gap-2">
          <svg
            className="w-8 h-8 animate-spin text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-sm font-medium">
            Загрузка файла на сервер...
          </span>
        </div>
      ) : (
        <>
          {/* Сама картинка */}
          <img
            src={src}
            alt={alt}
            className="w-full h-auto block"
            draggable="false"
          />

          {/* Заглушка для ручек изменения размера (Resize Handles), появляются только при выделении */}
          {isSelected && (
            <>
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                MWS Media
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white cursor-nwse-resize"></div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// 2. Логика узла для движка Lexical
export class ImageNode extends DecoratorNode {
  __src;
  __alt;

  static getType() {
    return "mws-image";
  }

  static clone(node) {
    return new ImageNode(node.__src, node.__alt, node.__key);
  }

  constructor(src, alt, key) {
    super(key);
    this.__src = src;
    this.__alt = alt || "";
  }

  // Метод для обновления URL после завершения загрузки
  setSrc(src) {
    const writable = this.getWritable();
    writable.__src = src;
  }

  static importJSON(serializedNode) {
    return $createImageNode(serializedNode.src, serializedNode.alt);
  }

  exportJSON() {
    return {
      type: "mws-image",
      src: this.__src,
      alt: this.__alt,
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
    return (
      <ImageComponent
        src={this.__src}
        alt={this.__alt}
        nodeKey={this.getKey()}
      />
    );
  }
}

export function $createImageNode(src, alt) {
  return new ImageNode(src, alt);
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
