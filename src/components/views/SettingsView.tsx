import React, { useState } from 'react';
import { ArrowLeft, User, LogOut, Cloud, Save, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const SettingsView: React.FC = () => {
  const currentUser = useStore((state) => state.currentUser);
  const logoutUser = useStore((state) => state.logoutUser);
  const updateUserBio = useStore((state) => state.updateUserBio);
  const setCurrentView = useStore((state) => state.setCurrentView);

  const [bio, setBio] = useState(currentUser?.bio || '');
  const [website, setWebsite] = useState(currentUser?.website || '');
  const [cloudName, setCloudName] = useState(
    localStorage.getItem('fripo_cloudinary_cloud_name') ||
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
    ''
  );
  const [uploadPreset, setUploadPreset] = useState(
    localStorage.getItem('fripo_cloudinary_upload_preset') ||
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
    ''
  );
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cloudName) {
      localStorage.setItem('fripo_cloudinary_cloud_name', cloudName.trim());
    }
    if (uploadPreset) {
      localStorage.setItem('fripo_cloudinary_upload_preset', uploadPreset.trim());
    }
    await updateUserBio(bio.trim(), website.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-full pb-28 px-4 pt-4 bg-[#F6F6F4] text-[#111111] select-none animate-in fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-[#ECECE9]">
        <button
          onClick={() => setCurrentView('main')}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#111111] shadow-2xs active:scale-95"
        >
          <ArrowLeft size={18} className="stroke-[2.5]" />
        </button>
        <h2 className="font-heading font-black text-sm uppercase">Réglages</h2>
        <div className="w-10" />
      </div>

      {saved && (
        <div className="my-3 bg-[#1DB954]/15 border border-[#1DB954] text-[#1DB954] text-xs font-bold p-3 rounded-2xl flex items-center gap-2">
          <Check size={16} />
          <span>Réglages enregistrés !</span>
        </div>
      )}

      <form onSubmit={handleSave} className="mt-4 space-y-4">
        {/* Profil */}
        <div className="bg-white rounded-[24px] p-4 border border-[#ECECE9] space-y-3">
          <h3 className="font-heading font-black text-xs uppercase text-[#111111] flex items-center gap-1.5">
            <User size={15} /> Profil public
          </h3>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
              Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Passionné de vintage 90s, pièces d'archives..."
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs text-[#111111] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
              Site web ou portfolio
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://instagram.com/mon_closet"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs text-[#111111] focus:outline-none"
            />
          </div>
        </div>

        {/* Configuration Cloudinary */}
        <div className="bg-white rounded-[24px] p-4 border border-[#ECECE9] space-y-3">
          <h3 className="font-heading font-black text-xs uppercase text-[#111111] flex items-center gap-1.5">
            <Cloud size={15} /> Stockage Cloudinary (Photos)
          </h3>
          <p className="text-[10px] text-[#777777]">
            Upload unsigned avec compression navigateur (1200 px max, 0.8).
          </p>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
              Cloud Name
            </label>
            <input
              type="text"
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              placeholder="ex: mon_cloud"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs font-mono text-[#111111] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
              Upload Preset Unsigned
            </label>
            <input
              type="text"
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder="ex: fripo_preset"
              className="w-full bg-[#F9F9F7] border border-[#E2E2DC] rounded-xl px-3 py-2 text-xs font-mono text-[#111111] focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#111111] text-white py-3.5 rounded-[20px] font-heading font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95"
        >
          <Save size={15} />
          <span>Enregistrer les modifications</span>
        </button>

        <button
          type="button"
          onClick={logoutUser}
          className="w-full mt-3 bg-red-50 text-red-600 border border-red-200 py-3 rounded-[20px] font-heading font-bold text-xs uppercase flex items-center justify-center gap-1.5"
        >
          <LogOut size={15} />
          <span>Se déconnecter</span>
        </button>
      </form>
    </div>
  );
};
