import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../lib/firebase';
import { useStore } from '../../store/useStore';
import type { UserProfile } from '../../types';

export const AuthView: React.FC = () => {
  const [isRegister, setIsRegister] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginUser = useStore((state) => state.loginUser);
  const loginWithGoogleAction = useStore((state) => state.loginWithGoogleAction);
  const setCurrentView = useStore((state) => state.setCurrentView);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogleAction();
    } catch (err: any) {
      console.error('Erreur Google:', err);
      let frenchMsg = 'Échec de la connexion avec Google.';
      if (err.code === 'auth/popup-closed-by-user') {
        frenchMsg = 'La fenêtre de connexion Google a été fermée.';
      } else if (err.message) {
        frenchMsg = err.message;
      }
      setErrorMsg(frenchMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (isRegister && (!cleanUsername || cleanUsername.length < 3)) {
      setErrorMsg('Le nom d’utilisateur doit faire au moins 3 caractères (lettres, chiffres, _).');
      return;
    }

    if (!email.trim() || !password || password.length < 6) {
      setErrorMsg('Veuillez entrer une adresse e-mail valide et un mot de passe d’au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      if (auth && isFirebaseConfigured) {
        if (isRegister) {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          const profile: UserProfile = {
            id: cred.user.uid,
            username: cleanUsername,
            email: email.trim(),
            followersCount: 0,
            followingCount: 0,
            ratingAvg: 0,
            ratingCount: 0,
            createdAt: Date.now(),
          };
          await loginUser(profile);
        } else {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
          const profile: UserProfile = {
            id: cred.user.uid,
            username: cleanUsername || cred.user.email?.split('@')[0] || 'fripo_user',
            email: cred.user.email || email.trim(),
            followersCount: 0,
            followingCount: 0,
            ratingAvg: 0,
            ratingCount: 0,
            createdAt: Date.now(),
          };
          await loginUser(profile);
        }
      } else {
        // Mode résilient hors-ligne / direct
        const mockId = `USR-${cleanUsername || Date.now().toString(36)}`;
        const profile: UserProfile = {
          id: mockId,
          username: cleanUsername || email.split('@')[0] || 'fripo_user',
          email: email.trim(),
          followersCount: 0,
          followingCount: 0,
          ratingAvg: 0,
          ratingCount: 0,
          createdAt: Date.now(),
        };
        await loginUser(profile);
      }
    } catch (err: any) {
      console.error('Erreur Auth:', err);
      let frenchMsg = 'Une erreur est survenue lors de la connexion.';
      if (err.code === 'auth/email-already-in-use') {
        frenchMsg = 'Cette adresse e-mail est déjà associée à un compte Fripo.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        frenchMsg = 'Adresse e-mail ou mot de passe incorrect.';
      } else if (err.code === 'auth/weak-password') {
        frenchMsg = 'Le mot de passe doit comporter au moins 6 caractères.';
      } else if (err.message) {
        frenchMsg = err.message;
      }
      setErrorMsg(frenchMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F3F3F0] text-[#111111] p-5 justify-between animate-in fade-in select-none">
      {/* Barre supérieure */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('onboarding')}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#111111] shadow-2xs active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>
          <span className="font-heading font-black text-xl tracking-tight uppercase">
            FRIPO
          </span>
          <div className="w-10" />
        </div>

        {/* Titre */}
        <div className="mb-6">
          <h1 className="font-heading font-black text-2xl uppercase tracking-tight">
            {isRegister ? 'Rejoins la communauté' : 'Bon retour sur Fripo'}
          </h1>
          <p className="text-xs text-[#666666] font-medium mt-1">
            {isRegister
              ? 'Crée ton profil unique pour vendre, chiner et suivre la valeur de ton closet.'
              : 'Connecte-toi pour accéder à tes annonces et tes messages.'}
          </p>
        </div>

        {/* Message d'erreur */}
        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-3 flex items-start gap-2.5 animate-in slide-in-from-top-1">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#333333] mb-1">
                Pseudo unique (@) *
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]"
                />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: vintage_hunter"
                  className="w-full bg-white border border-[#DDD9C9] focus:border-[#111111] rounded-[18px] pl-10 pr-4 py-3 text-xs text-[#111111] font-semibold focus:outline-none shadow-2xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#333333] mb-1">
              Adresse e-mail *
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton.email@fripo.com"
                className="w-full bg-white border border-[#DDD9C9] focus:border-[#111111] rounded-[18px] pl-10 pr-4 py-3 text-xs text-[#111111] font-semibold focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#333333] mb-1">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#DDD9C9] focus:border-[#111111] rounded-[18px] pl-10 pr-4 py-3 text-xs text-[#111111] font-semibold focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-[#111111] hover:bg-black text-white py-4 px-6 rounded-[22px] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-between shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>{isRegister ? "Créer mon compte" : "Se connecter"}</span>
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight size={16} className="stroke-[2.5]" />
            )}
          </button>
        </form>

        {/* Séparateur OU */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[#DDD9C9]" />
          <span className="text-[10px] font-bold text-[#888888] uppercase">ou</span>
          <div className="flex-1 h-px bg-[#DDD9C9]" />
        </div>

        {/* Bouton Connexion Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-neutral-50 text-[#111111] border border-[#DDD9C9] py-3.5 px-6 rounded-[22px] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-2xs active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuer avec Google</span>
        </button>
      </div>

      {/* Basculer entre Inscription et Connexion */}
      <div className="text-center pt-6 pb-2">
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setErrorMsg(null);
          }}
          className="text-xs font-semibold text-[#555555] hover:text-[#111111] underline transition-colors"
        >
          {isRegister
            ? 'Tu as déjà un compte ? Connecte-toi ici →'
            : 'Pas encore de compte ? Inscris-toi ici →'}
        </button>
      </div>
    </div>
  );
};
