import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, differenceInDays, getDaysInMonth, differenceInCalendarDays } from 'date-fns';
import { de } from 'date-fns/locale';

import { Plus, Trash2, Edit2, X, ChevronRight, Home, ArrowLeft, BookOpen } from 'lucide-react';
import { db } from '../../lib/db';
import { CatTowerIndicator } from '../CatTowerIndicator';
import { EmojiPicker } from '../EmojiPicker';
import { useI18n } from '../../lib/i18n';
import type { Ticket } from '../../lib/db';

export default function TabSpending({ currentUser }: { currentUser: number | null }) {
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<'new' | 'edit' | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [activePeriod, setActivePeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('💵');
  const [newTarget, setNewTarget] = useState<string>('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [newDefaultAmount, setNewDefaultAmount] = useState<string>('');

  const [loggingId, setLoggingId] = useState<number | null>(null);
  const [logAmount, setLogAmount] = useState<string>('');
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editIcon, setEditIcon] = useState('');
  const [editTarget, setEditTarget] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'expense'>('expense');

  const { t, language } = useI18n();
  const dateLocale = language === 'de' ? de : undefined;

  const tickets = useLiveQuery(() => {
    if (!currentUser) return [];
    return db.tickets.where('profileId').equals(currentUser).toArray();
  }) || [];
  const allExpenseLogs = useLiveQuery(() => {
    if (!currentUser) return [];
    return db.expenseLogs.where('profileId').equals(currentUser).toArray();
  }) || [];
  
  // Check for period change on mount
  useEffect(() => {
    const lastResetDate = localStorage.getItem('lastPeriodResetDate');
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayObj = new Date();
    
    if (lastResetDate) {
      const lastR = new Date(lastResetDate);
      const dayChanged = todayObj.getDate() !== lastR.getDate() || todayObj.getMonth() !== lastR.getMonth() || todayObj.getFullYear() !== lastR.getFullYear();
      const monthChanged = todayObj.getMonth() !== lastR.getMonth() || todayObj.getFullYear() !== lastR.getFullYear();
      const yearChanged = todayObj.getFullYear() !== lastR.getFullYear();
      
      if (dayChanged || monthChanged || yearChanged) {
        // We need to wipe tickets as requested
        const wipeTickets = async () => {
          const ticketsToWipe = tickets.filter(t => !t.isTemplate && (
            (dayChanged && t.period === 'daily') || 
            (monthChanged && t.period === 'monthly') || 
            (yearChanged && t.period === 'yearly')
          ));
          
          if (ticketsToWipe.length > 0) {
             for (const t of ticketsToWipe) {
               // We don't delete logs, only the category/ticket in the tracker
               await db.tickets.delete(t.id!);
             }
             // Show new period prompt
             setShowNewPeriodModal(true); 
          }
        };
        wipeTickets();
      }
    }
    
    localStorage.setItem('lastPeriodResetDate', today);
  }, [tickets]);
  
  // No longer needed
  
  // Calculate month progress
  const monthProgress = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalDays = getDaysInMonth(now);
    const daysPassed = differenceInDays(now, startOfMonth) + 1;
    const daysLeft = totalDays - daysPassed;
    const progressPercentage = (daysPassed / totalDays) * 100;
    
    return {
      monthName: format(now, 'MMMM yyyy', { locale: dateLocale }),
      daysPassed,
      daysLeft,
      totalDays,
      progressPercentage
    };
  }, []);

  // Calculate year progress
  const yearProgress = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const totalDays = differenceInCalendarDays(endOfYear, startOfYear) + 1;
    const daysPassed = differenceInCalendarDays(now, startOfYear) + 1;
    const daysLeft = totalDays - daysPassed;
    const progressPercentage = (daysPassed / totalDays) * 100;
    
    // Calculate months and days
    const monthsPassed = now.getMonth();
    const monthsLeft = 11 - monthsPassed;
    const dayOfMonth = now.getDate();
    
    return {
      yearName: format(now, 'yyyy'),
      daysPassed,
      daysLeft,
      totalDays,
      monthsPassed,
      monthsLeft,
      dayOfMonth,
      progressPercentage
    };
  }, []);
  
  // === NEW DUAL-TRACK SPENDING SYSTEM ===
  const now = new Date();
  
  const currentPeriodSpending = useMemo(() => {
    const spending: Record<number, number> = {};
    const todayStr = format(now, 'yyyy-MM-dd');
    const thisMonthStr = format(now, 'yyyy-MM');
    const thisYearStr = format(now, 'yyyy');

    allExpenseLogs.forEach(log => {
      const ticket = tickets.find(t => t.id === log.ticketId);
      if (!ticket) return;
      
      const logDate = new Date(log.date);
      
      if (activePeriod === 'daily') {
        if (ticket.period === 'daily' && format(logDate, 'yyyy-MM-dd') === todayStr) {
          spending[log.ticketId] = (spending[log.ticketId] || 0) + log.amount;
        }
      } else if (activePeriod === 'monthly') {
        if (format(logDate, 'yyyy-MM') === thisMonthStr) {
          if (ticket.period === 'daily' || ticket.period === 'monthly') {
            spending[log.ticketId] = (spending[log.ticketId] || 0) + log.amount;
          }
        }
      } else if (activePeriod === 'yearly') {
        if (format(logDate, 'yyyy') === thisYearStr) {
          spending[log.ticketId] = (spending[log.ticketId] || 0) + log.amount;
        }
      }
    });
    
    return spending;
  }, [allExpenseLogs, tickets, activePeriod]);

  const dailyTotalsForMonth = useMemo(() => {
    const dailyTotals: Record<number, number> = {};
    const thisMonthStr = format(now, 'yyyy-MM');

    allExpenseLogs.forEach(log => {
      const ticket = tickets.find(t => t.id === log.ticketId);
      if (!ticket || ticket.period !== 'daily') return;
      
      const logDate = new Date(log.date);
      if (format(logDate, 'yyyy-MM') === thisMonthStr) {
        dailyTotals[log.ticketId] = (dailyTotals[log.ticketId] || 0) + log.amount;
      }
    });
    
    return dailyTotals;
  }, [allExpenseLogs, tickets]);

  const dailyRollupForMonth = useMemo(() => {
    const thisMonthStr = format(now, 'yyyy-MM');
    return allExpenseLogs.reduce((sum, log) => {
      const ticket = tickets.find(t => t.id === log.ticketId);
      if (!ticket || ticket.period !== 'daily') return sum;
      const logDate = new Date(log.date);
      if (format(logDate, 'yyyy-MM') === thisMonthStr) {
        return sum + log.amount;
      }
      return sum;
    }, 0);
  }, [allExpenseLogs, tickets]);

  const subPeriodRollupForYear = useMemo(() => {
    let daily = 0;
    let monthly = 0;
    const thisYearStr = format(now, 'yyyy');

    allExpenseLogs.forEach(log => {
      const ticket = tickets.find(t => t.id === log.ticketId);
      if (!ticket) return;
      const logDate = new Date(log.date);
      if (format(logDate, 'yyyy') !== thisYearStr) return;
      if (ticket.period === 'daily') daily += log.amount;
      else if (ticket.period === 'monthly') monthly += log.amount;
    });
    return { daily, monthly, total: daily + monthly };
  }, [allExpenseLogs, tickets]);
  
  const calculateTarget = (ticketId: number): number => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket?.target) return ticket.target;
    
    const children = tickets.filter(t => t.parentId === ticketId);
    return children.reduce((sum, child) => sum + calculateTarget(child.id!), 0);
  };
  
  const calculateSpendingForTarget = (ticketId: number): number => {
    const target = calculateTarget(ticketId);
    if (target === 0) return 0;
    
    let total = currentPeriodSpending[ticketId] || 0;
    const children = tickets.filter(t => t.parentId === ticketId);
    children.forEach(child => {
      // Recursively add all child spending regardless of child targets
      total += calculateSpendingForTargetDeep(child.id!);
    });
    
    return total;
  };

  // Helper for deep spending calculation without target checks at every level
  const calculateSpendingForTargetDeep = (ticketId: number): number => {
    let total = currentPeriodSpending[ticketId] || 0;
    const children = tickets.filter(t => t.parentId === ticketId);
    children.forEach(child => {
      total += calculateSpendingForTargetDeep(child.id!);
    });
    return total;
  };
  
  const calculatePeriodTotal = (ticketId: number): number => {
    let total = currentPeriodSpending[ticketId] || 0;
    const children = tickets.filter(t => t.parentId === ticketId);
    children.forEach(child => {
      total += calculatePeriodTotal(child.id!);
    });
    
    return total;
  };

  const calculateDailyTotalForMonth = (ticketId: number): number => {
    let total = dailyTotalsForMonth[ticketId] || 0;
    const children = tickets.filter(t => t.parentId === ticketId);
    children.forEach(child => {
      total += calculateDailyTotalForMonth(child.id!);
    });
    
    return total;
  };
  
  const getTicketDisplay = (ticketId: number) => {
    const target = calculateTarget(ticketId);
    const periodSpent = calculatePeriodTotal(ticketId); 
    const targetSpent = calculateSpendingForTarget(ticketId); 
    const dailySpent = calculateDailyTotalForMonth(ticketId); 
    
    return { periodSpent, targetSpent, target, dailySpent };
  };

  const expenseLogs = useMemo(() => {
    const todayStr = format(now, 'yyyy-MM-dd');
    const thisMonthStr = format(now, 'yyyy-MM');
    const thisYearStr = format(now, 'yyyy');
    
    return allExpenseLogs.filter(log => {
      const logDate = new Date(log.date);
      const ticket = tickets.find(t => t.id === log.ticketId);
      if (!ticket) return false;
      
      if (activePeriod === 'daily') {
        return ticket.period === 'daily' && format(logDate, 'yyyy-MM-dd') === todayStr;
      }
      if (activePeriod === 'monthly') {
        return (ticket.period === 'daily' || ticket.period === 'monthly') && 
               format(logDate, 'yyyy-MM') === thisMonthStr;
      }
      if (activePeriod === 'yearly') {
        return format(logDate, 'yyyy') === thisYearStr;
      }
      return false;
    });
  }, [allExpenseLogs, activePeriod, tickets]);

  const currentLevel = currentParentId === null 
    ? 1 
    : (tickets.find(t => t.id === currentParentId)?.level || 1) + 1;

  const displayTickets = tickets.filter(t => t.parentId === currentParentId && t.period === activePeriod);
  
  const sortedDisplayTickets = useMemo(() => {
    if (sortBy === 'expense') {
      return [...displayTickets].sort((a, b) => {
        const spentA = calculatePeriodTotal(a.id!);
        const spentB = calculatePeriodTotal(b.id!);
        return spentB - spentA;
      });
    }
    return displayTickets;
  }, [displayTickets, currentPeriodSpending, sortBy, tickets]);

  const currentTicket = currentParentId ? tickets.find(t => t.id === currentParentId) : null;
  const parentTicket = currentTicket?.parentId ? tickets.find(t => t.id === currentTicket.parentId) : null;
  
  const currentPeriodSpentBase = currentParentId 
    ? calculatePeriodTotal(currentParentId)
    : sortedDisplayTickets.reduce((sum, t) => sum + calculatePeriodTotal(t.id!), 0);

  const currentPeriodSpent = currentParentId !== null
    ? currentPeriodSpentBase
    : activePeriod === 'monthly'
      ? currentPeriodSpentBase + dailyRollupForMonth
      : activePeriod === 'yearly'
        ? currentPeriodSpentBase + subPeriodRollupForYear.total
        : currentPeriodSpentBase;
    
  const currentTargetSpent = currentParentId 
    ? calculateSpendingForTarget(currentParentId)
    : sortedDisplayTickets.reduce((sum, t) => sum + calculateSpendingForTarget(t.id!), 0);
    
  const totalSubPeriodTarget = useMemo(() => {
    if (currentParentId !== null) return 0;
    return tickets.filter(t => t.parentId === null && !t.isTemplate && (
      (activePeriod === 'monthly' && t.period === 'daily') ||
      (activePeriod === 'yearly' && (t.period === 'daily' || t.period === 'monthly'))
    )).reduce((sum, t) => sum + calculateTarget(t.id!), 0);
  }, [tickets, activePeriod, currentParentId]);

  const currentTarget = (currentParentId 
    ? calculateTarget(currentParentId)
    : sortedDisplayTickets.reduce((sum, t) => sum + calculateTarget(t.id!), 0)) + totalSubPeriodTarget;

  const handleBack = () => {
    if (currentParentId === null) return;
    setCurrentParentId(currentTicket?.parentId || null);
  };

  const childMap = tickets.reduce((acc, t) => {
     if (t.parentId) {
       if (!acc[t.parentId]) acc[t.parentId] = [];
       acc[t.parentId].push(t);
     }
     return acc;
  }, {} as Record<number, any[]>);

  const getLogsForTicket = (ticketId: number) => {
    return expenseLogs.filter(log => log.ticketId === ticketId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleAddTicket = async () => {
    if (!newName.trim() || !currentUser) return;
    
    let ticketPeriod: 'daily' | 'monthly' | 'yearly' = activePeriod;
    if (currentParentId !== null) {
      const parent = tickets.find(t => t.id === currentParentId);
      ticketPeriod = (parent?.period as 'daily' | 'monthly' | 'yearly') || activePeriod;
    }
    
    await db.tickets.add({
      name: newName,
      parentId: currentParentId,
      level: currentLevel as 1 | 2 | 3,
      icon: newIcon,
      target: newTarget ? parseFloat(newTarget) : null,
      isTemplate,
      defaultAmount: isTemplate && newDefaultAmount ? parseFloat(newDefaultAmount) : undefined,
      period: ticketPeriod,
      profileId: currentUser
    });
    setIsAdding(false);
    setNewName('');
    setNewTarget('');
    setNewDefaultAmount('');
  };

  const handleDeleteTicket = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // No confirmation as requested

    if (!currentUser) return;

    const deleteRecursive = async (ticketId: number) => {
      // Find children
      const children = await db.tickets.where({ parentId: ticketId, profileId: currentUser }).toArray();
      for (const child of children) {
        await deleteRecursive(child.id!);
      }
      // Delete logs and history for this ticket
      await db.expenseLogs.where({ ticketId, profileId: currentUser }).delete();
      await db.priceHistory.where({ ticketId, profileId: currentUser }).delete();
      // Finally delete the ticket itself
      await db.tickets.where({ id: ticketId, profileId: currentUser }).delete();
    };

    await deleteRecursive(id);
    if (currentParentId === id) setCurrentParentId(null);
  };

  const handleSaveLog = async (ticketId: number) => {
    if (!logAmount || isNaN(parseFloat(logAmount)) || !currentUser) return;
    
    const selectedDate = new Date(logDate);
    const nowTime = new Date();
    selectedDate.setHours(nowTime.getHours(), nowTime.getMinutes(), nowTime.getSeconds());
    
    let periodLabel;
    if (activePeriod === 'daily') periodLabel = format(selectedDate, 'yyyy-MM-dd');
    else if (activePeriod === 'monthly') periodLabel = format(selectedDate, 'yyyy-MM');
    else periodLabel = format(selectedDate, 'yyyy');
    
    await db.expenseLogs.add({
      ticketId,
      amount: parseFloat(logAmount),
      date: selectedDate.toISOString(),
      periodLabel,
      profileId: currentUser
    });
    setLoggingId(null);
    setLogAmount('');
    setLogDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleQuickLog = async (ticketId: number, amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser) return;
    
    if (amount < 0) {
      // Find the last positive log for this ticket to "undo"
      const logs = await db.expenseLogs.where({ ticketId, profileId: currentUser }).toArray();
      const lastPositive = logs.filter(l => l.amount > 0).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (lastPositive) {
        await db.expenseLogs.delete(lastPositive.id!);
      }
      return;
    }

    const selectedDate = new Date();
    let periodLabel;
    if (activePeriod === 'daily') periodLabel = format(selectedDate, 'yyyy-MM-dd');
    else if (activePeriod === 'monthly') periodLabel = format(selectedDate, 'yyyy-MM');
    else periodLabel = format(selectedDate, 'yyyy');

    await db.expenseLogs.add({
      ticketId,
      amount,
      date: selectedDate.toISOString(),
      periodLabel,
      profileId: currentUser
    });
  };

  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editLogAmount, setEditLogAmount] = useState<string>('');
  const [editLogDate, setEditLogDate] = useState<string>('');

  const handleUpdateLog = async (logId: number) => {
    if (!editLogAmount || isNaN(parseFloat(editLogAmount))) return;
    const selectedDate = new Date(editLogDate);
    const nowTime = new Date();
    selectedDate.setHours(nowTime.getHours(), nowTime.getMinutes(), nowTime.getSeconds());

    let periodLabel;
    if (activePeriod === 'daily') periodLabel = format(selectedDate, 'yyyy-MM-dd');
    else if (activePeriod === 'monthly') periodLabel = format(selectedDate, 'yyyy-MM');
    else periodLabel = format(selectedDate, 'yyyy');

    await db.expenseLogs.update(logId, {
      amount: parseFloat(editLogAmount),
      date: selectedDate.toISOString(),
      periodLabel
    });
    setEditingLogId(null);
  };
  
  const handleEditSave = async (ticketId: number, e: React.MouseEvent) => {
     e.stopPropagation();
     const ticket = tickets.find(t => t.id === ticketId);
     if (!ticket) return;

     const updates: Partial<Ticket> = {};
     if (editName.trim()) updates.name = editName;
     if (editIcon.trim()) updates.icon = editIcon;
     updates.target = editTarget ? parseFloat(editTarget) : null;
     
     if (ticket.isTemplate && editAmount !== undefined) {
        const newAmount = editAmount ? parseFloat(editAmount) : 0;
        const oldAmount = ticket.defaultAmount || 0;
        if (newAmount !== oldAmount && newAmount > 0) {
           updates.defaultAmount = newAmount;
           if (oldAmount > 0) {
              if (currentUser) {
                await db.priceHistory.add({
                   ticketId,
                  oldAmount,
                  newAmount,
                  date: new Date().toISOString(),
                  profileId: currentUser
                });
              }
           }
        }
     }

     await db.tickets.update(ticketId, updates);
     setEditingTicketId(null);
  };

  const handleDeleteLog = async (logId: number) => {
    // No confirmation as requested
    if (!currentUser) return;
    
    await db.expenseLogs.where({ id: logId, profileId: currentUser }).delete();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-hide px-1">
        <button 
          onClick={() => setCurrentParentId(null)}
          className={`flex items-center gap-1 transition-colors ${currentParentId === null ? 'text-purple-400' : 'text-white/50 hover:text-white'}`}
        >
          <Home size={16} /> {t('spending.home')}
        </button>
        {parentTicket && (
          <>
            <ChevronRight size={14} className="text-white/30" />
            <span className="text-white/50">{parentTicket.icon} {parentTicket.name}</span>
          </>
        )}
        {currentTicket && (
          <>
            <ChevronRight size={14} className="text-white/30" />
            <span className="text-purple-400">{currentTicket.icon} {currentTicket.name}</span>
          </>
        )}
      </div>

      {/* Back Button */}
      {currentParentId !== null && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-colors self-start"
        >
          <ArrowLeft size={18} /> {t('spending.home')}
        </button>
      )}

      {/* Period Tabs */}
      {currentParentId === null && (
        <div className="flex bg-white/5 p-1 rounded-xl glass border border-white/5">
          {(['daily', 'monthly', 'yearly'] as const).map(period => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activePeriod === period
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {period === 'daily' && t('period.daily.short')}
              {period === 'monthly' && t('period.monthly.short')}
              {period === 'yearly' && t('period.yearly.short')}
            </button>
          ))}
        </div>
      )}

      {/* Progress Bars */}
      {currentParentId === null && (
        <>
          {activePeriod === 'monthly' && (
            <div className="glass p-6 rounded-3xl border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">{monthProgress.monthName}</h3>
                <span className="text-sm text-white/60 font-medium">{monthProgress.daysPassed} / {monthProgress.totalDays} days</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${monthProgress.progressPercentage}%` }}
                />
              </div>
            </div>
          )}
          {activePeriod === 'yearly' && (
            <div className="glass p-6 rounded-3xl border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">{yearProgress.yearName}</h3>
                <span className="text-sm text-white/60 font-medium">
                  Month {yearProgress.monthsPassed + 1} / 12
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${yearProgress.progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* CatTower Indicator */}
      <div className="flex flex-col items-center my-4 gap-2">
        <CatTowerIndicator spent={currentTargetSpent} target={currentTarget || 0} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-white font-black text-6xl tracking-tighter drop-shadow-sm mb-1">
                ${currentPeriodSpent.toFixed(2)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs font-medium uppercase tracking-widest">
                  {activePeriod === 'daily' && t('spending.spent.thisDay')}
                  {activePeriod === 'monthly' && t('spending.spent.thisMonth')}
                  {activePeriod === 'yearly' && t('spending.spent.thisYear')}
                </span>
              </div>
            </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">
          {currentTicket ? t('spending.items', { name: currentTicket.name }) : t('spending.allCategories')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy(sortBy === 'date' ? 'expense' : 'date')}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white/80"
          >
            {sortBy === 'expense' ? '💰 Highest' : '📅 Date'}
          </button>
          <button 
            onClick={() => setShowTemplates(true)}
            className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
          >
            <BookOpen size={20} />
          </button>
          {currentLevel <= 3 && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center hover:bg-purple-500/30 transition-colors"
            >
              <Plus size={20} className={isAdding ? "rotate-45" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Add Ticket Panel */}
      {isAdding && (
        <div className="glass p-4 rounded-3xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
           <div className="flex gap-3">
             <button 
               onClick={() => setEmojiPickerTarget('new')}
               className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl hover:bg-white/10 transition-colors shrink-0"
             >
               {newIcon}
             </button>
             <div className="flex-1 flex flex-col gap-2">
               <input 
                 type="text" 
                 placeholder={t('spending.addPlaceholder')}
                 value={newName}
                 onChange={e => setNewName(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
               />
               <input 
                 type="date" 
                 value={logDate}
                 onChange={e => setLogDate(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
               />
               <input 
                 type="number" 
                 placeholder={t('spending.targetPlaceholder')}
                 value={newTarget}
                 onChange={e => setNewTarget(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
               />
             </div>
           </div>
           
           <label className="flex items-center gap-2 text-sm text-white/70 ml-1">
              <input 
                type="checkbox" 
                checked={isTemplate} 
                onChange={e => setIsTemplate(e.target.checked)}
                className="rounded bg-white/5 text-purple-500" 
              />
              {t('spending.saveTemplate')}
           </label>
           
           {isTemplate && (
             <input 
               type="number" 
               placeholder={t('spending.defaultPrice')}
               value={newDefaultAmount}
               onChange={e => setNewDefaultAmount(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
             />
           )}

           <button 
             onClick={handleAddTicket}
             className="w-full py-2 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors mt-2"
           >
             {t('spending.saveTicket')}
           </button>
        </div>
      )}

      {/* Roll-up Cards */}
      <div className="grid grid-cols-1 gap-4">
        {activePeriod === 'monthly' && currentParentId === null && dailyRollupForMonth > 0 && (
          <div className="glass p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-base font-semibold text-white">{t('spending.rollup.daily.title')}</p>
                <p className="text-sm text-white/50">{t('spending.rollup.daily.desc')}</p>
              </div>
            </div>
            <span className="text-white font-bold text-lg">${dailyRollupForMonth.toFixed(2)}</span>
          </div>
        )}

        {activePeriod === 'yearly' && currentParentId === null && subPeriodRollupForYear.total > 0 && (
          <div className="glass p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="text-base font-semibold text-white">{t('spending.rollup.subperiod.title')}</p>
                  <p className="text-sm text-white/50">{t('spending.rollup.subperiod.desc')}</p>
                </div>
              </div>
              <span className="text-white font-bold text-lg">${subPeriodRollupForYear.total.toFixed(2)}</span>
            </div>
            <div className="flex gap-4 pl-11">
              {subPeriodRollupForYear.daily > 0 && (
                <span className="text-xs text-white/40">{t('period.daily.short')}: ${subPeriodRollupForYear.daily.toFixed(2)}</span>
              )}
              {subPeriodRollupForYear.monthly > 0 && (
                <span className="text-xs text-white/40">{t('period.monthly.short')}: ${subPeriodRollupForYear.monthly.toFixed(2)}</span>
              )}
            </div>
          </div>
        )}

        {sortedDisplayTickets.length === 0 && !isAdding && (
          <div className="text-center py-10 text-white/40">
            <p>{t('spending.empty', { type: currentLevel === 1 ? t('spending.category') : t('spending.item') })}</p>
          </div>
        )}

        {sortedDisplayTickets.map(ticket => {
          const { periodSpent, targetSpent, target, dailySpent } = getTicketDisplay(ticket.id!);
          const monthlySpent = activePeriod === 'monthly' ? periodSpent - dailySpent : 0;
          const hasChildren = childMap[ticket.id!]?.length > 0;

          return (
            <div 
              key={ticket.id} 
              className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6"
            >
               <div 
                 className="flex justify-between items-start"
                 onClick={() => {
                   if (ticket.level < 3) {
                     setCurrentParentId(ticket.id!);
                   }
                 }}
               >
                 <div className="flex gap-6 cursor-pointer">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingTicketId(ticket.id!); 
                        setEditIcon(ticket.icon || ''); 
                        setEmojiPickerTarget('edit');
                      }} 
                      className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-5xl hover:bg-white/10 transition-colors shrink-0"
                    >
                      {ticket.icon}
                    </button>
                    <div className="flex flex-col justify-center">
                      <h3 className="font-black text-2xl text-white group flex items-center gap-2 tracking-tight">
                        {ticket.name}
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingTicketId(ticket.id!); 
                            setEditName(ticket.name); 
                            setEditTarget(ticket.target?.toString() || '');
                            setEditAmount(ticket.defaultAmount?.toString() || '');
                          }}
                          className="text-white/40 hover:text-white transition-opacity ml-1 p-2"
                        >
                          <Edit2 size={20} />
                        </button>
                      </h3>
                      <p className="text-white/60 text-lg">
                        {ticket.period === 'daily' && t('spending.spent.daily')}
                        {ticket.period === 'monthly' && t('spending.spent.monthly')}
                        {ticket.period === 'yearly' && t('spending.spent.yearly')}
                        : <span className="text-white font-black">${periodSpent.toFixed(2)}</span> 
                      </p>
                     {activePeriod === 'monthly' && dailySpent > 0 && (
                        <p className="text-sm text-white/30 font-medium pb-2">
                          ({t('logs.daily')}: ${dailySpent.toFixed(2)} + {t('logs.monthly')}: ${monthlySpent.toFixed(2)})
                        </p>
                      )}
                      {ticket.isTemplate && ticket.defaultAmount !== undefined && (
                        <div className="flex items-center gap-2 mt-4">
                           <button 
                             onClick={(e) => handleQuickLog(ticket.id!, ticket.defaultAmount!, e)}
                             className="px-5 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl text-base font-black hover:bg-emerald-500/30 transition-all active:scale-95"
                           >
                             +${ticket.defaultAmount}
                           </button>
                           <button 
                             onClick={(e) => handleQuickLog(ticket.id!, -ticket.defaultAmount!, e)}
                             className="px-5 py-2.5 bg-red-500/20 text-red-400 rounded-2xl text-base font-black hover:bg-red-500/30 transition-all active:scale-95"
                           >
                             -${ticket.defaultAmount}
                           </button>
                        </div>
                      )}
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setLoggingId(loggingId === ticket.id ? null : ticket.id!); 
                        setLogAmount(ticket.isTemplate && ticket.defaultAmount ? ticket.defaultAmount.toString() : ''); 
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${loggingId === ticket.id ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                    >
                      {loggingId === ticket.id ? <X size={20} /> : <Plus size={20} />}
                    </button>
                    {hasChildren && <ChevronRight className="m-auto text-white/20" />}
                 </div>
               </div>

                      {/* Log Panel & List */}
                {loggingId === ticket.id && (
                  <div className="p-4 bg-black/20 rounded-2xl flex flex-col gap-4 animate-in slide-in-from-top-2">
                    {/* Log Items List */}
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {getLogsForTicket(ticket.id!).length === 0 ? (
                        <p className="text-xs text-white/30 text-center py-2 italic">{t('logs.noExpenses')}</p>
                      ) : (
                        getLogsForTicket(ticket.id!).map(log => (
                          <div key={log.id} className="flex items-center justify-between bg-white/5 p-2 rounded-xl group/log">
                            {editingLogId === log.id ? (
                              <div className="flex-1 flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <input 
                                    type="date" 
                                    value={editLogDate}
                                    onChange={e => setEditLogDate(e.target.value)}
                                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none"
                                  />
                                  <input 
                                    type="number" 
                                    value={editLogAmount}
                                    onChange={e => setEditLogAmount(e.target.value)}
                                    className="w-20 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleUpdateLog(log.id!)} className="flex-1 py-1 bg-emerald-500/80 text-white text-[10px] font-bold rounded-lg uppercase">{t('spending.save')}</button>
                                  <button onClick={() => setEditingLogId(null)} className="flex-1 py-1 bg-white/10 text-white text-[10px] font-bold rounded-lg uppercase">{t('profile.cancel')}</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col">
                                  <span className="text-white text-sm font-bold">${log.amount.toFixed(2)}</span>
                                  <span className="text-[10px] text-white/40">{format(new Date(log.date), 'MMM dd, HH:mm')}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => {
                                      setEditingLogId(log.id!);
                                      setEditLogAmount(log.amount.toString());
                                      setEditLogDate(format(new Date(log.date), 'yyyy-MM-dd'));
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLog(log.id!)}
                                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* New Log Input */}
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-[10px] text-white/40 ml-1 uppercase">{t('spending.logDate')}</span>
                          <input 
                            type="date" 
                            value={logDate}
                            onChange={e => setLogDate(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-[10px] text-white/40 ml-1 uppercase">{t('spending.spent')}</span>
                          <input 
                            type="number" 
                            placeholder="Amount"
                            value={logAmount}
                            onChange={e => setLogAmount(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
                            autoFocus
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleSaveLog(ticket.id!)}
                        className="w-full py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                      >
                        {t('spending.save')}
                      </button>
                    </div>
                  </div>
                )}

               {/* Edit Modal (Inline for target/default amount) */}
               {editingTicketId === ticket.id && (
                 <div className="p-4 bg-white/5 rounded-2xl flex flex-col gap-3 animate-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                       <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="Name" />
                       <input type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)} className="w-24 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="Target" />
                    </div>
                    {ticket.isTemplate && (
                      <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="Default Price" />
                    )}
                    <button onClick={(e) => handleEditSave(ticket.id!, e)} className="w-full py-2 bg-purple-500 text-white rounded-xl font-bold">Save Changes</button>
                 </div>
               )}

               <div className="flex flex-col gap-4">
                 {target > 0 && (
                   <div className="p-4 bg-white/5 rounded-2xl flex justify-center">
                     <CatTowerIndicator spent={targetSpent} target={target} />
                   </div>
                 )}
                 
                 {(() => {
                   const logs = getLogsForTicket(ticket.id!);
                   if (logs.length === 0) return null;
                   return (
                     <div className="space-y-2">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest ml-1">{t('spending.recentLogs')}</span>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {logs.map(log => (
                             <div key={log.id} className="flex justify-between items-center p-2 bg-white/5 rounded-xl group text-base transition-colors hover:bg-white/10">
                              {editingLogId === log.id ? (
                                <div className="flex-1 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                  <div className="flex gap-2">
                                    <input 
                                      type="date" 
                                      value={editLogDate}
                                      onChange={e => setEditLogDate(e.target.value)}
                                      className="flex-1 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none"
                                    />
                                    <input 
                                      type="number" 
                                      value={editLogAmount}
                                      onChange={e => setEditLogAmount(e.target.value)}
                                      className="w-20 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => handleUpdateLog(log.id!)} className="flex-1 py-1 bg-emerald-500/80 text-white text-[10px] font-bold rounded-lg uppercase">{t('spending.save')}</button>
                                    <button onClick={() => setEditingLogId(null)} className="flex-1 py-1 bg-white/10 text-white text-[10px] font-bold rounded-lg uppercase">{t('profile.cancel')}</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <span className="font-bold text-white">${log.amount.toFixed(2)}</span>
                                    <span className="text-xs text-white/40 ml-2">{format(new Date(log.date), 'MMM d, p')}</span>
                                  </div>
                                  <div className="flex gap-1 transition-opacity">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingLogId(log.id!);
                                        setEditLogAmount(log.amount.toString());
                                        setEditLogDate(format(new Date(log.date), 'yyyy-MM-dd'));
                                      }}
                                      className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id!); }}
                                      className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </>
                              )}
                             </div>
                          ))}
                        </div>
                     </div>
                   );
                 })()}
               </div>

               <button 
                 onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id!, e); }}
                 className="self-end text-sm text-red-500/80 hover:text-red-500 flex items-center gap-1 transition-colors mt-2 p-1"
               >
                 <Trash2 size={16} /> {ticket.parentId === null ? t('spending.deleteCategory') : t('spending.deleteItem')}
               </button>
            </div>
          );
        })}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="glass rounded-3xl p-6 max-w-md w-full max-h-[80vh] flex flex-col gap-4 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white tracking-tight">{t('spending.templates')}</h2>
              <button 
                onClick={() => setShowTemplates(false)}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <input 
              type="text"
              placeholder={t('spending.searchTemplates')}
              value={templateSearch}
              onChange={e => setTemplateSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 transition-colors"
            />

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {tickets.filter(t => t.isTemplate && t.name.toLowerCase().includes(templateSearch.toLowerCase())).map(template => (
                <div key={template.id} className="p-3 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <p className="text-white font-medium text-sm">{template.name}</p>
                      {template.defaultAmount && (
                        <p className="text-white/40 text-xs">${template.defaultAmount.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!currentUser) return;
                      
                      await db.tickets.add({
                        ...template,
                        id: undefined,
                        parentId: currentParentId,
                        level: currentLevel as any,
                        isTemplate: false,
                        period: currentParentId === null ? activePeriod : undefined,
                        profileId: currentUser
                      });
                      setShowTemplates(false);
                    }}
                    className="px-4 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg hover:bg-purple-600 shadow-lg shadow-purple-500/20"
                  >
                    {t('spending.useTemplate')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Period Modal */}
      {showNewPeriodModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="glass rounded-3xl p-6 max-w-md w-full flex flex-col gap-5 border border-white/10 shadow-2xl">
            <div className="text-center">
              <span className="text-4xl mb-2 block">📅</span>
              <h3 className="text-2xl font-bold text-white tracking-tight">New Period!</h3>
              <p className="text-white/60 text-sm mt-1">Previous period items have been cleared to keep your tracker fresh. Do you want to import your recurring templates now?</p>
            </div>
            
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowNewPeriodModal(false)}
                className="flex-1 py-3 text-white/40 font-medium hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  setShowNewPeriodModal(false);
                  setShowTemplates(true);
                }}
                className="flex-[2] py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Yes, Show Templates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Modal */}
      {emojiPickerTarget && (
        <EmojiPicker 
          onSelect={(c) => {
            if (emojiPickerTarget === 'new') {
              setNewIcon(c);
              setEmojiPickerTarget(null);
            } else {
              setEditIcon(c);
              if (editingTicketId) {
                db.tickets.update(editingTicketId, { icon: c });
              }
              setEmojiPickerTarget(null);
              setEditingTicketId(null);
            }
          }} 
          onClose={() => setEmojiPickerTarget(null)} 
        />
      )}
    </div>
  );
}
