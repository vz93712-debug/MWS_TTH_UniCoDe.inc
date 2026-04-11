import { Button } from "./components/ui/Button";
import { IconButton } from "./components/ui/IconButton";
import { Avatar, AvatarGroup } from "./components/ui/Avatar";
import { Search, Plus, Upload, Bold, Italic, Link2 } from "lucide-react";

export function UIKitShowcase() {
  return (
    <div className="p-10 max-w-4xl mx-auto space-y-12 bg-white min-h-screen font-sans text-[#19191C]">
      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">
          1. Кнопки (Buttons)
        </h2>
        <div className="flex items-center gap-4">
          <Button variant="primary" icon={<Plus size={16} />}>
            Создать
          </Button>
          <Button variant="outline" icon={<Upload size={16} />}>
            Импорт
          </Button>
          <Button variant="primary" size="sm">
            Поделиться
          </Button>
          <Button variant="ghost" icon={<Search size={16} />}>
            Поиск
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">
          2. Тулбар элементы (IconButtons)
        </h2>
        <div className="flex items-center gap-1 p-2 border border-gray-200 rounded-lg w-max shadow-sm">
          <IconButton icon={<Bold size={16} />} isActive={true} />
          <IconButton icon={<Italic size={16} />} />
          <IconButton icon={<Link2 size={16} />} />
          <div className="w-px h-4 bg-gray-200 mx-1" /> {/* Разделитель */}
          <IconButton icon={<Search size={16} />} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6 border-b pb-2">
          3. Мультиплеер (Avatars)
        </h2>
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
        <h2 className="text-xl font-bold mb-6 border-b pb-2">
          4. Меню и Плашки (Dropdowns/Popovers)
        </h2>
        <div className="w-64 bg-white border border-gray-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] p-1.5">
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2">
            <Link2 size={16} className="text-gray-400" />
            Копировать ссылку на блок
          </button>
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2 text-red-600">
            <Trash2 size={16} className="text-red-400" />
            Удалить блок
          </button>
        </div>
      </section>
    </div>
  );
}

// Не забудь импортировать Trash2 вверху файла: import { Trash2 } from 'lucide-react';
