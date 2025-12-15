import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import SearchInput from '@/components/SearchInput';
import NavButton from '@/components/NavButton';
import NoticeCard from '@/components/NoticeCard';
import UpdateModal from '@/components/UpdateModal';
import LegalConsultantModal from '@/components/LegalConsultantModal';
import PasswordModal from '@/components/PasswordModal';
import FloatingButtons from '@/components/FloatingButtons';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const APP_VERSION = '3.1.0';
const RELEASE_DATE = '1 يناير 2026';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'nav' | 'navSuccess' | 'navMuted';
  notice?: string;
}

const Index: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(true);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [downloadCount, setDownloadCount] = useState(15420);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'on';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Check if modal was shown this session
    if (sessionStorage.getItem('modalShown')) {
      setShowUpdateModal(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode ? 'on' : 'off');
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    sessionStorage.setItem('modalShown', 'true');
  };

  const handlePasswordSuccess = () => {
    toast.success('تم الدخول إلى بنك الاختبارات بنجاح!');
    // In a real app, this would navigate to the exam bank page
  };

  const navItems: NavItem[] = [
    { id: 'laws-yemen', icon: '📘', label: 'أهم القوانين اليمنية' },
    { id: 'legislation', icon: '⚖️', label: 'التشريعات والقوانين اليمنية' },
    { id: 'laws-arab', icon: '📙', label: 'التشريعات والقوانين العربية' },
    { id: 'rules', icon: '📗', label: 'قواعد وأحكام قانونية وقضائية' },
    { id: 'books', icon: '📕', label: 'كتب وأبحاث قانونية' },
    { id: 'templates', icon: '📝', label: 'نماذج وصيغ قانونية' },
    { id: 'library', icon: '📚', label: 'المكتبة القانونية الشاملة' },
    { id: 'inheritance', icon: '♾️', label: 'حساب المواريث' },
    { 
      id: 'exams', 
      icon: '🧠', 
      label: 'بنك اختبارات الشريعة والقانون',
      onClick: () => setShowPasswordModal(true),
      notice: '📌 تنوية/ يحتوي على أكثر من 350 اختبار محدث لجميع المستويات'
    },
    { 
      id: 'bot', 
      icon: '🤖', 
      label: 'افتح البوت القانوني في تليجرام',
      href: 'https://t.me/Moieen2025Bot',
      variant: 'navSuccess'
    },
    { 
      id: 'consultant', 
      icon: '⚖️', 
      label: 'مستشار قانوني فوري',
      onClick: () => setShowLegalModal(true)
    },
  ];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    return navItems.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, navItems]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container py-6">
        <Header authorName="معين الناصر" appName="تطبيق الناصر القانونية" />
        
        <SearchInput value={searchQuery} onChange={setSearchQuery} />

        {/* Navigation Buttons */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <React.Fragment key={item.id}>
              <NavButton
                icon={item.icon}
                label={item.label}
                onClick={item.onClick}
                href={item.href}
                variant={item.variant}
              />
              {item.notice && (
                <NoticeCard message={item.notice} icon="📌" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Copyright Notice */}
        <div className="text-center text-sm text-muted-foreground font-semibold bg-gradient-to-r from-muted to-background p-3 rounded-lg mt-6 shadow-sm">
          <span className="text-gold text-lg mx-1">⚖️</span>
          © 2025 الناصر تِك للحلول الرقمية (Alnasser Tech Digital Solutions). جميع الحقوق محفوظة.
        </div>

        <Footer downloadCount={downloadCount} version={APP_VERSION} />
      </div>

      {/* Floating Buttons */}
      <FloatingButtons isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      {/* Modals */}
      <UpdateModal 
        isOpen={showUpdateModal}
        onClose={handleCloseUpdateModal}
        version={APP_VERSION}
        releaseDate={RELEASE_DATE}
      />

      <LegalConsultantModal 
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
};

export default Index;
