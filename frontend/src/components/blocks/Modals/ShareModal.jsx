import { X, Globe, Copy, Check } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { Avatar } from '../../ui/Avatar';

const USERS = [
  { id: 1, name: 'Константин А.', email: 'konstantin@mws.ru', role: 'Редактирование', initials: 'КА', color: 'bg-red-500' },
  { id: 2, name: 'Анна В.', email: 'anna@mws.ru', role: 'Чтение', initials: 'АВ', color: 'bg-green-500' },
];

export function ShareModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Настройки доступа</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Публичная ссылка */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shrink-0">
              <Globe size={20} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Публичная ссылка</h3>
              <p className="text-xs text-gray-500">Любой в интернете может просматривать</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#E33A3A] transition-colors">
              <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition-transform" />
            </button>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Список пользователей */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Имеют доступ</h3>
            <div className="space-y-4">
              {USERS.map(user => (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={user.initials} colorClass={user.color} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Select 
                    defaultValue={user.role === 'Чтение' ? 'read' : 'edit'}
                    options={[
                      { value: 'edit', label: 'Редактирование' },
                      { value: 'read', label: 'Чтение' }
                    ]} 
                    className="w-36 !py-1.5"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Футер */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <Button variant="ghost" icon={<Copy size={16} />} className="text-gray-600">
            Копировать ссылку
          </Button>
          <Button variant="primary" onClick={onClose}>Готово</Button>
        </div>
      </div>
    </div>
  );
}