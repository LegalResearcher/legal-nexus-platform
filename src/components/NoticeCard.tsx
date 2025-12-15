import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NoticeCardProps {
  message: string;
  icon?: string;
}

const NoticeCard: React.FC<NoticeCardProps> = ({ message, icon = "⚠️" }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-warning-bg border-r-[6px] border-warning py-3 px-4 pr-10 rounded-lg text-sm font-semibold text-amber-800 dark:text-amber-200 dark:bg-amber-900/30 shadow-sm my-3 text-center">
      <span className="absolute right-3 top-2 text-lg">{icon}</span>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute left-3 top-2 text-inherit hover:opacity-70 transition-opacity"
      >
        <X className="h-5 w-5" />
      </button>
      {message}
    </div>
  );
};

export default NoticeCard;
