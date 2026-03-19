import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { TrendingUp, Calendar, Clock, X, Edit2, Trash2 } from 'lucide-react';
import { db } from '../../lib/db';
import { useI18n } from '../../lib/i18n';

interface Report {
  id: string;
  period: 'daily' | 'monthly' | 'yearly';
  label: string;
  startDate: Date;
  endDate: Date;
  total: number;
  ticketBreakdown: { ticketName: string; ticketIcon: string; amount: number; period: string; lastLogDate: Date }[];
}

export default function TabLogs({ currentUser }: { currentUser: number | null }) {
  const { t, language } = useI18n();
  const dateLocale = language === 'de' ? de : undefined;
  const tickets = useLiveQuery(() => {
    if (!currentUser) return [];
    return db.tickets.where('profileId').equals(currentUser).toArray();
  }) || [];
  const expenseLogs = useLiveQuery(() => {
    if (!currentUser) return [];
    return db.expenseLogs.where('profileId').equals(currentUser).toArray();
  }) || [];
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'months' | 'years'>('months');
  const [selectedPeriod, setSelectedPeriod] = useState<{ label: string; total: number; period: string; date: Date } | null>(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<{ ticketName: string; ticketIcon: string; period: string } | null>(null);
  const [historySortBy, setHistorySortBy] = useState<'date' | 'expense'>('expense');
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editLogAmount, setEditLogAmount] = useState<string>('');
  const [editLogDate, setEditLogDate] = useState<string>('');
  
  // Generate reports based on actual expense data
  const reports = useMemo(() => {
    const now = new Date();
    
    // Group by period type and generate reports
    const dailyReports = new Map<string, Report>();
    const monthlyReports = new Map<string, Report>();
    const yearlyReports = new Map<string, Report>();
    
    expenseLogs.forEach(log => {
      const logDate = new Date(log.date);
      const ticket = tickets.find(t => t.id === log.ticketId);
      
      if (!ticket) return;
      
      // Only add expense to reports that match its period hierarchy
      // Daily expense goes to daily, monthly, yearly reports
      // Monthly expense goes to monthly, yearly reports  
      // Yearly expense goes only to yearly reports
      
      // Helper to update breakdown
      const updateBreakdown = (report: Report, ticket: any, logDate: Date) => {
        const icon = ticket.icon || '💵';
        const existing = report.ticketBreakdown.find(tb => tb.ticketName === ticket.name && tb.ticketIcon === icon);
        if (existing) {
          existing.amount += log.amount;
          if (logDate > existing.lastLogDate) existing.lastLogDate = logDate;
        } else {
          report.ticketBreakdown.push({ 
            ticketName: ticket.name, 
            ticketIcon: icon, 
            amount: log.amount, 
            period: ticket.period || 'daily',
            lastLogDate: logDate
          });
        }
      };

      // Daily reports - only for daily expenses
      if (ticket.period === 'daily') {
        const dayKey = format(logDate, 'yyyy-MM-dd');
        if (!dailyReports.has(dayKey)) {
          const dayStart = startOfDay(logDate);
          const dayEnd = endOfDay(logDate);
          const isCompleted = dayEnd < now;
          dailyReports.set(dayKey, {
            id: `daily-${dayKey}`,
            period: 'daily',
            label: format(logDate, 'MMM dd, yyyy', { locale: dateLocale }) + (isCompleted ? ' ✅' : ' 📝'),
            startDate: dayStart,
            endDate: dayEnd,
            total: 0,
            ticketBreakdown: []
          });
        }
        const dailyReport = dailyReports.get(dayKey)!;
        dailyReport.total += log.amount;
        updateBreakdown(dailyReport, ticket, logDate);
      }
      
      // Monthly reports - for daily and monthly expenses
      if (ticket.period === 'daily' || ticket.period === 'monthly') {
        const monthKey = format(logDate, 'yyyy-MM');
        if (!monthlyReports.has(monthKey)) {
          const monthStart = startOfMonth(logDate);
          const monthEnd = endOfMonth(logDate);
          const isCompleted = monthEnd < now;
          monthlyReports.set(monthKey, {
            id: `monthly-${monthKey}`,
            period: 'monthly',
            label: format(logDate, 'MMMM yyyy', { locale: dateLocale }) + (isCompleted ? ' ✅' : ' 📝'),
            startDate: monthStart,
            endDate: monthEnd,
            total: 0,
            ticketBreakdown: []
          });
        }
        const monthlyReport = monthlyReports.get(monthKey)!;
        monthlyReport.total += log.amount;
        updateBreakdown(monthlyReport, ticket, logDate);
      }
      
      // Yearly reports - for all expenses
      const yearKey = format(logDate, 'yyyy');
      if (!yearlyReports.has(yearKey)) {
        const yearStart = startOfYear(logDate);
        const yearEnd = endOfYear(logDate);
        const isCompleted = yearEnd < now;
        yearlyReports.set(yearKey, {
          id: `yearly-${yearKey}`,
          period: 'yearly',
          label: format(logDate, 'yyyy', { locale: dateLocale }) + (isCompleted ? ' ✅' : ' 📝'),
          startDate: yearStart,
          endDate: yearEnd,
          total: 0,
          ticketBreakdown: []
        });
      }
      const yearlyReport = yearlyReports.get(yearKey)!;
      yearlyReport.total += log.amount;
      updateBreakdown(yearlyReport, ticket, logDate);
    });
    
    // Combine all reports, sort each breakdown by amount, and sort reports by date
    const allReports = [...dailyReports.values(), ...monthlyReports.values(), ...yearlyReports.values()];
    
    allReports.forEach(r => {
      r.ticketBreakdown.sort((a, b) => b.amount - a.amount);
    });

    return allReports.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [expenseLogs, tickets, dateLocale]);

  // Calculate projection based on report period and expense types
  const calculateProjection = (report: Report) => {
    const dailyExpenses = report.ticketBreakdown.filter(t => t.period === 'daily').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = report.ticketBreakdown.filter(t => t.period === 'monthly').reduce((sum, t) => sum + t.amount, 0);
    
    if (report.period === 'daily') {
      return dailyExpenses * 365;
    } else if (report.period === 'monthly') {
      // Monthly projection only considers monthly expenses (rent, etc.)
      return monthlyExpenses * 12;
    } else {
      // Yearly projection only considers yearly expenses (annual tickets)
      const yearlyExpenses = report.ticketBreakdown.filter(t => t.period === 'yearly').reduce((sum, t) => sum + t.amount, 0);
      return yearlyExpenses;
    }
  };

  // Generate historical data for history modal
  const historicalData = useMemo(() => {
    const now = new Date();
    const data: { label: string; total: number; period: string; date: Date }[] = [];
    
    if (historyFilter === 'months') {
      // Find the range of months in logs PLUS a buffer from "now"
      let minDate = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1));
      let maxDate = startOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1));
      
      expenseLogs.forEach(log => {
        const d = startOfMonth(new Date(log.date));
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      });

      // Generate all months in that range
      let curr = maxDate;
      while (curr >= minDate) {
        const monthStart = startOfMonth(curr);
        const monthEnd = endOfMonth(curr);
        const monthLogs = expenseLogs.filter(log => {
          const logDate = new Date(log.date);
          return logDate >= monthStart && logDate <= monthEnd;
        });
        const total = monthLogs.reduce((sum, log) => sum + log.amount, 0);
        
        data.push({
          label: format(curr, 'MMMM yyyy', { locale: dateLocale }),
          total,
          period: 'monthly',
          date: new Date(curr)
        });
        curr = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
      }
    } else {
      // Find the range of years in logs PLUS a buffer
      let minYear = now.getFullYear() - 5;
      let maxYear = now.getFullYear() + 10;
      
      expenseLogs.forEach(log => {
        const y = new Date(log.date).getFullYear();
        if (y < minYear) minYear = y;
        if (y > maxYear) maxYear = y;
      });

      for (let y = maxYear; y >= minYear; y--) {
        const yearDate = new Date(y, 0, 1);
        const yearStart = startOfYear(yearDate);
        const yearEnd = endOfYear(yearDate);
        const yearLogs = expenseLogs.filter(log => {
          const logDate = new Date(log.date);
          return logDate >= yearStart && logDate <= yearEnd;
        });
        const total = yearLogs.reduce((sum, log) => sum + log.amount, 0);
        
        data.push({
          label: format(yearDate, 'yyyy'),
          total,
          period: 'yearly',
          date: yearDate
        });
      }
    }
    
    if (historySortBy === 'expense') {
      return data.sort((a, b) => b.total - a.total);
    }
    
    // Sort by date (most recent first)
    return data.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenseLogs, historyFilter, historySortBy]);

  // Calculate detailed breakdown for selected period
  const periodBreakdown = useMemo(() => {
    if (!selectedPeriod) return [];
    
    const periodStart = selectedPeriod.period === 'monthly' 
      ? startOfMonth(selectedPeriod.date)
      : startOfYear(selectedPeriod.date);
    const periodEnd = selectedPeriod.period === 'monthly'
      ? endOfMonth(selectedPeriod.date)
      : endOfYear(selectedPeriod.date);
    
    const periodLogs = expenseLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= periodStart && logDate <= periodEnd;
    });
    
    // Group by ticket
    // Group by name + icon to aggregate template-based tickets
    const ticketTotals = new Map<string, { amount: number; target: number; icon: string; name: string; period: string }>();
    
    periodLogs.forEach(log => {
      const ticket = tickets.find(t => t.id === log.ticketId);
      if (!ticket) return;
      
      const key = `${ticket.name}-${ticket.icon || '💵'}`;
      const existing = ticketTotals.get(key);
      if (existing) {
        existing.amount += log.amount;
        // Keep the largest target if they differ, or just sum? 
        // Usually templates have same target. Let's keep the max to be safe.
        existing.target = Math.max(existing.target, ticket.target || 0);
      } else {
        ticketTotals.set(key, {
          amount: log.amount,
          target: ticket.target || 0,
          icon: ticket.icon || '💵',
          name: ticket.name,
          period: ticket.period || 'monthly'
        });
      }
    });
    
    // Sort by amount descending and take TOP 10
    return Array.from(ticketTotals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [selectedPeriod, expenseLogs, tickets]);

  // Calculate detailed expense items for selected ticket
  const ticketExpenseItems = useMemo(() => {
    if (!selectedPeriod || !selectedTicketDetail) return [];
    
    const periodStart = selectedPeriod.period === 'monthly' 
      ? startOfMonth(selectedPeriod.date)
      : startOfYear(selectedPeriod.date);
    const periodEnd = selectedPeriod.period === 'monthly'
      ? endOfMonth(selectedPeriod.date)
      : endOfYear(selectedPeriod.date);
    
    const items = expenseLogs.filter(log => {
      const logDate = new Date(log.date);
      const ticket = tickets.find(t => t.id === log.ticketId);
      if (!ticket) return false;
      
      const dateMatch = logDate >= periodStart && logDate <= periodEnd;
      const ticketMatch = ticket.name === selectedTicketDetail.ticketName && 
                          (ticket.icon || '💵') === (selectedTicketDetail.ticketIcon || '💵');
      
      return dateMatch && ticketMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return items;
  }, [selectedPeriod, selectedTicketDetail, expenseLogs, tickets]);

  const handleUpdateLog = async (logId: number) => {
    if (!editLogAmount || isNaN(parseFloat(editLogAmount))) return;
    
    const log = expenseLogs.find(l => l.id === logId);
    if (!log) return;
    const ticket = tickets.find(t => t.id === log.ticketId);
    if (!ticket) return;

    const selectedDate = new Date(editLogDate);
    const nowTime = new Date();
    selectedDate.setHours(nowTime.getHours(), nowTime.getMinutes(), nowTime.getSeconds());

    let periodLabel;
    const tPeriod = ticket.period || 'daily';
    if (tPeriod === 'daily') periodLabel = format(selectedDate, 'yyyy-MM-dd');
    else if (tPeriod === 'monthly') periodLabel = format(selectedDate, 'yyyy-MM');
    else periodLabel = format(selectedDate, 'yyyy');

    await db.expenseLogs.update(logId, {
      amount: parseFloat(editLogAmount),
      date: selectedDate.toISOString()
    });
    setEditingLogId(null);
  };

  const handleDeleteLog = async (logId: number) => {
    await db.expenseLogs.delete(logId);
    setEditingLogId(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* T-Rex Mascot */}
      <div className="glass p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />
        <div className="text-7xl mb-2 relative z-10 drop-shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
          🦖🌱
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Garden of Reports
        </h2>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent px-2">
        {t('logs.title')}
      </h2>
        <p className="text-xs text-white/50 max-w-[200px] mt-2">
          {t('logs.gardenDesc')}
        </p>
      </div>

      {/* History Button */}
      <div className="flex justify-center">
        <button 
          onClick={() => setShowHistory(true)}
          className="glass p-3 rounded-2xl border border-white/5 flex items-center gap-2 text-white/80 hover:text-white hover:border-white/10 transition-all"
        >
          <Clock size={16} />
          <span className="text-sm font-medium">{t('logs.history')}</span>
        </button>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass p-6 rounded-3xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{t('logs.history')}</h2>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-white/60 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Tabs and Sort */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-4">
              <button
                onClick={() => setHistoryFilter('months')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  historyFilter === 'months'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {t('logs.months')}
              </button>
              <button
                onClick={() => setHistoryFilter('years')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  historyFilter === 'years'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {t('logs.years')}
              </button>
            </div>
            
            {/* Sort Toggle */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setHistorySortBy(historySortBy === 'date' ? 'expense' : 'date')}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white/80 transition-all"
              >
                {historySortBy === 'expense' ? '💰 Highest' : '📅 Date'}
              </button>
            </div>

            {/* Historical Data */}
            <div className="space-y-3">
              {historicalData.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPeriod(item)}
                  className="w-full glass p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all text-left"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white">{item.label}</h3>
                      <p className="text-sm text-white/60">
                        {item.period === 'monthly' && t('logs.monthly')}
                        {item.period === 'yearly' && t('logs.yearly')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">${item.total.toFixed(2)}</div>
                      <p className="text-xs text-white/50">{t('logs.total')}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    
  {/* Detailed Breakdown Modal */}
      {selectedPeriod && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass p-6 rounded-3xl border border-white/10 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedPeriod.label}</h2>
                <p className="text-sm text-white/60">{t('logs.detailedBreakdown')}</p>
              </div>
              <button 
                onClick={() => setSelectedPeriod(null)}
                className="text-white/60 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary */}
            <div className="glass p-6 rounded-3xl border border-white/5 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">{t('logs.totalSpent')}</h3>
                  <p className="text-sm text-white/60">{selectedPeriod.period}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">${selectedPeriod.total.toFixed(2)}</div>
                  <p className="text-xs text-white/50">{t('logs.total')}</p>
                </div>
              </div>
            </div>

            {/* Ticket Breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white mb-3">{t('logs.ticketBreakdown')}</h3>
              {periodBreakdown.map((ticket: { amount: number; target: number; icon: string; name: string; period: string }, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedTicketDetail({
                    ticketName: ticket.name,
                    ticketIcon: ticket.icon,
                    period: ticket.period
                  })}
                  className="w-full glass p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all text-left"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ticket.icon}</span>
                      <div>
                        <h4 className="font-black text-xl text-white tracking-tight">{ticket.name}</h4>
                        <p className="text-base text-white/50 font-medium">
                          {ticket.period === 'daily' && t('logs.daily')}
                          {ticket.period === 'monthly' && t('logs.monthly')}
                          {ticket.period === 'yearly' && t('logs.yearly')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white tracking-tighter">${ticket.amount.toFixed(2)}</div>
                    </div>
                  </div>
                  {ticket.target > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((ticket.amount / ticket.target) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-white/50">
                          {Math.round((ticket.amount / ticket.target) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Detailed Expense Items */}
            {selectedTicketDetail && (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-white">
                    {selectedTicketDetail.ticketIcon} {selectedTicketDetail.ticketName} - {t('logs.expenseDetails')}
                  </h3>
                  <button
                    onClick={() => setSelectedTicketDetail(null)}
                    className="text-xs text-white/60 hover:text-white"
                  >
                    {t('logs.closeDetails')}
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {ticketExpenseItems.length === 0 ? (
                    <p className="text-white/50 text-center py-4">{t('logs.noExpenses')}</p>
                  ) : (
                    ticketExpenseItems.map((item, idx) => (
                      <div key={idx} className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-3 group hover:bg-white/10 transition-colors">
                        {editingLogId === item.id ? (
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <input 
                                type="date" 
                                value={editLogDate}
                                onChange={e => setEditLogDate(e.target.value)}
                                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none"
                              />
                              <input 
                                type="number" 
                                value={editLogAmount}
                                onChange={e => setEditLogAmount(e.target.value)}
                                className="w-24 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleUpdateLog(item.id!)} className="flex-1 py-2 bg-emerald-500 text-white text-[12px] font-bold rounded-xl uppercase">{t('spending.save')}</button>
                              <button onClick={() => setEditingLogId(null)} className="flex-1 py-2 bg-white/10 text-white text-[12px] font-bold rounded-xl uppercase">{t('profile.cancel')}</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center w-full">
                            <div className="flex gap-4 items-center">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex flex-col items-center justify-center text-[10px] font-bold text-white/40 uppercase">
                                <span>{format(new Date(item.date), 'MMM', { locale: dateLocale })}</span>
                                <span className="text-white text-sm leading-none">{format(new Date(item.date), 'dd')}</span>
                              </div>
                              <div>
                                <p className="text-sm text-white font-bold">${item.amount.toFixed(2)}</p>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none mt-1">{format(new Date(item.date), 'HH:mm')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingLogId(item.id!);
                                    setEditLogAmount(item.amount.toString());
                                    setEditLogDate(format(new Date(item.date), 'yyyy-MM-dd'));
                                  }}
                                  className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteLog(item.id!)}
                                  className="p-2 hover:bg-red-500/10 rounded-xl text-white/40 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <span className="text-[10px] text-white/20 ml-2">{format(new Date(item.date), 'yyyy')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-12 glass rounded-3xl border border-white/5">
            <Calendar size={48} className="mx-auto text-white/30 mb-4" />
            <p className="text-white/50">{t('logs.noReports')}</p>
          </div>
        ) : (
          reports.map(report => {
            // Calculate expense breakdown for this report
            const dailyExpenses = report.ticketBreakdown.filter(t => t.period === 'daily').reduce((sum, t) => sum + t.amount, 0);
            const monthlyExpenses = report.ticketBreakdown.filter(t => t.period === 'monthly').reduce((sum, t) => sum + t.amount, 0);
            const yearlyExpenses = report.ticketBreakdown.filter(t => t.period === 'yearly').reduce((sum, t) => sum + t.amount, 0);
            const projection = calculateProjection(report);
            const periodIcon = report.period === 'daily' ? '☕' : 
                              report.period === 'monthly' ? '💵' : '🏦';
            
            return (
              <div key={report.id} className="glass p-8 rounded-[2.5rem] border border-white/5 transition-all hover:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{periodIcon}</span>
                    <div>
                      <h3 className="font-black text-2xl text-white capitalize tracking-tight">
                      {report.period === 'daily' && t('logs.daily')}
                      {report.period === 'monthly' && t('logs.monthly')}
                      {report.period === 'yearly' && t('logs.yearly')}
                    </h3>
                      <p className="text-base text-white/60 font-medium">{report.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white tracking-tighter">${report.total.toFixed(2)}</div>
                    <p className="text-xs text-white/40 uppercase font-black tracking-widest">Total</p>
                  </div>
                </div>

                {/* Projection */}
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm">
                    <TrendingUp size={14} />
                    <span className="font-semibold">
                      {report.period === 'daily' && t('logs.annualizedDaily')}
                      {report.period === 'monthly' && t('logs.annualizedMonthly')}
                      {report.period === 'yearly' && t('logs.totalAnnualCost')}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                    ${projection.toFixed(2)}
                  </div>
                  
                  {/* Total Annual Expenses (Logged) for Yearly Report */}
                  {report.period === 'yearly' && (
                    <div className="mt-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60 font-medium">{t('logs.totalAnnualExpenses')}:</span>
                        <span className="text-white font-bold text-base">${report.total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Bar Chart for Yearly Report */}
                  {report.period === 'yearly' && (
                    <div className="mt-3">
                      <div className="text-sm text-white/60 mb-2">{t('logs.expenseComposition')}:</div>
                      <div className="space-y-3">
                        {/* Daily Bar */}
                        {dailyExpenses > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="w-16 text-sm text-white/60 text-right">{t('logs.daily')}</div>
                            <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(dailyExpenses / report.total) * 100}%` }}
                              />
                            </div>
                            <div className="w-14 text-sm text-white/70 text-right">{((dailyExpenses / report.total) * 100).toFixed(0)}%</div>
                            <div className="w-20 text-sm text-white text-right">${dailyExpenses.toFixed(0)}</div>
                          </div>
                        )}
                        {/* Monthly Bar */}
                        {monthlyExpenses > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="w-16 text-sm text-white/60 text-right">{t('logs.monthly')}</div>
                            <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${(monthlyExpenses / report.total) * 100}%` }}
                              />
                            </div>
                            <div className="w-14 text-sm text-white/70 text-right">{((monthlyExpenses / report.total) * 100).toFixed(0)}%</div>
                            <div className="w-20 text-sm text-white text-right">${monthlyExpenses.toFixed(0)}</div>
                          </div>
                        )}
                        {/* Yearly Bar */}
                        {yearlyExpenses > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="w-16 text-sm text-white/60 text-right">{t('logs.yearly')}</div>
                            <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${(yearlyExpenses / report.total) * 100}%` }}
                              />
                            </div>
                            <div className="w-14 text-sm text-white/70 text-right">{((yearlyExpenses / report.total) * 100).toFixed(0)}%</div>
                            <div className="w-20 text-sm text-white text-right">${yearlyExpenses.toFixed(0)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ticket Breakdown */}
                {report.ticketBreakdown.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="text-sm text-white/60 mb-2">{t('logs.expenseBreakdown')}:</p>
                    <div className="flex flex-wrap gap-2">
                      {report.ticketBreakdown.slice(0, 10).map((ticket, index) => (
                        <div key={index} className="flex flex-col gap-1 bg-white/5 px-2 py-1.5 rounded-lg">
                          <div className="flex items-center gap-1">
                            <span>{ticket.ticketIcon}</span>
                            <span className="text-xs text-white/80 font-medium">{ticket.ticketName}</span>
                            <span className="text-xs text-purple-400 font-bold ml-auto">${ticket.amount.toFixed(0)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-white/30 uppercase tracking-tighter">
                            <Clock size={8} />
                            <span>{format(ticket.lastLogDate, 'MMM dd, HH:mm', { locale: dateLocale })}</span>
                          </div>
                        </div>
                      ))}
                      {report.ticketBreakdown.length > 10 && (
                        <span className="text-xs text-white/40 px-2 py-1">+{report.ticketBreakdown.length - 10} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

