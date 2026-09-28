import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, XCircle, CreditCard, Clock, ChevronRight } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  link: string;
  timestamp: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, notifications }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigate = (link: string) => {
    navigate(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-2xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-amber-600/30">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <h2 className="text-base font-bold text-amber-400">Shop Alerts & Notifications</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-sm">
                <p className="text-2xl mb-2">🎉</p>
                All clear! No urgent inventory or payment alerts.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNavigate(n.link)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                    n.severity === 'error'
                      ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/60'
                      : n.severity === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
                      : 'bg-sky-50/70 border-sky-200 hover:bg-sky-100/60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.severity === 'error' && <XCircle className="w-4 h-4 text-rose-600" />}
                    {n.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {n.severity === 'info' && <CreditCard className="w-4 h-4 text-sky-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        n.severity === 'error'
                          ? 'text-rose-900'
                          : n.severity === 'warning'
                          ? 'text-amber-900'
                          : 'text-sky-900'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-[11px] text-stone-600 mt-1 leading-normal">{n.message}</p>
                    <div className="flex items-center text-[10px] text-stone-400 mt-2 font-medium">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="ml-auto text-amber-700 font-semibold flex items-center hover:underline">
                        Take action <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-stone-200 text-center">
            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
            >
              Dismiss Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
