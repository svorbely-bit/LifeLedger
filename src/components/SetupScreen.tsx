import { useState, useRef } from 'react';
import { db } from '../lib/db';
import { Camera } from 'lucide-react';
import { useI18n } from '../lib/i18n'; // Added import

export function SetupScreen({ onComplete }: { onComplete: (id: number) => void }) {
  const [userName, setUserName] = useState('');
  const [userPicture, setUserPicture] = useState<string>(''); // will hold base64
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n(); // Added useI18n hook

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setUserPicture(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Remove period selection since we're creating all three
    const id = await db.settings.add({
      userName: userName || 'User',
      userPicture: userPicture || '😊', // fallback just in case
      defaultPeriod: 'monthly' // Keep for compatibility
    });

    // Create the three top-level tickets for each period
    await db.tickets.add({
      name: 'Daily Spending',
      parentId: null,
      level: 1,
      period: 'daily',
      icon: '☕',
      target: null,
      isTemplate: false
    });

    await db.tickets.add({
      name: 'Monthly Spending', 
      parentId: null,
      level: 1,
      period: 'monthly',
      icon: '💵',
      target: null,
      isTemplate: false
    });

    await db.tickets.add({
      name: 'Yearly Spending',
      parentId: null,
      level: 1,
      period: 'yearly',
      icon: '🏦',
      target: null,
      isTemplate: false
    });

    onComplete(id as number);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-8">
        {t('setup.welcome')}
      </h1>

      <div className="w-full max-w-sm glass p-6 rounded-3xl flex flex-col gap-6">
        <div>
          <label className="block text-sm text-left mb-2 text-white/70">{t('setup.nameLabel')}</label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={t('setup.namePlaceholder')}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <label className="text-sm text-white/70 w-full text-left">{t('setup.pictureLabel')}</label>
          <div 
            className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 cursor-pointer overflow-hidden relative hover:bg-white/5 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {userPicture ? (
              <img src={userPicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera size={24} className="mb-1" />
                <span className="text-[10px] uppercase tracking-wider">{t('setup.upload')}</span>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
        >
          {t('setup.start')}
        </button>
      </div>
    </div>
  );
}
