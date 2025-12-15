import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ArrowUp, MessageCircle } from 'lucide-react';

interface FloatingButtonsProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ isDarkMode, onToggleDarkMode }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Dark Mode Toggle */}
      <Button
        variant="floating"
        size="icon"
        onClick={onToggleDarkMode}
        className="fixed bottom-6 right-6 z-50 bg-foreground text-background hover:bg-foreground/80"
        title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      {/* Scroll to Top */}
      <Button
        variant="floating"
        size="icon"
        onClick={scrollToTop}
        className="fixed bottom-24 left-6 z-50 gradient-primary text-primary-foreground"
        title="العودة للأعلى"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>

      {/* Contact Button */}
      <a 
        href="https://t.me/MuenAlnaser" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50"
      >
        <Button variant="contact" className="px-5 py-3 gap-2">
          <MessageCircle className="h-5 w-5" />
          اتصل بنا
        </Button>
      </a>
    </>
  );
};

export default FloatingButtons;
