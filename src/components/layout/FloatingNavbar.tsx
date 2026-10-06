import React from 'react';
import { Shirt, DollarSign, Camera, MessageSquare, Shirt as CoatHanger } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore, type MainTab } from '../../store/useStore';

export const FloatingNavbar: React.FC = () => {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const currentView = useStore((state) => state.currentView);
  const conversations = useStore((state) => state.conversations);
  const currentUser = useStore((state) => state.currentUser);

  // Masquer la barre sur les écrans secondaires
  if (
    currentView === 'onboarding' ||
    currentView === 'auth' ||
    currentView === 'chat' ||
    currentView === 'edit_item'
  ) {
    return null;
  }

  // Nombre de messages non lus
  const unreadCount = conversations.reduce((acc, c) => {
    if (currentUser && c.lastSenderId !== currentUser.id) {
      return acc + (c.unreadCount?.[currentUser.id] || 0);
    }
    return acc;
  }, 0);

  const navItems: { tab: MainTab; label: string; icon: React.FC<{ size: number; className?: string }> }[] = [
    { tab: 'buy', label: 'Acheter', icon: Shirt },
    { tab: 'sell', label: 'Vendre', icon: DollarSign },
    { tab: 'lens', label: 'Lens', icon: Camera },
    { tab: 'messages', label: 'Messages', icon: MessageSquare },
    { tab: 'closet', label: 'Mon closet', icon: CoatHanger },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Navigation principale"
      className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[390px] z-40 bg-[#111111] text-[#888888] pt-2 pb-5 px-3 border-t border-[#222222] flex items-center justify-around select-none"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.tab && currentView === 'main';
        const Icon = item.icon;

        return (
          <motion.button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            whileTap={{ scale: 0.92 }}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 ${
              isActive ? 'text-white' : 'text-[#888888] hover:text-[#CCCCCC]'
            }`}
          >
            <div className="relative flex items-center justify-center w-8 h-8">
              <Icon
                size={20}
                className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}
              />

              {item.tab === 'messages' && unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#0A84FF]" />
              )}
            </div>

            <span className="text-[10px] font-semibold tracking-tight leading-none mt-0.5">
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
};
