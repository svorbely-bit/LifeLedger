import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, ChevronRight, Home, Trash2, ArrowLeft } from 'lucide-react';
import { db } from '../../lib/db';
import { EmojiPicker } from '../EmojiPicker';
import { CircularProgress } from '../CircularProgress';
import { TRexMood } from '../TRexMood';
import { format } from 'date-fns';
import { useI18n } from '../../lib/i18n';

export default function TabChores({ currentUser }: { currentUser: number | null }) {
  const { t } = useI18n();
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('✨');
  const [isRecurring, setIsRecurring] = useState(true);

  const choreItems = useLiveQuery(() => {
    if (!currentUser) return [];
    return db.choreItems.where('profileId').equals(currentUser).toArray();
  }) || [];
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const choreLogs = useLiveQuery(() => {
    if (!currentUser) return [];
    return db.choreLogs.where('profileId').equals(currentUser).toArray();
  }) || [];

  // Daily reset logic
  useEffect(() => {
    const performDailyReset = async () => {
      if (!currentUser) return;
      
      const lastResetDate = localStorage.getItem('lastChoreResetDate');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      if (lastResetDate !== today) {
        // Reset completion status: delete all chore logs (regardless of recurring status)
        await db.choreLogs.where('profileId').equals(currentUser).delete();
        
        // Delete non-recurring chores (keep recurring templates)
        await db.choreItems.where({ profileId: currentUser, isRecurring: false }).delete();
        
        // Update last reset date
        localStorage.setItem('lastChoreResetDate', today);
      }
    };
    
    performDailyReset();
  }, [currentUser]);

  // Calculate completion recursively
  const completionByChoreId = useMemo(() => {
    const map: Record<number, number> = {};
    const hasLog = new Set(choreLogs.map(l => l.choreId));

    // Group items by parent
    const childrenMap: Record<number, any[]> = {};
    choreItems.forEach(c => {
      if (c.parentId) {
        if (!childrenMap[c.parentId]) childrenMap[c.parentId] = [];
        childrenMap[c.parentId].push(c);
      }
    });

    // Helper to calc percentage recursively
    const calc = (id: number): number => {
      const children = childrenMap[id] || [];
      if (children.length === 0) {
        return hasLog.has(id) ? 100 : 0;
      }
      const sum = children.reduce((acc, child) => acc + calc(child.id!), 0);
      return sum / children.length;
    };

    choreItems.forEach(c => {
      map[c.id!] = calc(c.id!);
    });

    return map;
  }, [choreItems, choreLogs]);

  // Total completion for top-level only
  const topLevelChores = choreItems.filter(c => c.parentId === null);
  const overallCompletion = topLevelChores.length > 0 
    ? topLevelChores.reduce((sum, c) => sum + (completionByChoreId[c.id!] || 0), 0) / topLevelChores.length
    : 0;

  const displayChores = choreItems.filter(c => c.parentId === currentParentId);
  const currentChore = currentParentId ? choreItems.find(c => c.id === currentParentId) : null;

  const handleAddChore = async () => {
    if (!newTitle.trim() || !currentUser) return;
    await db.choreItems.add({
      title: newTitle,
      parentId: currentParentId,
      icon: newIcon,
      isRecurring,
      profileId: currentUser
    });
    setNewTitle('');
    setIsAdding(false);
  };

  const handleDeleteChore = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    await db.choreItems.where({ id, profileId: currentUser }).delete();
  };

  const toggleChoreComplete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser) return;
    
    // Check if it already has a log for today
    const existingLog = choreLogs.find(l => l.choreId === id);
    if (existingLog) {
      await db.choreLogs.delete(existingLog.id!);
    } else {
      await db.choreLogs.add({
        choreId: id,
        date: new Date().toISOString(),
        profileId: currentUser
      });
    }
  };

  // Check if a specific chore has subchores
  const hasSubchores = (id: number) => choreItems.some(c => c.parentId === id);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* TRex Mood showing overall completion */}
      {currentParentId === null && (
         <TRexMood percentage={overallCompletion} />
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-hide px-1 mt-2">
        <button 
          onClick={() => setCurrentParentId(null)}
          className={`flex items-center gap-1 transition-colors ${currentParentId === null ? 'text-purple-400' : 'text-white/50 hover:text-white'}`}
        >
          <Home size={16} /> {t('spending.home')}
        </button>
        {currentChore && (
          <>
            <ChevronRight size={14} className="text-white/30" />
            <span className="text-purple-400">{currentChore.icon} {currentChore.title}</span>
          </>
        )}
      </div>

      {/* Sticky Back Button at ticket level */}
      {currentChore && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentParentId(currentChore.parentId || null)}
            className="flex items-center gap-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft size={18} /> {t('common.back')} {currentChore.parentId ? t('spending.category') : t('spending.home')}
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          {currentChore ? t('logs.detailedBreakdown') : t('chores.yourChores')}
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
        >
          <Plus size={20} className={isAdding ? "rotate-45" : ""} />
        </button>
      </div>

      {isAdding && (
        <div className="glass p-4 rounded-3xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 border border-white/10">
           <div className="flex gap-3">
             <button 
               onClick={() => setShowEmojiPicker(true)}
               className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl hover:bg-white/10 transition-colors shrink-0"
             >
               {newIcon}
             </button>
             <input 
               type="text" 
               placeholder={t('chores.addPlaceholder')}
               value={newTitle}
               onChange={e => setNewTitle(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
             />
           </div>
           
           <label className="flex items-center gap-2 text-sm text-white/70 ml-1">
              <input 
                type="checkbox" 
                checked={isRecurring} 
                onChange={e => setIsRecurring(e.target.checked)}
                className="rounded bg-white/5 text-blue-500 focus:ring-blue-500 outline-none" 
              />
              {t('chores.recurring')}
           </label>

           <button 
             onClick={handleAddChore}
             className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-xl font-semibold transition-colors mt-2 text-blue-200"
           >
             {t('chores.saveChore')}
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {displayChores.length === 0 && !isAdding && (
          <div className="text-center py-10 text-white/40">
            <p>{t('chores.empty')}</p>
          </div>
        )}

        {displayChores.map(chore => {
          const compPct = completionByChoreId[chore.id!] || 0;
          const isFull = compPct === 100;
          const hasChildren = hasSubchores(chore.id!);

          return (
            <div 
              key={chore.id} 
              onClick={() => setCurrentParentId(chore.id!)}
              className="glass p-4 rounded-3xl border border-white/5 transition-all relative overflow-hidden group cursor-pointer hover:bg-white/5 flex justify-between items-center gap-4"
            >
              {isFull && <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />}
              
              <div className="flex items-center gap-4 shrink-0 relative z-10 w-full">
                 <CircularProgress 
                   percentage={compPct} 
                   size={48} 
                   strokeWidth={4} 
                   colorClass={isFull ? 'text-green-400' : 'text-blue-400'}
                 />

                <div className="flex-1 min-w-0 flex items-center gap-3 relative">
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-center text-2xl shadow-inner">
                    {chore.icon}
                  </div>
                  <h3 className={`font-bold text-lg truncate relative ${isFull ? 'text-white' : 'text-white'}`}>
                    {chore.title}
                  </h3>
                </div>

                <div className="flex gap-2 items-center flex-shrink-0 relative z-20">
                  {/* Checkbox for easy completion */}
                  {!hasChildren && (
                    <label className="cursor-pointer flex items-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isFull}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleChoreComplete(chore.id!, e as any);
                        }}
                        className="w-5 h-5 rounded bg-white/10 border-white/30 text-green-500 focus:ring-green-500/50 focus:ring-2 cursor-pointer"
                      />
                    </label>
                  )}
                  
                  {hasChildren && <ChevronRight className="text-white/30" />}
                  
                  <button 
                    onClick={(e) => handleDeleteChore(chore.id!, e)}
                    className="p-2.5 opacity-0 group-hover:opacity-100 absolute right-16 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/40 transition-all pointer-events-auto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={(char) => { setNewIcon(char); setShowEmojiPicker(false); }} 
          onClose={() => setShowEmojiPicker(false)} 
        />
      )}
    </div>
  );
}
