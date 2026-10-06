import React from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { EmptyPlaceholderImage } from '../common/EmptyPlaceholderImage';

export const MessagesView: React.FC = () => {
  const conversations = useStore((state) => state.conversations);
  const currentUser = useStore((state) => state.currentUser);
  const setActiveConversationId = useStore((state) => state.setActiveConversationId);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const refreshMessages = useStore((state) => state.refreshMessages);

  const handleOpenConversation = async (convoId: string) => {
    setActiveConversationId(convoId);
    await refreshMessages(convoId);
    setCurrentView('chat');
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <p className="text-xs text-[#666666] mb-3">
          Connecte-toi pour consulter tes messages.
        </p>
        <button
          onClick={() => setCurrentView('auth')}
          className="bg-[#111111] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase font-heading"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-28 px-4 pt-3 bg-transparent text-[#111111] select-none animate-in fade-in">
      <div className="mb-4">
        <h1 className="font-heading font-black text-2xl uppercase tracking-tight text-white drop-shadow-md">
          Messages
        </h1>
        <p className="text-xs text-white/80 font-medium">
          Tes échanges avec les acheteurs et vendeurs
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-[#F6F6F4] rounded-[28px] border border-[#ECECE9] p-8 text-center my-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#EAEAE7] flex items-center justify-center text-[#111111] mb-3 shadow-2xs">
            <MessageSquare size={28} className="stroke-[2]" />
          </div>
          <h3 className="font-heading font-black text-sm uppercase text-[#111111]">
            Aucune conversation pour l'instant
          </h3>
          <p className="text-xs text-[#666666] mt-1 max-w-[240px] leading-relaxed">
            Écris à un vendeur sur une annonce ou attends qu'un acheteur te contacte.
          </p>
          <button
            onClick={() => setActiveTab('buy')}
            className="mt-5 bg-[#111111] text-white px-5 py-2.5 rounded-full font-heading font-bold text-xs uppercase flex items-center gap-1.5"
          >
            <span>Explorer les pièces</span>
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((convo) => {
            // Identifier l'autre participant
            const otherUserId = convo.participants.find((p) => p !== currentUser.id) || '';
            const otherUsername = convo.participantUsernames[otherUserId] || 'Utilisateur';
            const otherPhoto = convo.participantPhotos?.[otherUserId];

            const dateStr = new Date(convo.updatedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={convo.id}
                onClick={() => handleOpenConversation(convo.id)}
                className="cursor-pointer bg-[#FAF9F7] hover:bg-[#F3F3F0] p-3 rounded-[22px] border border-[#ECECE9] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar interlocuteur */}
                  <div className="w-12 h-12 rounded-full bg-[#EAEAE7] overflow-hidden shrink-0 flex items-center justify-center font-heading font-bold text-xs">
                    {otherPhoto ? (
                      <img src={otherPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      otherUsername.substring(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-black text-xs text-[#111111] truncate">
                        @{otherUsername}
                      </h4>
                      <span className="text-[10px] text-[#888888]">{dateStr}</span>
                    </div>

                    <p className="text-xs text-[#555555] truncate mt-0.5 font-medium">
                      {convo.lastMessage || 'Nouvelle conversation'}
                    </p>

                    <span className="text-[10px] font-bold text-[#0A84FF] truncate block">
                      Article : {convo.itemTitle}
                    </span>
                  </div>
                </div>

                {/* Miniature de l'article concerné */}
                <div className="w-11 h-11 rounded-xl bg-[#EAEAE7] overflow-hidden shrink-0 border border-[#E0E0DB] ml-2">
                  {convo.itemImage ? (
                    <img src={convo.itemImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[7px] text-[#777]">
                      Item
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
