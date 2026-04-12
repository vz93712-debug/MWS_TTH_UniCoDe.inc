import { TableSelectModal } from './components/blocks/Modals/TableSelectModal';
import { TopToolbar } from './components/blocks/Toolbars/TopToolbar';
import { Table as TableIcon } from 'lucide-react';
import { CommentsDrawer } from './components/blocks/Drawers/CommentsDrawer';
import { HistoryDrawer } from './components/blocks/Drawers/HistoryDrawer';
import { MessageSquare, Clock } from 'lucide-react'; // Иконки для кнопок
import { AIAssistantDrawer } from './components/blocks/Drawers/AIAssistantDrawer';
import { Sparkles } from 'lucide-react'; // Нам понадобится иконка для кнопки
import { useState } from 'react';
import { ShareModal } from './components/blocks/Modals/ShareModal';
import { CommandPalette } from './components/blocks/Modals/CommandPalette';
import { Dashboard } from './pages/Dashboard';
import { FloatingToolbar } from './components/blocks/Toolbars/FloatingToolbar';
import { SlashMenu } from './components/blocks/Popovers/SlashMenu';
import { SixDotsMenu } from './components/blocks/Popovers/SixDotsMenu';
import { FieldTypeMenu } from './components/blocks/Popovers/FieldTypeMenu';
import { ViewTypeMenu } from './components/blocks/Popovers/ViewTypeMenu';
import { TableEmbedShell } from './components/blocks/EditorShells/TableEmbedShell';
import { Button } from "./components/ui/Button";
import { IconButton } from "./components/ui/IconButton";
import { Avatar, AvatarGroup } from "./components/ui/Avatar";
import { Search, Plus, Upload, Bold, Italic, Link2 } from "lucide-react";

export function UIKitShowcase() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  return (
    <div className="p-10 max-w-4xl mx-auto space-y-12 bg-white min-h-screen font-sans text-[#19191C]">
      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">1. Кнопки (открывают модалки)</h2>
        <div className="flex items-center gap-4">
          <Button variant="primary" icon={<Plus size={16} />}>Создать</Button>
          <Button variant="outline" icon={<Upload size={16} />}>Импорт</Button>
          <Button variant="primary" size="sm" onClick={() => setIsShareModalOpen(true)}>
            Поделиться (Тест Модалки)
          </Button>
          <Button variant="ghost" icon={<Search size={16} />} onClick={() => setIsCommandPaletteOpen(true)}>
            Глобальный Поиск (Эпик 9)
          </Button>
          <Button variant="outline" icon={<TableIcon size={16} />} onClick={() => setIsTableModalOpen(true)}>
            Вставить таблицу
          </Button>
          <Button variant="outline" icon={<Sparkles size={16} />} onClick={() => setIsAIDrawerOpen(true)}>
            AI-Ассистент (Эпик 4)
          </Button>
          <Button variant="outline" icon={<MessageSquare size={16} />} onClick={() => setIsCommentsOpen(true)}>
            Комментарии
          </Button>
          <Button variant="outline" icon={<Clock size={16} />} onClick={() => setIsHistoryOpen(true)}>
            История
          </Button>
        </div>
      </section>

      {/* Рендерим модалки в корне витрины */}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />

      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">2. Тулбар элементы (IconButtons)</h2>
        <div className="flex items-center gap-1 p-2 border border-gray-200 rounded-lg w-max shadow-sm">
          <IconButton icon={<Bold size={16} />} isActive={true} />
          <IconButton icon={<Italic size={16} />} />
          <IconButton icon={<Link2 size={16} />} />
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <IconButton icon={<Search size={16} />} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">3. Мультиплеер (Avatars)</h2>
        <div className="flex items-center gap-8">
          <Avatar initials="K" colorClass="bg-green-600" size="lg" />
          <Avatar initials="A" colorClass="bg-red-600" size="md" />
          <AvatarGroup>
            <Avatar initials="K" colorClass="bg-green-600" />
            <Avatar initials="A" colorClass="bg-red-600" />
            <Avatar initials="В" colorClass="bg-blue-600" />
          </AvatarGroup>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">4. Всплывающие меню (Popovers)</h2>
        <div className="flex flex-wrap items-start gap-8 bg-gray-50 p-8 rounded-xl border border-gray-100">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Slash-меню (/)</h3>
            <SlashMenu />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Действия с блоком</h3>
            <SixDotsMenu />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Тип поля (Таблицы)</h3>
            <FieldTypeMenu />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Выбор представления</h3>
            <ViewTypeMenu />
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">5. Тулбары (Toolbars)</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Главный Тулбар (Верхний)</h3>
            <TopToolbar />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Плавающий Тулбар (Выделение текста)</h3>
            <FloatingToolbar />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">6. Каркас Таблицы MWS</h2>
        <div className="p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
          <TableEmbedShell />
        </div>
      </section>
      <section className="pt-10 border-t border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-indigo-600">ЭПИК 2: Главный Дашборд</h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          <Dashboard />
        </div>
      </section>
      <AIAssistantDrawer isOpen={isAIDrawerOpen} onClose={() => setIsAIDrawerOpen(false)} />
      <CommentsDrawer isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} />
      <HistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <TableSelectModal isOpen={isTableModalOpen} onClose={() => setIsTableModalOpen(false)} />
    </div>
  );
}