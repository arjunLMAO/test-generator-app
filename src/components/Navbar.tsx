import React from 'react';

export type ActiveNavTab = 'dashboard' | 'chapters' | 'analytics' | 'history' | 'question-bank';

interface NavbarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  hasActiveTest: boolean;
  onResumeTest: () => void;
  onStartFullTest: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  hasActiveTest,
  onResumeTest,
  onStartFullTest,
}) => {
  const navItems: Array<{ id: ActiveNavTab; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'chapters', label: 'Select Chapters' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'history', label: 'History' },
    { id: 'question-bank', label: 'Question Bank' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Brand Title (Single text element wordmark per Top Bar Contract) */}
      <button
        type="button"
        onClick={() => onSelectTab('dashboard')}
        className="text-2xl font-display tracking-tight text-slate-100 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        Vectra JEE
      </button>

      {/* Zone 2: 5 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                isActive
                  ? 'text-slate-100 border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3">
        {hasActiveTest ? (
          <button
            type="button"
            onClick={onResumeTest}
            className="px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Resume Active Test
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartFullTest}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start Full Test
          </button>
        )}
      </div>
    </header>
  );
};
