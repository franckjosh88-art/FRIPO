import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  Shield,
  MoreVertical,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { compressImage, uploadToCloudinary } from '../../utils/imageCompression';

export const ChatDetailView: React.FC = () => {
  const activeConversationId = useStore((state) => state.activeConversationId);
  const conversations = useStore((state) => state.conversations);
  const currentMessages = useStore((state) => state.currentMessages);
  const currentUser = useStore((state) => state.currentUser);
  const sendChatText = useStore((state) => state.sendChatText);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const reportEntity = useStore((state) => state.reportEntity);

  const [inputText, setInputText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  if (!conversation || !currentUser) {
    return (
      <div className="p-6 text-center">
        <p className="text-xs text-[#666666]">Conversation introuvable.</p>
        <button
          onClick={() => setCurrentView('main')}
          className="mt-3 text-xs font-bold underline"
        >
          Retour aux messages
        </button>
      </div>
    );
  }

  const otherUserId = conversation.participants.find((p) => p !== currentUser.id) || '';
  const otherUsername = conversation.participantUsernames[otherUserId] || 'Utilisateur';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const txt = inputText.trim();
    setInputText('');
    await sendChatText(txt);
  };

  const handleSendPhoto = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    try {
      const compressed = await compressImage(files[0], {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.8,
      });
      const photoUrl = await uploadToCloudinary(compressed);
      await sendChatText('', photoUrl);
    } catch (e) {
      console.error('Erreur envoi photo:', e);
    }
  };

  const handleReportUser = async () => {
    await reportEntity(otherUserId, `Signalement utilisateur @${otherUsername}`);
    setShowOptions(false);
    setToastMsg(`Utilisateur @${otherUsername} signalé.`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleBlockUser = () => {
    setShowOptions(false);
    setToastMsg(`Utilisateur @${otherUsername} bloqué.`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F3F0] text-[#111111] select-none">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => handleSendPhoto(e.target.files)}
        className="hidden"
      />

      {/* Barre supérieure */}
      <div className="bg-white px-4 py-3 border-b border-[#ECECE9] flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('main')}
            className="w-9 h-9 rounded-full bg-[#F3F3F0] flex items-center justify-center text-[#111111] active:scale-95"
          >
            <ArrowLeft size={17} className="stroke-[2.5]" />
          </button>
          <div>
            <h3 className="font-heading font-black text-xs uppercase text-[#111111]">
              @{otherUsername}
            </h3>
            <span className="text-[10px] text-[#0A84FF] font-semibold">
              En ligne sur Fripo
            </span>
          </div>
        </div>

        {/* Menu options signaler / bloquer */}
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-8 h-8 rounded-full hover:bg-[#F3F3F0] flex items-center justify-center text-[#666666]"
          >
            <MoreVertical size={16} />
          </button>

          {showOptions && (
            <div className="absolute right-0 top-9 w-40 bg-white rounded-2xl p-1.5 shadow-xl border border-[#ECECE9] z-30 animate-in fade-in">
              <button
                onClick={handleReportUser}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
              >
                <AlertTriangle size={13} />
                <span>Signaler</span>
              </button>
              <button
                onClick={handleBlockUser}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-[#555555] hover:bg-[#F3F3F0] rounded-xl flex items-center gap-2"
              >
                <Shield size={13} />
                <span>Bloquer</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="bg-[#111111] text-white text-[11px] font-bold py-1.5 px-3 text-center">
          {toastMsg}
        </div>
      )}

      {/* Carte de l'article en haut de la conversation */}
      <div className="bg-white/90 backdrop-blur-xs px-4 py-2 border-b border-[#ECECE9] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#F1F1EE] overflow-hidden shrink-0 border border-[#E0E0DB]">
            {conversation.itemImage ? (
              <img src={conversation.itemImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[7px] text-[#888]">
                Item
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-bold text-xs text-[#111111] truncate">
              {conversation.itemTitle}
            </h4>
            <span className="font-heading font-black text-xs text-[#111111]">
              {conversation.itemPrice} {conversation.itemCurrency}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
          En discussion
        </span>
      </div>

      {/* Zone de défilement des bulles de messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {currentMessages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const timeStr = new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[78%] rounded-[20px] px-3.5 py-2.5 text-xs ${
                  isMe
                    ? 'bg-[#111111] text-white rounded-br-xs'
                    : 'bg-white text-[#111111] border border-[#ECECE9] rounded-bl-xs shadow-2xs'
                }`}
              >
                {msg.imageUrl && (
                  <div className="rounded-xl overflow-hidden mb-1.5 max-w-[220px]">
                    <img src={msg.imageUrl} alt="" className="w-full h-auto object-cover" />
                  </div>
                )}
                {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                <span
                  className={`text-[9px] block text-right mt-1 ${
                    isMe ? 'text-white/60' : 'text-[#888888]'
                  }`}
                >
                  {timeStr}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Barre de saisie inférieure */}
      <form
        onSubmit={handleSend}
        className="bg-white p-3 border-t border-[#ECECE9] flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Envoyer une photo"
          className="w-9 h-9 rounded-full bg-[#F3F3F0] hover:bg-[#EAEAE7] text-[#111111] flex items-center justify-center shrink-0 active:scale-95"
        >
          <Camera size={16} />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Écris un message..."
          className="flex-1 bg-[#F3F3F0] focus:bg-[#EAEAE7] border border-transparent focus:border-[#111111] rounded-full px-4 py-2 text-xs text-[#111111] font-semibold focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          aria-label="Envoyer"
          className="w-9 h-9 rounded-full bg-[#111111] disabled:bg-[#CCCCCC] text-white flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-xs"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
