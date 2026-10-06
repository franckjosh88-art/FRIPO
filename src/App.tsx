import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { MobileFrame } from './components/layout/MobileFrame';
import { Header } from './components/common/Header';
import { FloatingNavbar } from './components/layout/FloatingNavbar';
import { OnboardingView } from './components/views/OnboardingView';
import { AuthView } from './components/views/AuthView';
import { BuyFeedView } from './components/views/BuyFeedView';
import { SellView } from './components/views/SellView';
import { LensView } from './components/views/LensView';
import { MessagesView } from './components/views/MessagesView';
import { ChatDetailView } from './components/views/ChatDetailView';
import { ClosetView } from './components/views/ClosetView';
import { ItemDetailView } from './components/views/ItemDetailView';
import { SettingsView } from './components/views/SettingsView';
import type { ClothingItem } from './types';

export default function App() {
  const currentView = useStore((state) => state.currentView);
  const activeTab = useStore((state) => state.activeTab);
  const selectedItemId = useStore((state) => state.selectedItemId);
  const viewingUserId = useStore((state) => state.viewingUserId);
  const items = useStore((state) => state.items);
  const isLoading = useStore((state) => state.isLoading);
  const initializeStore = useStore((state) => state.initializeStore);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setSelectedItemId = useStore((state) => state.setSelectedItemId);
  const setViewingUserId = useStore((state) => state.setViewingUserId);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const handleSelectItem = (item: ClothingItem) => {
    setSelectedItemId(item.id);
    setCurrentView('item_detail');
  };

  const handleOpenSellerCloset = (sellerId: string) => {
    setViewingUserId(sellerId);
    setCurrentView('user_closet');
  };

  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) : null;

  if (isLoading) {
    return (
      <MobileFrame>
        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-center p-6 bg-[#F3F3F0]">
          <div className="w-16 h-16 rounded-[22px] bg-[#111111] text-white flex items-center justify-center font-heading font-black text-2xl shadow-xl mb-4 animate-pulse">
            F
          </div>
          <span className="font-heading font-black text-xl text-[#111111] uppercase tracking-tighter">
            FRIPO
          </span>
          <p className="text-xs text-[#777777] font-medium mt-1">
            Découvre ce que valent tes habits...
          </p>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <AnimatePresence mode="wait">
        {/* ÉCRAN 1 : ONBOARDING */}
        {currentView === 'onboarding' && (
          <motion.div
            key="view-onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <OnboardingView />
          </motion.div>
        )}

        {/* AUTH (CONNEXION / INSCRIPTION) */}
        {currentView === 'auth' && (
          <motion.div
            key="view-auth"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <AuthView />
          </motion.div>
        )}

        {/* VUE PRINCIPALE (5 ONGLETS) */}
        {currentView === 'main' && (
          <motion.div
            key="view-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col relative"
          >
            <Header />

            <main className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`tab-${activeTab}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="flex-1 flex flex-col"
                >
                  {activeTab === 'buy' && (
                    <BuyFeedView onSelectItem={handleSelectItem} />
                  )}
                  {activeTab === 'sell' && <SellView />}
                  {activeTab === 'lens' && <LensView />}
                  {activeTab === 'messages' && <MessagesView />}
                  {activeTab === 'closet' && (
                    <ClosetView onSelectItem={handleSelectItem} />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            <FloatingNavbar />
          </motion.div>
        )}

        {/* DÉTAIL D'UN ARTICLE */}
        {currentView === 'item_detail' && selectedItem && (
          <motion.div
            key="view-item-detail"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="flex-1 flex flex-col"
          >
            <ItemDetailView
              item={selectedItem}
              onBack={() => setCurrentView('main')}
              onOpenSellerCloset={handleOpenSellerCloset}
            />
          </motion.div>
        )}

        {/* CLOSET D'UN AUTRE UTILISATEUR */}
        {currentView === 'user_closet' && (
          <motion.div
            key="view-user-closet"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-white p-3 border-b border-[#ECECE9] flex items-center gap-3">
              <button
                onClick={() => setCurrentView('main')}
                className="w-9 h-9 rounded-full bg-[#F3F3F0] flex items-center justify-center text-[#111111]"
              >
                ←
              </button>
              <span className="font-heading font-black text-xs uppercase">
                Closet vendeur
              </span>
            </div>
            <ClosetView
              onSelectItem={handleSelectItem}
              userIdToView={viewingUserId}
            />
          </motion.div>
        )}

        {/* CHAT DÉTAILLÉ */}
        {currentView === 'chat' && (
          <motion.div
            key="view-chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col h-full"
          >
            <ChatDetailView />
          </motion.div>
        )}

        {/* RÉGLAGES */}
        {currentView === 'settings' && (
          <motion.div
            key="view-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <SettingsView />
          </motion.div>
        )}
      </AnimatePresence>
    </MobileFrame>
  );
}
