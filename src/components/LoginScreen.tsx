import { useState, useRef, useEffect } from 'react';
import { db } from '../lib/db';
import { Camera, Edit2, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export function LoginScreen({ 
  onComplete 
}: { 
  onComplete: (id: number) => void; 
}) {
  const [userName, setUserName] = useState('');
  const [userPicture, setUserPicture] = useState<string>('');
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [existingProfiles, setExistingProfiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const profiles = await db.settings.toArray();
    setExistingProfiles(profiles);
    if (profiles.length === 0) setShowCreateNew(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') setUserPicture(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProfile = async () => {
    if (!userName.trim()) return;
    const id = await db.settings.add({
      userName: userName,
      userPicture: userPicture || '😊',
      defaultPeriod: 'monthly'
    });
    onComplete(id as number);
  };

  const handleDeleteProfile = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('setup.deleteConfirm'))) {
      await db.settings.delete(id);
      loadProfiles();
    }
  };

  if (showCreateNew) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          {existingProfiles.length > 0 && (
            <button onClick={() => setShowCreateNew(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40"><ArrowLeft size={24} /></button>
          )}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">{t('setup.createNew')}</h1>
        </div>
        <div className="w-full max-w-sm glass p-8 rounded-[40px] flex flex-col gap-6 border border-white/10">
          <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white" placeholder={t('setup.namePlaceholder')} value={userName} onChange={(e) => setUserName(e.target.value)} />
          <div className="w-28 h-28 rounded-full border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative self-center" onClick={() => fileInputRef.current?.click()}>
            {userPicture ? <img src={userPicture} alt="Profile" className="w-full h-full object-cover" /> : <Camera size={32} />}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
          <button onClick={handleCreateProfile} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-2xl shadow-lg">{t('setup.start')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-in fade-in duration-500">
      <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">LifeLedger</h1>
      <p className="text-white/40 mb-10 uppercase text-xs tracking-widest">{t('setup.selectProfile')}</p>
      <div className="w-full max-w-sm flex flex-col gap-4">
        {existingProfiles.map((profile) => (
          <div key={profile.id} onClick={() => onComplete(profile.id!)} className="glass p-4 rounded-3xl border border-white/10 flex items-center justify-between hover:bg-white/5 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/5 overflow-hidden flex items-center justify-center">
                {profile.userPicture.startsWith('data:image') ? <img src={profile.userPicture} className="w-full h-full object-cover" /> : <span className="text-2xl">{profile.userPicture}</span>}
              </div>
              <h3 className="text-lg font-bold text-white">{profile.userName}</h3>
            </div>
            <button onClick={(e) => handleDeleteProfile(profile.id!, e)} className="p-3 text-white/20 hover:text-red-400"><Trash2 size={18} /></button>
          </div>
        ))}
        <button onClick={() => setShowCreateNew(true)} className="w-full p-5 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center gap-3 text-white/40 hover:text-white transition-all"><Plus size={20} /> <span className="font-bold">{t('setup.createNew')}</span></button>
      </div>
    </div>
  );
}