import { useState, useEffect, useRef } from "react";
import {
  Table as TableIcon,
  Kanban,
  Plus,
  Database,
  Settings2,
  Upload,
  X,
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  ChevronDown,
  Check,
  LayoutTemplate,
  LayoutGrid,
  Calendar,
  BarChart2,
  Link as LinkIcon,
  Type,
  Calculator,
} from "lucide-react";

// ==========================================
// ГЛОБАЛЬНЫЕ КОНСТАНТЫ
// ==========================================
const STATUSES = ["Бэклог", "В работе", "Готово"];
const STEPS = { EMPTY: "EMPTY", READY: "READY" };

const MOCK_DATABASES = [
  {
    id: "db_1",
    name: "Проекты и задачи",
    count: 124,
    columns: [
      { id: "col_1", title: "Название задачи", type: "text" },
      { id: "col_2", title: "Статус", type: "select" },
      { id: "col_3", title: "Бюджет", type: "text" },
      { id: "col_4", title: "Начало", type: "date" },
    ],
    rows: [
      {
        id: "r1",
        col_1: "Спроектировать API",
        col_2: "В работе",
        col_3: "5000",
        col_4: "2023-10-02",
        rowTitle: "1",
      },
      {
        id: "r2",
        col_1: "Сверстать таблицу",
        col_2: "Готово",
        col_3: "3000",
        col_4: "2023-10-09",
        rowTitle: "2",
      },
    ],
  },
];

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================
function getIconForType(type) {
  switch (type) {
    case "table":
      return TableIcon;
    case "kanban":
      return Kanban;
    case "gantt":
      return LayoutTemplate;
    case "gallery":
      return LayoutGrid;
    case "calendar":
      return Calendar;
    case "dashboard":
      return BarChart2;
    default:
      return TableIcon;
  }
}

function getSafeTitle(row, columns) {
  if (!columns || !columns[0]) return "Без названия";
  const titleColId = columns[0].id;
  const rawTitle = row[titleColId];
  if (rawTitle === undefined || rawTitle === null) return "Без названия";
  return String(rawTitle).replace(/<[^>]*>?/gm, "") || "Без названия";
}

function calculateSafeFormula(row, columns, formulaExpression) {
  if (!formulaExpression) return "";
  try {
    let currentExpr = String(formulaExpression);
    columns.forEach((col) => {
      const colToken = `[${col.title}]`;
      if (currentExpr.includes(colToken)) {
        const rawValue = row[col.id];
        const strValue =
          rawValue !== undefined && rawValue !== null ? String(rawValue) : "0";
        const numValue = strValue
          .replace(/<[^>]*>?/gm, "")
          .replace(/[^\d.-]/g, "");
        currentExpr = currentExpr.split(colToken).join(numValue || "0");
      }
    });
    const result = new Function(`return ${currentExpr}`)();
    return Number.isFinite(result) ? Math.round(result * 100) / 100 : "Ошибка";
  } catch {
    return "Ошибка";
  }
}

// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ==========================================
export function DatabaseEmbedShell({ tableId, viewType = "table", onConnect }) {
  const isRealTable = tableId && !String(tableId).includes("mock");
  const [step, setStep] = useState(isRealTable ? STEPS.READY : STEPS.EMPTY);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [columns, setColumns] = useState([
    { id: "col_1", title: "Название", type: "text" },
    { id: "col_2", title: "Статус", type: "select" },
    { id: "col_3", title: "Дата", type: "date" },
  ]);

  const [rows, setRows] = useState([
    {
      id: "row_1",
      col_1: "Спроектировать архитектуру",
      col_2: "В работе",
      col_3: "2023-10-05",
      rowTitle: "1",
    },
    {
      id: "row_2",
      col_1: "Настроить базу данных",
      col_2: "Бэклог",
      col_3: "2023-10-12",
      rowTitle: "2",
    },
  ]);

  const [views, setViews] = useState([
    { id: "v1", type: "table", name: "Основная таблица", icon: TableIcon },
    { id: "v2", type: "kanban", name: "Доска задач", icon: Kanban },
    { id: "v3", type: "gantt", name: "Таймлайн (Гант)", icon: LayoutTemplate },
    { id: "v4", type: "gallery", name: "Галерея", icon: LayoutGrid },
    { id: "v5", type: "calendar", name: "Календарь", icon: Calendar },
    { id: "v6", type: "dashboard", name: "Аналитика", icon: BarChart2 },
  ]);

  const [activeViewId, setActiveViewId] = useState("v1");
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  const activeView = views.find((v) => v.id === activeViewId);
  const ActiveIcon = activeView?.icon || TableIcon;

  useEffect(() => {
    if (!tableId && onConnect) {
      onConnect(`local-${Date.now()}`);
      const targetView = views.find((v) => v.type === viewType);
      // eslint-disable-next-line react-hooks/exhaustive-deps, no-restricted-syntax
      if (targetView) setActiveViewId(targetView.id);
    }
  }, [tableId, onConnect, viewType, views]);

  const handleImportSuccess = (importedCols, importedRows) => {
    setColumns(importedCols);
    setRows(importedRows.map((r, i) => ({ ...r, rowTitle: `${i + 1}` })));
    setStep(STEPS.READY);
    setIsImportModalOpen(false);
    if (onConnect) onConnect(`mws-imported-${Date.now()}`);
  };

  const startEmpty = () => {
    setColumns([
      { id: "col_1", title: "Название", type: "text" },
      { id: "col_2", title: "Статус", type: "select" },
      { id: "col_3", title: "Дата", type: "date" },
    ]);
    setRows([
      {
        id: "row_1",
        col_1: "Новая задача",
        col_2: "Бэклог",
        col_3: "",
        rowTitle: "1",
      },
      { id: "row_2", col_1: "", col_2: "В работе", col_3: "", rowTitle: "2" },
    ]);
    setStep(STEPS.READY);
    setActiveViewId("v1");
    if (onConnect) onConnect(`local-${Date.now()}`);
  };

  const handleAddView = (type, name) => {
    const newView = {
      id: `v_${Date.now()}`,
      type,
      name,
      icon: getIconForType(type),
    };
    setViews([...views, newView]);
    setActiveViewId(newView.id);
    setIsViewMenuOpen(false);
  };

  return (
    <div className="w-full max-w-5xl my-6 font-sans relative">
      {isImportModalOpen && (
        <MwsImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportSuccess}
        />
      )}

      {step === STEPS.EMPTY && (
        <div className="w-full bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 text-[#FF0032]">
            <Database size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-wide">
            Блок Базы Данных
          </h3>
          <p className="text-gray-500 mb-8 max-w-sm text-sm">
            Создайте независимый массив данных или подключитесь к MWS.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF0032] text-white font-medium rounded-lg hover:bg-[#CC0028] shadow-sm text-sm transition-colors"
            >
              <Database size={16} /> Импорт из MWS
            </button>
            <button
              onClick={startEmpty}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-sm text-sm transition-colors"
            >
              <Plus size={16} /> Создать пустую
            </button>
          </div>
        </div>
      )}

      {step === STEPS.READY && (
        <div className="w-full rounded-xl bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-gray-200 overflow-visible flex flex-col relative z-10 group/db">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl relative z-20">
            <div className="relative">
              <button
                onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
              >
                <ActiveIcon size={16} className="text-gray-400" />
                <span className="font-bold text-sm">{activeView?.name}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {isViewMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsViewMenuOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1.5 flex flex-col max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1 px-2 mt-1">
                      Текущие виды
                    </div>
                    {views.map((v) => {
                      const ViewIcon = v.icon;
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            setActiveViewId(v.id);
                            setIsViewMenuOpen(false);
                          }}
                          className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm w-full text-left transition-colors ${
                            activeViewId === v.id
                              ? "bg-[#FFEBED] text-[#FF0032]"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <ViewIcon
                            size={14}
                            className={
                              activeViewId === v.id
                                ? "text-[#FF0032]"
                                : "text-gray-400"
                            }
                          />
                          <span className="font-medium truncate">{v.name}</span>
                          {activeViewId === v.id && (
                            <Check size={14} className="ml-auto shrink-0" />
                          )}
                        </button>
                      );
                    })}
                    <div className="h-px bg-gray-100 my-1.5" />
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1 px-2">
                      Добавить вид
                    </div>
                    <button
                      onClick={() => handleAddView("table", "Таблица")}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600 w-full text-left"
                    >
                      <TableIcon size={14} className="text-gray-400" /> Таблица
                    </button>
                    <button
                      onClick={() => handleAddView("kanban", "Канбан")}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600 w-full text-left"
                    >
                      <Kanban size={14} className="text-gray-400" />{" "}
                      Канбан-доска
                    </button>
                    <button
                      onClick={() => handleAddView("gantt", "Гант")}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600 w-full text-left"
                    >
                      <LayoutTemplate size={14} className="text-gray-400" />{" "}
                      Диаграмма Ганта
                    </button>
                    <button
                      onClick={() => handleAddView("gallery", "Галерея")}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600 w-full text-left"
                    >
                      <LayoutGrid size={14} className="text-gray-400" /> Галерея
                    </button>
                    <button
                      onClick={() => handleAddView("calendar", "Календарь")}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600 w-full text-left"
                    >
                      <Calendar size={14} className="text-gray-400" /> Календарь
                    </button>
                    <button
                      onClick={() => handleAddView("dashboard", "Аналитика")}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600 w-full text-left"
                    >
                      <BarChart2 size={14} className="text-gray-400" /> Дашборд
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover/db:opacity-100 transition-opacity">
              <button className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-[#FF0032] hover:bg-[#FFEBED] rounded-md transition-colors">
                <Settings2 size={14} /> Настройки
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button
                onClick={() => setIsImportModalOpen(true)}
                title="Импорт из MWS"
                className="p-1.5 text-gray-400 hover:text-[#FF0032] hover:bg-[#FFEBED] rounded-md transition-colors"
              >
                <Upload size={16} />
              </button>
            </div>
          </div>

          <div className="w-full bg-white relative z-10 rounded-b-xl min-h-[150px]">
            {activeView?.type === "table" && (
              <InteractiveTableView
                columns={columns}
                setColumns={setColumns}
                rows={rows}
                setRows={setRows}
              />
            )}
            {activeView?.type === "kanban" && (
              <KanbanView columns={columns} rows={rows} setRows={setRows} />
            )}
            {activeView?.type === "gantt" && (
              <GanttView columns={columns} rows={rows} />
            )}
            {activeView?.type === "gallery" && (
              <GalleryView columns={columns} rows={rows} />
            )}
            {activeView?.type === "calendar" && (
              <CalendarView columns={columns} rows={rows} />
            )}
            {activeView?.type === "dashboard" && (
              <DashboardView columns={columns} rows={rows} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 1. АНАЛИТИКА (DASHBOARD)
// ==========================================
function DashboardView({ columns, rows }) {
  const statusCol = columns.find((c) => c.type === "select");
  if (!statusCol)
    return (
      <FallbackUI
        icon={BarChart2}
        title="Нет данных для аналитики"
        desc="Добавьте колонку со статусом (SEL) для построения графиков."
      />
    );

  const counts = STATUSES.map((status) => ({
    name: status,
    value: rows.filter((r) => (r[statusCol.id] || "Бэклог") === status).length,
  }));
  const maxVal = Math.max(...counts.map((c) => c.value)) || 1;
  const completed = counts.find((c) => c.name === "Готово")?.value || 0;
  const progress =
    rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0;

  return (
    <div className="p-8 bg-gray-50/30 rounded-b-xl flex flex-col gap-8 min-h-[350px]">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            Всего задач
          </span>
          <span className="text-4xl font-black text-gray-900 mt-2">
            {rows.length}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            Прогресс проекта
          </span>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-black text-[#FF0032]">
              {progress}%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            В работе
          </span>
          <span className="text-4xl font-black text-gray-900 mt-2">
            {counts.find((c) => c.name === "В работе")?.value || 0}
          </span>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col">
        <h4 className="text-base font-bold text-gray-900 mb-6 font-wide">
          Распределение по статусам
        </h4>
        <div className="flex items-end gap-8 flex-1 min-h-[150px] mt-auto">
          {counts.map((item) => (
            <div
              key={item.name}
              className="flex-1 flex flex-col items-center gap-3 group h-full"
            >
              <div className="w-full bg-gray-50 rounded-t-lg relative flex items-end justify-center h-full">
                <div
                  className="w-full bg-[#FF0032] opacity-80 rounded-t-lg group-hover:opacity-100 transition-all duration-500 ease-out flex items-start justify-center pt-2"
                  style={{
                    height: `${(item.value / maxVal) * 100}%`,
                    minHeight: item.value > 0 ? "24px" : "0",
                  }}
                >
                  {item.value > 0 && (
                    <span className="text-white text-xs font-bold">
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-gray-500">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. КАЛЕНДАРЬ
// ==========================================
function CalendarView({ columns, rows }) {
  const dateCol = columns.find((c) => c.type === "date");
  if (!dateCol)
    return (
      <FallbackUI
        icon={Calendar}
        title="Нужны даты"
        desc="Добавьте колонку с датами (DAT) для отображения календаря."
      />
    );

  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="bg-white p-6 rounded-b-xl">
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden">
        {weekDays.map((d) => (
          <div
            key={d}
            className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-500 uppercase"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dayTasks = rows.filter((r) => {
            const dateVal = r[dateCol.id];
            return (
              dateVal &&
              typeof dateVal === "string" &&
              parseInt(dateVal.split("-")[2]) === day
            );
          });
          return (
            <div
              key={day}
              className="bg-white min-h-[100px] p-2 hover:bg-gray-50 transition-colors group cursor-pointer flex flex-col"
            >
              <span className="text-sm font-bold text-gray-400 group-hover:text-[#FF0032] transition-colors">
                {day}
              </span>
              <div className="mt-1 flex flex-col gap-1">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="text-[10px] font-bold text-white bg-[#FF0032] px-1.5 py-0.5 rounded truncate"
                  >
                    {getSafeTitle(t, columns)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 3. ГАЛЕРЕЯ (КАРТОЧКИ)
// ==========================================
function GalleryView({ columns, rows }) {
  const selectCol = columns.find((c) => c.type === "select");
  return (
    <div className="p-6 bg-gray-50/50 rounded-b-xl min-h-[400px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {rows.map((row) => (
          <div
            key={row.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 relative">
              <div className="absolute inset-0 bg-[#FF0032] opacity-0 group-hover:opacity-10 transition-opacity" />
            </div>
            <div className="p-5">
              <div className="font-bold text-gray-900 mb-2 leading-snug text-lg">
                {getSafeTitle(row, columns)}
              </div>
              {selectCol && (
                <span className="inline-block px-2.5 py-1 bg-[#FFEBED] text-[#FF0032] text-xs font-bold rounded-lg border border-red-100 mt-2">
                  {row[selectCol.id] || "Бэклог"}
                </span>
              )}
            </div>
          </div>
        ))}
        <div className="bg-transparent border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-[#FF0032] hover:bg-white hover:border-gray-300 transition-all cursor-pointer min-h-[220px]">
          <Plus size={32} className="mb-2" />
          <span className="font-bold">Новая карточка</span>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function FallbackUI({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center bg-gray-50/30 rounded-b-xl min-h-[400px]">
      <div className="w-16 h-16 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-center mb-4 text-gray-400">
        <Icon size={28} />
      </div>
      <h4 className="text-gray-800 font-bold mb-2 text-lg font-wide">
        {title}
      </h4>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ==========================================
// 4. КАНБАН
// ==========================================
function KanbanView({ columns, rows, setRows }) {
  const selectCol = columns.find((c) => c.type === "select");
  if (!selectCol)
    return (
      <FallbackUI
        icon={Kanban}
        title="Нужна колонка статуса"
        desc="Для доски измените тип колонки на SEL (Выбор)."
      />
    );

  const updateStatus = (rowId, newStatus) =>
    setRows(
      rows.map((r) =>
        r.id === rowId ? { ...r, [selectCol.id]: newStatus } : r,
      ),
    );
  const handleAddTask = (status) =>
    setRows([
      ...rows,
      {
        id: `row_${Date.now()}`,
        [columns[0].id]: "Новая задача",
        [selectCol.id]: status,
        rowTitle: `${rows.length + 1}`,
      },
    ]);

  return (
    <div className="flex gap-4 p-6 overflow-x-auto bg-gray-50/50 min-h-[400px] scrollbar-thin scrollbar-thumb-gray-200 rounded-b-xl border-t border-gray-100">
      {STATUSES.map((status) => (
        <div key={status} className="flex-1 min-w-[280px] max-w-[350px]">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-700">{status}</span>
              <span className="text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-md shadow-sm">
                {
                  rows.filter((r) => (r[selectCol.id] || "Бэклог") === status)
                    .length
                }
              </span>
            </div>
            <button
              onClick={() => handleAddTask(status)}
              className="text-gray-400 hover:text-[#FF0032] transition-colors p-1 hover:bg-gray-100 rounded"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {rows
              .filter((r) => (r[selectCol.id] || "Бэклог") === status)
              .map((row) => (
                <div
                  key={row.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group hover:border-[#FF0032] transition-all cursor-pointer"
                >
                  <div
                    className="text-sm text-gray-800 mb-4 font-medium leading-relaxed whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{
                      __html: getSafeTitle(row, columns),
                    }}
                  />
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="w-5 h-5 rounded bg-[#FFEBED] text-[#FF0032] flex items-center justify-center text-[10px] font-bold">
                      {row.rowTitle}
                    </div>
                    <select
                      value={row[selectCol.id] || "Бэклог"}
                      onChange={(e) => updateStatus(row.id, e.target.value)}
                      className="text-[11px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-1.5 py-1 outline-none cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            <button
              onClick={() => handleAddTask(status)}
              className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg border border-dashed border-gray-200 hover:border-gray-300 transition-all"
            >
              <Plus size={16} /> Добавить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 5. ГАНТ
// ==========================================
function GanttView({ columns, rows }) {
  const dateCols = columns.filter((c) => c.type === "date");
  const startCol = dateCols[0];
  const endCol = dateCols[1] || dateCols[0];

  if (!startCol)
    return (
      <FallbackUI
        icon={LayoutTemplate}
        title="Не хватает данных"
        desc="Добавьте колонки с датами (DAT) для таймлайна."
      />
    );

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const getDayFromDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const p = dateStr.split("-");
    return p.length === 3 ? parseInt(p[2], 10) : null;
  };

  return (
    <div className="flex rounded-b-xl overflow-hidden bg-white max-h-[500px]">
      <div className="w-64 bg-white border-r border-gray-200 shrink-0 flex flex-col">
        <div className="h-10 border-b border-gray-200 bg-gray-50/50 flex items-center px-4 font-bold text-[11px] text-gray-400 uppercase tracking-wider">
          Задачи
        </div>
        <div className="overflow-y-auto scrollbar-hide flex-1">
          {rows.map((row) => (
            <div
              key={row.id}
              className="h-12 border-b border-gray-100 px-4 flex items-center text-sm font-medium text-gray-700 truncate"
            >
              {getSafeTitle(row, columns)}
            </div>
          ))}
        </div>
      </div>
      <div
        className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 bg-[linear-gradient(to_right,#f9fafb_1px,transparent_1px)]"
        style={{ backgroundSize: "minmax(30px, 1fr)" }}
      >
        <div className="min-w-[900px] flex flex-col h-full">
          <div
            className="h-10 border-b border-gray-200 bg-gray-50/50"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(31, minmax(30px, 1fr))`,
            }}
          >
            {days.map((day) => (
              <div
                key={day}
                className="border-r border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="overflow-y-auto scrollbar-hide flex-1">
            {rows.map((row) => {
              const startDay = getDayFromDate(row[startCol.id]) || 1;
              const endDay = getDayFromDate(row[endCol.id]) || startDay + 2;
              return (
                <div
                  key={row.id}
                  className="h-12 border-b border-gray-100 relative group hover:bg-gray-50/50 transition-colors"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(31, minmax(30px, 1fr))`,
                  }}
                >
                  {days.map((day) => (
                    <div key={day} className="border-r border-gray-100/30" />
                  ))}
                  <div
                    className="absolute top-2.5 bottom-2.5 bg-[#FF0032] rounded-md shadow-sm opacity-90 group-hover:opacity-100 cursor-pointer flex items-center px-2 text-white text-[11px] font-medium whitespace-nowrap overflow-hidden"
                    style={{ gridColumn: `${startDay} / ${endDay + 1}` }}
                  >
                    {getSafeTitle(row, columns)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. ТАБЛИЦА (С ФОРМУЛАМИ И PRO-МЕНЮ)
// ==========================================
function InteractiveTableView({ columns, setColumns, rows, setRows }) {
  const [menuPos, setMenuPos] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        tableRef.current &&
        !tableRef.current.contains(e.target) &&
        !e.target.closest(".rich-text-menu")
      )
        setMenuPos(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelection = () => {
    const selection = window.getSelection();
    // ФИКС КРАША: Проверяем rangeCount, чтобы getRangeAt(0) не вызывал IndexSizeError
    if (
      selection &&
      selection.rangeCount > 0 &&
      selection.toString().trim().length > 0
    ) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setMenuPos({
        top: Math.max(10, rect.top - 45),
        left: rect.left + rect.width / 2,
      });
    } else {
      setTimeout(() => {
        if (!window.getSelection()?.toString().trim()) setMenuPos(null);
      }, 100);
    }
  };

  const execFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    handleSelection();
  };
  const handleLink = () => {
    const url = prompt("Введите URL ссылки:", "https://");
    if (url) execFormat("createLink", url);
  };
  const handleCellChange = (rowId, colId, value) =>
    setRows(rows.map((r) => (r.id === rowId ? { ...r, [colId]: value } : r)));
  const cycleColumnType = (colId, currentType) => {
    const types = ["text", "select", "date", "formula"];
    setColumns(
      columns.map((c) =>
        c.id === colId
          ? {
              ...c,
              type: types[(types.indexOf(currentType) + 1) % types.length],
            }
          : c,
      ),
    );
  };

  return (
    <div
      ref={tableRef}
      className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 pb-2 relative rounded-b-xl"
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
    >
      {menuPos && (
        <div
          className="rich-text-menu fixed z-[9999] flex items-center gap-1 bg-[#FF0032] text-white px-2 py-1.5 rounded-xl shadow-xl -translate-x-1/2 animate-in fade-in zoom-in duration-150"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="relative group/font flex items-center bg-[#CC0028] rounded-md px-1 mr-1">
            <Type size={14} className="mx-1" />
            <select
              onChange={(e) => execFormat("fontName", e.target.value)}
              className="bg-transparent text-white text-xs font-medium outline-none cursor-pointer py-1 appearance-none w-16"
            >
              <option value="Arial" className="text-black">
                Arial
              </option>
              <option value="Georgia" className="text-black">
                Georgia
              </option>
              <option value="Courier New" className="text-black">
                Courier
              </option>
            </select>
          </div>
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("bold");
            }}
            className={`p-1.5 hover:bg-[#CC0028] rounded-md transition-colors ${document.queryCommandState("bold") ? "bg-white text-[#FF0032]" : ""}`}
          >
            <Bold size={14} strokeWidth={3} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("italic");
            }}
            className={`p-1.5 hover:bg-[#CC0028] rounded-md transition-colors ${document.queryCommandState("italic") ? "bg-white text-[#FF0032]" : ""}`}
          >
            <Italic size={14} strokeWidth={3} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              execFormat("underline");
            }}
            className={`p-1.5 hover:bg-[#CC0028] rounded-md transition-colors ${document.queryCommandState("underline") ? "bg-white text-[#FF0032]" : ""}`}
          >
            <Underline size={14} strokeWidth={3} />
          </button>
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleLink();
            }}
            className="p-1.5 hover:bg-[#CC0028] rounded-md transition-colors"
            title="Добавить ссылку"
          >
            <LinkIcon size={14} strokeWidth={3} />
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#FF0032]" />
        </div>
      )}

      <table className="w-full text-left border-collapse text-[14px] text-[#19191C] min-w-[600px]">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-200">
            <th className="p-0 border-r border-gray-200 sticky left-0 z-30 bg-gray-50 w-12 shadow-[1px_0_0_0_#e5e7eb]">
              <div className="p-2 text-center text-gray-400">#</div>
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                className="p-0 border-r border-gray-200 min-w-[200px] group/col"
              >
                <div className="flex items-center gap-2 px-3 py-2 relative">
                  <span
                    onClick={() => cycleColumnType(col.id, col.type)}
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 flex items-center gap-1 ${col.type === "select" ? "bg-blue-100 text-blue-600 hover:ring-blue-300" : col.type === "date" ? "bg-purple-100 text-purple-600 hover:ring-purple-300" : col.type === "formula" ? "bg-green-100 text-green-600 hover:ring-green-300" : "bg-gray-200 text-gray-500 hover:ring-gray-300"}`}
                  >
                    {col.type === "formula" && <Calculator size={10} />}
                    {col.type.substring(0, 3)}
                  </span>
                  <input
                    className="w-full bg-transparent font-medium text-gray-700 outline-none focus:bg-white rounded px-1 transition-colors"
                    value={col.title}
                    onChange={(e) =>
                      setColumns(
                        columns.map((c) =>
                          c.id === col.id ? { ...c, title: e.target.value } : c,
                        ),
                      )
                    }
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {col.type === "formula" && (
                    <input
                      placeholder="Напр: [Бюджет]*2"
                      className="absolute top-full left-0 mt-1 w-full bg-green-50 border border-green-200 text-xs px-2 py-1 rounded shadow-lg text-green-800 outline-none focus:ring-1 focus:ring-green-400 z-40 opacity-0 group-hover/col:opacity-100 transition-opacity"
                      value={col.formulaExpression || ""}
                      onChange={(e) =>
                        setColumns(
                          columns.map((c) =>
                            c.id === col.id
                              ? { ...c, formulaExpression: e.target.value }
                              : c,
                          ),
                        )
                      }
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </th>
            ))}
            <th
              onClick={() =>
                setColumns([
                  ...columns,
                  {
                    id: `col_${Date.now()}`,
                    title: "Новое поле",
                    type: "text",
                  },
                ])
              }
              className="p-3 text-gray-400 hover:text-[#FF0032] cursor-pointer w-12 text-center transition-colors"
            >
              <Plus size={16} className="mx-auto" />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="group hover:bg-gray-50/50 border-b border-gray-100 transition-colors"
            >
              <td className="p-0 border-r border-gray-200 sticky left-0 z-10 bg-white group-hover:bg-gray-50 align-top">
                <input
                  className="w-full h-full min-h-[42px] px-2 bg-transparent text-center text-gray-400 outline-none focus:text-gray-900"
                  value={row.rowTitle}
                  onChange={(e) =>
                    handleCellChange(row.id, "rowTitle", e.target.value)
                  }
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </td>
              {columns.map((col) => (
                <td
                  key={col.id}
                  className="p-0 border-r border-gray-100 relative align-top"
                >
                  {col.type === "select" ? (
                    <select
                      value={row[col.id] || "Бэклог"}
                      onChange={(e) =>
                        handleCellChange(row.id, col.id, e.target.value)
                      }
                      className="w-full h-full min-h-[42px] px-3 bg-transparent outline-none appearance-none cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : col.type === "date" ? (
                    <input
                      type="date"
                      value={row[col.id] || ""}
                      onChange={(e) =>
                        handleCellChange(row.id, col.id, e.target.value)
                      }
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full h-full min-h-[42px] px-3 bg-transparent outline-none cursor-pointer text-gray-600"
                    />
                  ) : col.type === "formula" ? (
                    <div className="w-full h-full min-h-[42px] px-4 py-3 bg-green-50/30 text-green-800 font-mono text-sm flex items-center">
                      {calculateSafeFormula(
                        row,
                        columns,
                        col.formulaExpression,
                      )}
                    </div>
                  ) : (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="w-full h-auto min-h-[42px] px-4 py-3 bg-transparent outline-none cursor-text whitespace-pre-wrap break-words"
                      onBlur={(e) =>
                        handleCellChange(
                          row.id,
                          col.id,
                          e.currentTarget.innerHTML,
                        )
                      }
                      onKeyDown={(e) => e.stopPropagation()}
                      dangerouslySetInnerHTML={{
                        __html: String(row[col.id] || ""),
                      }}
                    />
                  )}
                </td>
              ))}
              <td className="bg-gray-50/20"></td>
            </tr>
          ))}

          {/* НОВАЯ КНОПКА ДОБАВЛЕНИЯ СТРОКИ */}
          <tr>
            <td
              colSpan={columns.length + 2}
              className="p-0 border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors"
            >
              <button
                onClick={() => {
                  const newRow = {
                    id: `row_${Date.now()}`,
                    rowTitle: String(rows.length + 1),
                  };
                  columns.forEach((c) => (newRow[c.id] = ""));
                  setRows([...rows, newRow]);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-400 hover:text-[#FF0032] transition-colors"
              >
                <Plus size={16} /> Добавить строку
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// МОДАЛКА ИМПОРТА
// ==========================================
function MwsImportModal({ onClose, onImport }) {
  const [selectedDb, setSelectedDb] = useState(null);
  const [selectedCols, setSelectedCols] = useState([]);

  const handleSelectDb = (db) => {
    setSelectedDb(db);
    setSelectedCols(db.columns.map((c) => c.id));
  };
  const handleImportClick = () => {
    if (!selectedDb) return;
    const finalCols = selectedDb.columns.filter((c) =>
      selectedCols.includes(c.id),
    );
    onImport(finalCols, selectedDb.rows);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            {selectedDb && (
              <button
                onClick={() => setSelectedDb(null)}
                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-500"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">
              {selectedDb
                ? `Настройка: ${selectedDb.name}`
                : "Каталог баз данных MWS"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-gray-50/30 flex-1">
          {!selectedDb && (
            <div className="grid grid-cols-2 gap-4">
              {MOCK_DATABASES.map((db) => (
                <div
                  key={db.id}
                  onClick={() => handleSelectDb(db)}
                  className="p-5 bg-white border border-gray-200 hover:border-[#FF0032] hover:shadow-md rounded-xl cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#FFEBED] text-[#FF0032] rounded-lg group-hover:bg-[#FF0032] group-hover:text-white transition-colors">
                      <Database size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900">{db.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    {db.count} записей • {db.columns.length} столбцов
                  </p>
                </div>
              ))}
            </div>
          )}
          {selectedDb && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  Какие столбцы импортировать?
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDb.columns.map((col) => (
                    <label
                      key={col.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${selectedCols.includes(col.id) ? "border-[#FF0032] bg-[#FFEBED] text-[#FF0032]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      <input
                        type="checkbox"
                        className="accent-[#FF0032]"
                        checked={selectedCols.includes(col.id)}
                        onChange={() =>
                          setSelectedCols((prev) =>
                            prev.includes(col.id)
                              ? prev.filter((id) => id !== col.id)
                              : [...prev, col.id],
                          )
                        }
                      />
                      <span className="text-sm font-medium">{col.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {selectedDb && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
            <button
              onClick={() => setSelectedDb(null)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Назад
            </button>
            <button
              onClick={handleImportClick}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#FF0032] hover:bg-[#CC0028] rounded-lg transition-colors"
            >
              Импортировать данные
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
