import { useState } from "react";
import { X, Send, MessageSquare, MoreHorizontal } from "lucide-react";

export function CommentsDrawer({ isOpen, onClose }) {
  const [newComment, setNewComment] = useState("");

  // Моковые данные для отображения в MVP
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "Алексей С.",
      text: "Отличная таблица, но давайте добавим колонку с дедлайнами.",
      time: "10:30",
      isResolved: false,
    },
    {
      id: 2,
      author: "Мария К.",
      text: "Согласна, дедлайны нужны. Я уже начала набрасывать схему.",
      time: "11:15",
      isResolved: false,
    },
  ]);

  const handleSend = () => {
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now(),
        author: "Я",
        text: newComment,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isResolved: false,
      },
    ]);
    setNewComment("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 font-sans">
      {/* Шапка */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2 text-gray-900">
          <MessageSquare size={18} className="text-[#FF0032]" />
          <h3 className="font-bold text-lg">Комментарии</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Список комментариев */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-[#FF0032] font-bold text-sm">
              {comment.author.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm text-gray-900">
                  {comment.author}
                </span>
                <span className="text-xs text-gray-400">{comment.time}</span>
              </div>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-tr-lg rounded-b-lg border border-gray-100">
                {comment.text}
              </div>
              <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-xs text-gray-500 hover:text-[#FF0032] font-medium">
                  Ответить
                </button>
                <button className="text-xs text-gray-500 hover:text-green-600 font-medium">
                  Решено
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ввод нового комментария */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1 focus-within:border-[#FF0032] focus-within:ring-1 focus-within:ring-[#FF0032] transition-all">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            className="w-full bg-transparent resize-none outline-none text-sm p-2 max-h-32 min-h-[40px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!newComment.trim()}
            className="p-2 bg-[#FF0032] text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-[#FF0032] transition-colors mb-0.5 mr-0.5"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
