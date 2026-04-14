import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { ShareModal } from "../blocks/Modals/ShareModal";
import { CommandPalette } from "../blocks/Modals/CommandPalette";
// === ИМПОРТ НАШЕЙ НОВОЙ МОДАЛКИ ===
import { SmartImportModal } from "../blocks/Modals/SmartImportModal";
import {
  Search,
  Monitor,
  Bookmark,
  Globe,
  Settings,
  Plus,
  Upload,
  Link2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
} from "lucide-react";

export function GlobalLayout({ children, onPageSelect }) {
  // === СТЕЙТЫ ДЛЯ РЕАЛЬНЫХ ДАННЫХ ===
  const [fileTree, setFileTree] = useState([]);
  const [currentSpaceId, setCurrentSpaceId] = useState(null);
  const [isTreeLoading, setIsTreeLoading] = useState(true);

  // === СТЕЙТЫ UI ===
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // === СТЕЙТ ДЛЯ ИМПОРТА ===
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);

  // === ЗАГРУЗКА ДАННЫХ С БЭКЕНДА ===
  const fetchTree = async () => {
    setIsTreeLoading(true);
    try {
      const spaces = await api.getSpaces();

      if (spaces && spaces.length > 0) {
        const spaceId = spaces[0].id;
        setCurrentSpaceId(spaceId);

        const pagesTree = await api.getPagesTree(spaceId);

        const formatNode = (node) => ({
          id: node.id,
          name: node.title || "Без названия",
          type: node.children && node.children.length > 0 ? "folder" : "file",
          isOpen: false,
          children: node.children ? node.children.map(formatNode) : [],
        });

        setFileTree(pagesTree.map(formatNode));
      }
    } catch (error) {
      console.error("Ошибка загрузки проводника:", error);
    } finally {
      setIsTreeLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const toggleFolder = (folderId) => {
    const toggleNode = (nodes) =>
      nodes.map((node) => {
        if (node.id === folderId) return { ...node, isOpen: !node.isOpen };
        if (node.children && node.children.length > 0)
          return { ...node, children: toggleNode(node.children) };
        return node;
      });
    setFileTree(toggleNode(fileTree));
  };

  const handleCreateFile = async () => {
    if (!currentSpaceId) return;
    try {
      const emptyLexicalState = {
        root: {
          children: [
            {
              children: [],
              direction: null,
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
            },
          ],
          direction: null,
          format: "",
          indent: 0,
          type: "root",
          version: 1,
        },
      };
      const newPage = await api.createPage(currentSpaceId, {
        title: `Новая страница ${Math.floor(Math.random() * 10000)}`,
        content: emptyLexicalState,
      });
      const formattedNewPage = {
        id: newPage.id,
        name: newPage.title,
        type: "file",
        isOpen: false,
        children: [],
      };
      setFileTree([...fileTree, formattedNewPage]);
      setIsCreateOpen(false);

      if (onPageSelect) onPageSelect(newPage.id);
    } catch (error) {
      console.error("Ошибка при создании страницы:", error);
    }
  };

  const handleCreateFolder = () => {
    alert(
      "Для хакатона папки создаются автоматически, если перетащить страницу внутрь другой страницы",
    );
    setIsCreateOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderTree = (nodes, level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} style={{ paddingLeft: `${level === 0 ? 0 : 12}px` }}>
        {node.type === "folder" ? (
          <>
            <button
              onClick={() => toggleFolder(node.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors ${level > 0 ? "mt-0.5" : ""}`}
            >
              {node.isOpen ? (
                <ChevronDown size={14} className="text-gray-400 shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
              )}
              <Folder size={16} className="text-gray-400 shrink-0" />
              <span className="font-medium truncate">{node.name}</span>
            </button>
            {node.isOpen && node.children && (
              <div className="ml-3 border-l border-gray-200 pl-1">
                {renderTree(node.children, level + 1)}
              </div>
            )}
          </>
        ) : (
          <button
            onClick={() => onPageSelect && onPageSelect(node.id)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors group ${level === 0 ? "ml-4" : ""}`}
          >
            <FileText
              size={14}
              className="text-gray-400 group-hover:text-[#FF0032] shrink-0"
            />
            <span className="truncate">{node.name}</span>
          </button>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-screen w-full bg-white text-[#19191C] font-sans overflow-hidden">
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* === МОДАЛКА УМНОГО ИМПОРТА === */}
      <SmartImportModal
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        currentSpaceId={currentSpaceId}
        onImportSuccess={(pageId) => {
          // При успехе перезапрашиваем дерево файлов, чтобы появилась новая страница
          fetchTree();
          // И сразу открываем её в редакторе
          if (onPageSelect) onPageSelect(pageId);
        }}
      />

      <aside className="w-14 flex flex-col items-center py-3 border-r border-gray-200 bg-white shrink-0 z-20 justify-between shadow-[1px_0_4px_rgba(0,0,0,0.02)] relative">
        <div className="flex flex-col items-center gap-5 w-full">
          <button className="w-8 h-8 bg-[#FF0032] rounded-lg text-white flex items-center justify-center font-wide font-bold text-sm mb-2 hover:bg-[#CC0028] shadow-sm">
            W
          </button>
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="text-gray-400 hover:text-[#FF0032] transition-colors"
          >
            <Search size={20} />
          </button>
          <button className="text-[#FF0032] bg-[#FFEBED] w-10 h-10 rounded-xl flex items-center justify-center">
            <Monitor size={20} />
          </button>
          <button className="text-gray-400 hover:text-[#FF0032] transition-colors">
            <Bookmark size={20} />
          </button>
          <button className="text-gray-400 hover:text-[#FF0032] transition-colors">
            <Globe size={20} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-5 w-full mb-2">
          <button className="text-gray-400 hover:text-gray-800 transition-colors">
            <Settings size={20} />
          </button>
          <button className="w-8 h-8 bg-gray-900 rounded-full text-white flex items-center justify-center font-bold text-xs mt-2 border-2 border-white shadow-sm hover:scale-105 transition-transform">
            K
          </button>
        </div>
      </aside>

      <aside
        className={`border-r border-gray-200 flex flex-col bg-gray-50/50 shrink-0 z-10 justify-between transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-[280px] opacity-100" : "w-0 opacity-0 overflow-hidden border-none"}`}
      >
        <div className="flex-1 flex flex-col overflow-hidden min-w-[280px]">
          <div className="h-14 flex items-center justify-between px-4 shrink-0 mt-2">
            <h2 className="font-wide font-bold text-[16px] text-gray-900 truncate pr-2">
              WikiLive Team
            </h2>
            <button className="text-gray-400 hover:text-[#FF0032] hover:bg-[#FFEBED] p-1.5 rounded-lg transition-colors shrink-0">
              <Search size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="px-4 pb-4 shrink-0">
            <input
              type="text"
              placeholder="Поиск по пространству..."
              className="w-full px-3 py-2 text-sm border border-gray-200 bg-white rounded-lg outline-none focus:border-[#FF0032] focus:ring-1 focus:ring-[#FF0032] transition-all shadow-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-gray-200 pb-4">
            <div className="text-[11px] font-wide font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-2">
              Проводник
            </div>
            <div className="space-y-0.5">
              {isTreeLoading ? (
                <div className="px-4 py-2 text-sm text-gray-400">
                  Загрузка структуры...
                </div>
              ) : fileTree.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-400">
                  Нет страниц
                </div>
              ) : (
                renderTree(fileTree)
              )}
            </div>
          </div>
        </div>

        {/* Кнопки Создать / Импорт */}
        <div className="p-4 border-t border-gray-100 bg-white flex gap-2 shrink-0 min-w-[280px]">
          <div className="relative flex-1">
            <button
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className="w-full bg-[#FF0032] hover:bg-[#CC0028] text-white text-sm font-wide font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={16} /> Создать
            </button>
            {isCreateOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCreateOpen(false)}
                />
                <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in duration-150">
                  <button
                    onClick={handleCreateFile}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FF0032] rounded-lg transition-colors"
                  >
                    <FileText size={16} /> Новая страница
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FF0032] rounded-lg transition-colors"
                  >
                    <Folder size={16} /> Новая папка
                  </button>
                </div>
              </>
            )}
          </div>

          {/* === НАША КНОПКА ИМПОРТА === */}
          <button
            onClick={() => setIsSmartImportOpen(true)}
            className="flex-1 border border-gray-200 hover:border-[#FF0032] text-gray-700 hover:text-[#FF0032] hover:bg-[#FFEBED] text-sm font-wide font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Upload size={16} /> Импорт
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white relative z-30 shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -left-3.5 top-4 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-[#FF0032] hover:border-[#FF0032] hover:bg-[#FFEBED] shadow-md z-50 transition-all cursor-pointer"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>

        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-8 shrink-0 transition-all">
          <div className="flex items-center text-[13px] text-gray-500 ml-2">
            <span className="hover:text-gray-900 cursor-pointer transition-colors">
              Пространства
            </span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="hover:text-gray-900 cursor-pointer transition-colors">
              WikiLive Team
            </span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-gray-900 font-bold">
              Архитектура WikiLive
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-1">
              <div className="w-7 h-7 rounded-full border-2 border-white bg-green-600 flex items-center justify-center text-white text-[11px] font-bold z-10 shadow-sm cursor-pointer hover:-translate-y-0.5 transition-transform">
                K
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-white bg-orange-500 flex items-center justify-center text-white text-[11px] font-bold z-0 shadow-sm cursor-pointer hover:-translate-y-0.5 transition-transform">
                A
              </div>
            </div>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-[#FF0032] hover:bg-[#CC0028] text-white text-[13px] font-wide font-bold px-4 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Поделиться
            </button>
            <button className="text-gray-400 hover:text-[#FF0032] bg-gray-50 hover:bg-[#FFEBED] p-1.5 rounded-lg transition-colors">
              <Link2 size={18} strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
}
