import {
  Plus,
  LayoutTemplate,
  Upload,
  FileText,
  MoreHorizontal,
  Clock,
  Table as TableIcon,
} from "lucide-react";

const RECENT_DOCS = [
  {
    id: 1,
    title: "Архитектура MWS API",
    type: "page",
    time: "Открыто 2ч назад",
    icon: FileText,
  },
  {
    id: 2,
    title: "План запуска Q3",
    type: "table",
    time: "Открыто 4ч назад",
    icon: TableIcon,
  },
];

export function Dashboard({ onNavigate }) {
  return (
    <div className="max-w-5xl mx-auto py-12 px-8 font-sans text-[#19191C]">
      <div className="mb-10">
        <h1 className="text-4xl font-wide font-bold mb-2">
          Доброе утро, Команда ☀️
        </h1>
        <p className="text-gray-500 flex items-center gap-2 text-sm font-medium">
          <Clock size={16} /> Сегодня, 14 апреля
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-[11px] font-wide font-bold text-gray-400 uppercase tracking-widest mb-6">
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => onNavigate("editor")}
            className="flex flex-col items-center justify-center gap-4 p-8 bg-white border border-gray-200 rounded-2xl hover:border-[#FF0032] hover:shadow-xl hover:shadow-red-500/5 transition-all group"
          >
            <div className="w-14 h-14 bg-[#FFEBED] text-[#FF0032] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={28} strokeWidth={2.5} />
            </div>
            <span className="font-wide font-bold text-sm">
              Создать страницу
            </span>
          </button>

          <button className="flex flex-col items-center justify-center gap-4 p-8 bg-white border border-gray-200 rounded-2xl hover:border-gray-400 transition-all group">
            <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <LayoutTemplate size={28} />
            </div>
            <span className="font-wide font-bold text-sm">Из шаблона</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-4 p-8 bg-white border border-gray-200 rounded-2xl hover:border-gray-400 transition-all group">
            <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={28} />
            </div>
            <span className="font-wide font-bold text-sm">Импорт файла</span>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-[11px] font-wide font-bold text-gray-400 uppercase tracking-widest mb-6">
          Недавно просмотренные
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {RECENT_DOCS.map((doc) => (
            <div
              key={doc.id}
              className="group cursor-pointer"
              onClick={() => onNavigate("editor")}
            >
              <div className="h-40 bg-gray-50 border border-gray-200 rounded-2xl mb-4 relative overflow-hidden group-hover:border-[#FF0032]/30 transition-all">
                <div className="absolute inset-5 bg-white rounded-lg border border-gray-100 shadow-sm opacity-60"></div>
                <button className="absolute top-3 right-3 p-2 bg-white border border-gray-100 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <div className="flex items-start gap-3 px-1">
                <doc.icon
                  size={18}
                  className={
                    doc.type === "table" ? "text-[#FF0032]" : "text-gray-400"
                  }
                />
                <div>
                  <h3 className="font-bold text-sm text-gray-900 leading-none">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                    {doc.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
