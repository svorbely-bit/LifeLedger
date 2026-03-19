import { useState, useEffect } from 'react';
import { Download, Upload, Wallet, History, TrendingUp, CheckSquare, LogOut, Camera, X, Edit2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLiveQuery } from 'dexie-react-hooks';
import { SetupScreen } from './components/SetupScreen';
import { LoginScreen } from './components/LoginScreen';
import { db } from './lib/db';
import { useRef } from 'react';

import TabSpending from './components/views/TabSpending';
import TabLogs from './components/views/TabLogs';
import TabInflation from './components/views/TabInflation';
import TabChores from './components/views/TabChores';
import { I18nProvider, useI18n } from './lib/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<'spend' | 'logs' | 'inflation' | 'chores'>('spend');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState<number | null>(() => {
    // Get current user from localStorage on mount
    return parseInt(localStorage.getItem('currentUser') || '0') || null;
  });
  const { t, language, toggleLanguage } = useI18n();
  
  const settings = useLiveQuery(() => db.settings.toArray());
  const existingTickets = useLiveQuery(() => {
    const firstSetting = db.settings.toCollection().first();
    return firstSetting.then(s => {
      if (!s) return [];
      return db.tickets.where('profileId').equals(s.id!).toArray();
    });
  });
  const isReady = settings !== undefined;
  const userSettings = settings?.find(s => s.id === currentUser);

  // Auto-login if there's only one profile and no current user is set (but not if just logged out)
  useEffect(() => {
    if (settings && settings.length === 1 && !currentUser && !localStorage.getItem('justLoggedOut')) {
      const profileId = settings[0].id!;
      localStorage.setItem('currentUser', profileId.toString());
      setCurrentUser(profileId);
    }
  }, [settings, currentUser]);

  const handleLogout = async () => {
    // Set flag to prevent auto-login
    localStorage.setItem('justLoggedOut', 'true');
    // Clear current user from localStorage
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    
    // Force reload to show login screen
    window.location.href = window.location.href;
  };

  const handleExport = async () => {
    const data = {
      settings: await db.settings.toArray(),
      tickets: await db.tickets.toArray(),
      expenseLogs: await db.expenseLogs.toArray(),
      priceHistory: await db.priceHistory.toArray(),
      choreItems: await db.choreItems.toArray(),
      choreLogs: await db.choreLogs.toArray(),
    };
    const userName = userSettings?.userName || 'user';
    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-ledger-backup-${userName}-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.settings && data.tickets) {
        await db.transaction('rw', [db.settings, db.tickets, db.expenseLogs, db.priceHistory, db.choreItems, db.choreLogs], async () => {
          await db.settings.clear();
          await db.tickets.clear();
          await db.expenseLogs.clear();
          await db.priceHistory.clear();
          await db.choreItems.clear();
          await db.choreLogs.clear();

          if (data.settings.length) await db.settings.bulkAdd(data.settings);
          if (data.tickets.length) await db.tickets.bulkAdd(data.tickets);
          if (data.expenseLogs.length) await db.expenseLogs.bulkAdd(data.expenseLogs);
          if (data.priceHistory.length) await db.priceHistory.bulkAdd(data.priceHistory);
          if (data.choreItems.length) await db.choreItems.bulkAdd(data.choreItems);
          if (data.choreLogs.length) await db.choreLogs.bulkAdd(data.choreLogs);
        });
        alert('Data imported successfully! The app will reload to apply changes.');
        window.location.reload();
      } else {
        alert('Invalid backup file. Please make sure this is a valid LifeLedger backup.');
      }
    } catch(err) {
      console.error(err);
      alert('Failed to import data. Please check the file and try again.');
    }
    // Reset file input
    e.target.value = '';
  };

  // const navItems = [ // This array is no longer used for rendering the nav
  //   { id: 'spend', label: 'Spending', icon: LayoutDashboard },
  //   { id: 'logs', label: 'Logs', icon: History },
  //   { id: 'inflation', label: 'Inflation', icon: TrendingUp },
  //   { id: 'chores', label: 'Chores', icon: CheckSquare },
  // ] as const;

  if (!isReady) return null;

  // Check if user is logged in
  if (!currentUser || !userSettings) {
    // Check if there are existing tickets to determine if this is first-time setup or login
    if (existingTickets && existingTickets.length > 0) {
      // User has existing data - show login screen with existing user data
      return (
        <div className="min-h-screen bg-background text-foreground max-w-md mx-auto">
          <LoginScreen 
            onComplete={(profileId) => {
              // Clear justLoggedOut flag and set current user
              localStorage.removeItem('justLoggedOut');
              localStorage.setItem('currentUser', profileId.toString());
              setCurrentUser(profileId);
              // Force reload to trigger login state change
              window.location.reload();
            }} 
          />
        </div>
      );
    } else {
      // First-time user - show setup screen
      return (
        <div className="min-h-screen bg-background text-foreground max-w-md mx-auto">
          <SetupScreen onComplete={(profileId) => {
            // Clear justLoggedOut flag and set current user
            localStorage.removeItem('justLoggedOut');
            localStorage.setItem('currentUser', profileId.toString());
            setCurrentUser(profileId);
            // Force reload to trigger login state change
            window.location.reload();
          }} />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl shadow-purple-900/20">
      
      {/* Header */}
      <header className="px-6 py-4 glass z-10 sticky top-0 border-b border-white/5 flex justify-between items-center">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setIsEditingProfile(true)}
          title={t('app.editProfile')}
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner border border-white/10 overflow-hidden shrink-0 group-hover:border-purple-500/50 transition-colors relative">
             {userSettings.userPicture.startsWith('data:image') 
               ? <img src={userSettings.userPicture} alt="User" className="w-full h-full object-cover" />
               : <span className="text-xl">{userSettings.userPicture}</span>
             }
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Edit2 size={14} className="text-white" />
             </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent leading-tight group-hover:from-purple-300 group-hover:to-pink-400 transition-all">
              LifeLedger
            </h1>
            <p className="text-xs text-white/50 font-medium group-hover:text-white/70 transition-colors">Hi, {userSettings.userName}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={toggleLanguage} 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors text-white font-bold"
          >
            {language.toUpperCase()}
          </button>
          <button 
            onClick={handleExport} 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors text-white"
            title={t('app.export')}
          >
            <Download size={18} />
          </button>
          <label className="p-2 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors" title={t('app.import')}>
             <Upload size={18} className="text-white/70" />
             <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl transition-colors text-red-400"
            title={t('app.logout')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 relative">
        <div className="absolute top-0 left-[-20%] w-[140%] h-[300px] bg-purple-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        
        {activeTab === 'spend' && <TabSpending currentUser={currentUser} />}
        {activeTab === 'logs' && <TabLogs currentUser={currentUser} />}
        {activeTab === 'inflation' && <TabInflation currentUser={currentUser} />}
        {activeTab === 'chores' && <TabChores currentUser={currentUser} />}
      </main>

      {/* Bottom Navigation Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-3xl border-t border-white/10 pb-safe z-50">
        <div className="flex justify-around items-center p-2 max-w-lg mx-auto">
          <button onClick={() => setActiveTab('spend')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeTab === 'spend' ? 'bg-purple-500/20 text-purple-400' : 'text-white/40 hover:text-white/80'}`}>
            <Wallet size={24} />
            <span className="text-[10px] uppercase tracking-wider mt-1">{t('app.spending')}</span>
          </button>
          
          <button onClick={() => setActiveTab('logs')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeTab === 'logs' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/80'}`}>
            <History size={24} />
            <span className="text-[10px] uppercase tracking-wider mt-1">{t('app.logs')}</span>
          </button>

          <button onClick={() => setActiveTab('inflation')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeTab === 'inflation' ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:text-white/80'}`}>
            <TrendingUp size={24} />
            <span className="text-[10px] uppercase tracking-wider mt-1">{t('app.inflation')}</span>
          </button>

          <button onClick={() => setActiveTab('chores')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeTab === 'chores' ? 'bg-blue-500/20 text-blue-400' : 'text-white/40 hover:text-white/80'}`}>
            <CheckSquare size={24} />
            <span className="text-[10px] uppercase tracking-wider mt-1">{t('app.chores')}</span>
          </button>
        </div>
      </nav>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <EditProfileModal 
          settings={userSettings} 
          onClose={() => setIsEditingProfile(false)} 
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <ConfirmationModal 
          title={t('app.logout')}
          message={t('app.logoutConfirm')}
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}

function EditProfileModal({ settings, onClose }: { settings: any, onClose: () => void }) {
  const { t } = useI18n();
  const [userName, setUserName] = useState(settings.userName);
  const [userPicture, setUserPicture] = useState(settings.userPicture);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    await db.settings.update(settings.id, {
      userName,
      userPicture
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass border border-white/10 p-8 rounded-[40px] flex flex-col gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">{t('app.editProfile')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} className="text-white/40" />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-32 h-32 rounded-full border-2 border-white/10 flex items-center justify-center cursor-pointer overflow-hidden relative group hover:border-purple-500/50 transition-all shadow-xl"
              onClick={() => fileInputRef.current?.click()}
            >
              {userPicture && userPicture.startsWith('data:image') ? (
                <img src={userPicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">{userPicture || '😊'}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={32} className="text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <p className="text-xs text-white/40 font-medium">{t('setup.pictureHelp')}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/60 ml-1">{t('profile.name')}</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-lg"
              placeholder={t('setup.namePlaceholder')}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg"
          >
            {t('profile.save')}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 text-white/60 font-semibold hover:text-white transition-colors"
          >
            {t('profile.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({ title, message, onConfirm, onCancel }: { title: string, message: string, onConfirm: () => void, onCancel: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass border border-white/10 p-8 rounded-[40px] flex flex-col gap-6 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
        
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-white/60 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-red-600 active:scale-[0.98] transition-all text-lg"
          >
            {t('app.logout')}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 text-white/60 font-semibold hover:text-white transition-colors"
          >
            {t('profile.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
       <AppContent />
    </I18nProvider>
  );
}
