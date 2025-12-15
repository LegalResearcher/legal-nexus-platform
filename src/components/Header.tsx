import React from 'react';

interface HeaderProps {
  authorName: string;
  appName: string;
}

const Header: React.FC<HeaderProps> = ({ authorName, appName }) => {
  return (
    <>
      {/* Author Card */}
      <div className="flex items-center gap-4 bg-gradient-to-l from-card to-muted p-4 rounded-xl shadow-card mb-6">
        <div className="relative w-20 h-20 rounded-full border-[3px] border-double border-gold bg-card shadow-lg overflow-hidden flex items-center justify-center">
          <span className="text-3xl">⚖️</span>
        </div>
        <div className="flex flex-col">
          <div className="text-base font-semibold text-navy dark:text-foreground">
            إعداد وإشراف: ⚖️ <span className="text-navy-light dark:text-accent">أ. {authorName}</span>
          </div>
          <div className="text-sm text-muted-foreground">{appName}</div>
        </div>
      </div>

      {/* Main Header */}
      <header className="gradient-header py-6 px-5 text-center text-primary-foreground border-b-4 border-navy dark:border-accent rounded-b-2xl mb-6">
        <h1 className="text-2xl font-bold m-0">منصة الناصر القانونية ⚖️</h1>
      </header>
    </>
  );
};

export default Header;
