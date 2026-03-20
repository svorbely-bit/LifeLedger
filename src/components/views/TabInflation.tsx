import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { differenceInDays, isSameDay, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Activity, TrendingUp, TrendingDown, Clock, ShieldAlert, X, Edit2, Calendar } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

export default function TabInflation({ currentUser }: { currentUser: number | null }) {
  const { t, language } = useI18n();
  const dateLocale = language === 'de' ? de : undefined;
  const [projectionYears, setProjectionYears] = useState(5);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editLogDate, setEditLogDate] = useState<string>('');
  const [editLogAmount, setEditLogAmount] = useState<string>('');
  const priceHistory = useLiveQuery(() => {
    if (!currentUser) return [];
    return db.priceHistory.where('profileId').equals(currentUser).toArray();
  }) || [];
  const ticketsQuery = useLiveQuery(() => {
    if (!currentUser) return [];
    return db.tickets.where('profileId').equals(currentUser).toArray();
  }) || [];
  
  // Create a map of tickets for quick lookup
  const ticketsObj = ticketsQuery.reduce((acc, t) => {
    acc[t.id!] = t;
    return acc;
  }, {} as Record<number, any>);

  // Process history by ticket to get inflation rates
  // Only displaying tickets that have actual recorded history
  const activeInflationItems = priceHistory.reduce((acc, log) => {
    if (!acc[log.ticketId]) {
      acc[log.ticketId] = {
        logs: [],
        ticket: ticketsObj[log.ticketId]
      };
    }
    acc[log.ticketId].logs.push(log);
    return acc;
  }, {} as Record<number, any>);

  const items = Object.values(activeInflationItems).map((data: any) => {
     // sort logs by date
     const sortedLogs = data.logs.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
     
     // Calculate overall inflation from first log to most recent one (or current price)
     const firstLog = sortedLogs[0];
     const lastLog = sortedLogs[sortedLogs.length - 1];
     
     const startPrice = firstLog.oldAmount;
     const endPrice = lastLog.newAmount;
     const percentageChange = ((endPrice - startPrice) / startPrice) * 100;
     
     const daysPassed = differenceInDays(new Date(lastLog.date), new Date(firstLog.date));
     
     // Only calculate annualized rate if there's at least 1 day difference
     // Otherwise, we show the raw change as "too early"
     const isTooShort = daysPassed < 1;
     const annualizedRate = isTooShort ? 0 : (percentageChange / daysPassed) * 365;

     // 5-year projection calculation 
     // We cap the rate at a very high but not "infinite" level for the math
     const projectValue = (years: number) => {
       if (isTooShort) return endPrice;
       // Cap the rate for compound projection to avoid astronomical numbers from noise
       const cappedRate = Math.min(Math.max(annualizedRate, -90), 500); 
       const r = cappedRate / 100;
       return endPrice * Math.pow(1 + r, years);
     };
     
     return {
       ticket: data.ticket,
       startPrice,
       endPrice,
       percentageChange,
       daysPassed,
       annualizedRate,
       isTooShort,
       projectValue
     };
  }).filter(item => item.ticket); // Ensure the ticket still exists

  const handleDeleteHistoryEntry = async (id: number) => {
    await db.priceHistory.delete(id);
  };

  const handleEditHistoryEntry = async (id: number) => {
    const log = priceHistory.find(l => l.id === id);
    if (!log) return;
    
    setEditingLogId(id);
    setEditLogDate(format(new Date(log.date), 'yyyy-MM-dd'));
    setEditLogAmount(log.newAmount.toString());
  };

  const handleUpdateHistoryEntry = async () => {
    if (!editingLogId) return;
    
    const selectedDate = new Date(editLogDate);
    const nowTime = new Date();
    selectedDate.setHours(nowTime.getHours(), nowTime.getMinutes(), nowTime.getSeconds());

    await db.priceHistory.update(editingLogId, {
      amount: parseFloat(editLogAmount),
      date: selectedDate.toISOString()
    });
    setEditingLogId(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="glass p-6 rounded-3xl relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 pointer-events-none" />
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mb-4 shadow-xl">
           <Activity size={32} />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          {t('inflation.title')}
        </h2>
        <p className="text-white/60 text-sm mt-2 max-w-[280px] mx-auto">
           {t('inflation.subtitle')}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center p-8 glass rounded-3xl border border-white/5 opacity-80">
          <ShieldAlert size={32} className="mx-auto text-white/30 mb-3" />
          <p className="text-white/50 text-sm leading-relaxed">
             {t('inflation.empty')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-4 bg-white/5 p-3 rounded-2xl border border-white/5">
            <span className="text-white/70 text-sm font-medium">{t('inflation.horizon')}:</span>
            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl">
              <input 
                type="number" 
                value={projectionYears}
                onChange={e => setProjectionYears(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 bg-transparent text-center px-1 outline-none text-white font-bold"
              />
              <span className="text-white/50 text-xs pr-2">{t('inflation.years')}</span>
            </div>
          </div>
          
          <div className="grid gap-4">
            {items.map((item, i) => {
            const isInflation = item.percentageChange > 0;
            const isDeflation = item.percentageChange < 0;
            const isExpanded = expandedTicketId === item.ticket.id;
            
            // Format + or - sign properly
            const sign = isInflation ? '+' : '';
            const colorClass = isInflation ? 'text-red-400' : (isDeflation ? 'text-green-400' : 'text-white/60');
            const Icon = isInflation ? TrendingUp : (isDeflation ? TrendingDown : Activity);

            const ticketLogs = priceHistory
              .filter(log => log.ticketId === item.ticket.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <div key={i} className="flex flex-col gap-2">
                <div 
                  className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all"
                  onClick={() => setExpandedTicketId(isExpanded ? null : item.ticket.id!)}
                >
                  <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 ${colorClass}`}>
                    <Icon size={80} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl shadow-inner border border-white/5">
                        {item.ticket.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{item.ticket.name}</h3>
                        <div className="text-xs text-white/40 flex items-center gap-1">
                          <Clock size={10}/> {t('inflation.overDays', { days: item.daysPassed.toString() })}
                        </div>
                      </div>
                    </div>
                    <div className="text-white/20 group-hover:text-white/40 transition-colors">
                      {isExpanded ? <X size={20} /> : <Clock size={20} />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                    <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{t('inflation.totalChange')}</div>
                      <div className={`text-lg font-bold ${colorClass}`}>
                        {sign}{item.percentageChange.toFixed(2)}%
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        ${item.startPrice.toFixed(2)} → ${item.endPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                       <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{t('inflation.annualRate')}</div>
                       <div className={`text-lg font-bold ${item.isTooShort ? 'text-white/30' : colorClass}`}>
                         {item.isTooShort ? '---' : `${sign}${item.annualizedRate.toFixed(2)}%`}
                       </div>
                       <div className="text-xs text-white/50 mt-1">
                         {item.isTooShort ? t('inflation.tooEarly') : t('inflation.yearlyPace')}
                       </div>
                    </div>
                  </div>

                  {/* Projection */}
                  <div className="bg-gradient-to-br from-white/5 to-white/0 p-4 rounded-2xl border border-white/5 relative z-10">
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{t('inflation.projectionLabel', { years: projectionYears.toString() })}</span>
                       <span className="text-sm font-bold text-white/90">
                         {item.isTooShort ? 'TBD' : `$${item.projectValue(projectionYears).toFixed(2)}`}
                       </span>
                     </div>
                     {!item.isTooShort && isInflation && (
                       <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden flex">
                         <div className="h-full bg-white/30" style={{ width: '40%' }}></div>
                         <div className="h-full bg-red-400/80 animate-pulse" style={{ width: '60%' }}></div>
                       </div>
                     )}
                  </div>
                </div>

                {/* Expanded History List */}
                {isExpanded && (
                  <div className="flex flex-col gap-2 px-2 animate-in slide-in-from-top-2 duration-300">
                    {ticketLogs.map((log) => (
                      <div key={log.id} className="glass p-3 rounded-2xl border border-white/5 flex items-center justify-between group/item">
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] text-white/30 font-bold uppercase tracking-tighter w-12 border-r border-white/5 text-center">
                            {format(new Date(log.date), 'MMM d', { locale: dateLocale })}
                          </div>
                          <div className="text-xs">
                            <span className="text-white/40">${log.oldAmount.toFixed(2)}</span>
                            <span className="mx-2 text-white/20">→</span>
                            <span className="text-white font-bold">${log.newAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {editingLogId === log.id ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex gap-2">
                                <div className="flex items-center gap-2">
                                  <Calendar size={16} className="text-white/60" />
                                  <input 
                                    type="date" 
                                    value={editLogDate}
                                    onChange={e => setEditLogDate(e.target.value)}
                                    className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none"
                                  />
                                </div>
                                <input 
                                  type="number" 
                                  value={editLogAmount}
                                  onChange={e => setEditLogAmount(e.target.value)}
                                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleUpdateHistoryEntry()} className="flex-1 py-2 bg-emerald-500 text-white text-[12px] font-bold rounded-xl uppercase">{t('spending.save')}</button>
                                <button onClick={() => setEditingLogId(null)} className="flex-1 py-2 bg-white/10 text-white text-[12px] font-bold rounded-xl uppercase">{t('profile.cancel')}</button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingLogId(log.id!);
                                setEditLogDate(format(new Date(log.date), 'yyyy-MM-dd'));
                                setEditLogAmount(log.newAmount.toString());
                              }}
                              className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors"
                              title="Edit entry"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHistoryEntry(log.id!);
                            }}
                            className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover/item:opacity-100 hover:bg-red-500/20 transition-all flex items-center justify-center"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHistoryEntry(log.id!);
                          }}
                          className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover/item:opacity-100 hover:bg-red-500/20 transition-all flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
