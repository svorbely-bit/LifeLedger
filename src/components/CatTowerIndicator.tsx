import { motion } from 'framer-motion';
import { useI18n } from '../lib/i18n';

interface CatTowerIndicatorProps {
  spent: number;
  target: number;
}

export function CatTowerIndicator({ spent, target }: CatTowerIndicatorProps) {
  const { t } = useI18n();
  const hasTarget = target > 0;
  const percentage = hasTarget ? (spent / target) * 100 : 0;
  
  // Custom scaling: 0% = barely visible, 100% = full height, capped at 100% for all values
  const visualPercentage = hasTarget 
    ? Math.min(percentage, 100)
    : Math.min((spent / Math.max(spent, 100)) * 25, 25); // Show small bar for spent amount when no target
  
  let towerColor = 'bg-blue-400';
  let catEmoji = '🐈‍⬛🐾';
  let statusText = hasTarget ? t('budget.lookingGood') : `${spent.toFixed(0)} ${t('budget.spent')}`;
  let weatherEffects = null;

  if (hasTarget) {
    if (percentage >= 100) {
      towerColor = 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]';
      catEmoji = '😿';
      statusText = percentage > 100 ? t('budget.overBudget') : t('budget.atBudget');
      weatherEffects = (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-4 text-4xl animate-pulse">⛈</div>
          <div className="absolute top-6 right-6 text-2xl animate-pulse">⛈</div>
          <div className="absolute top-10 left-8 text-3xl animate-pulse">⛈</div>
          <div className="absolute bottom-2 right-4 text-xl animate-bounce">💧</div>
          <div className="absolute bottom-6 left-6 text-lg animate-bounce">💧</div>
        </div>
      );
    } else if (percentage >= 60) {
      towerColor = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]';
      catEmoji = '😼🐾';
      statusText = t('budget.gettingClose');
      weatherEffects = (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-4 text-2xl text-white/60 animate-pulse">☁️</div>
          <div className="absolute top-6 right-6 text-xl text-white/50 animate-pulse">☁️</div>
          <div className="absolute top-10 left-8 text-lg text-white/40 animate-pulse">☁️</div>
        </div>
      );
    } else {
      towerColor = 'bg-green-400';
      catEmoji = '😺🐾';
      statusText = t('budget.lookingGood');
    }
  }

  return (
    <div className="flex flex-col items-center justify-end h-80 w-full relative">
       {hasTarget && (
         <>
           <div className="text-white/60 text-sm font-black absolute top-0 -translate-y-full tracking-widest uppercase mb-2 z-20">
             {t('budget.target')}
           </div>
           
           {/* Target Line marker */}
           <div className="w-full absolute top-0 left-0 border-t-2 border-dashed border-white/30 z-10" />
         </>
       )}

       {/* Outer Container for Tower */}
       <div className="h-full w-32 bg-white/5 rounded-t-2xl relative flex flex-col justify-end border-l border-r border-t border-white/10">
         
         {/* The Clipped filling */}
         <div className="absolute inset-0 rounded-t-[1.4rem] overflow-hidden">
            {/* The growing tower / scratched post */}
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${visualPercentage}%` }}
              transition={{ duration: 1, type: "spring", bounce: 0.4 }}
              className={`w-full ${towerColor} relative flex items-start justify-center pt-2 transition-colors duration-500 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]`}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
            />
         </div>

         {/* The Cat sitting right on top - OUTSIDE the overflow-hidden div */}
         <motion.div 
            key={catEmoji}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 0.8, 
              opacity: 1,
              bottom: `${percentage >= 100 ? 50 : percentage * 0.5}%`
            }}
            transition={{ 
              bottom: { duration: 1, type: "spring", bounce: 0.2 },
              scale: { duration: 0.2 }
            }}
            className={`absolute left-1/2 -translate-x-1/2 text-4xl drop-shadow-md z-30 translate-y-[0.5rem]`}
         >
           {catEmoji}
         </motion.div>
       </div>

       {/* Weather Effects - OUTSIDE tower container so always visible */}
       {weatherEffects}
       
       <div className="mt-8 text-center pt-2">
        <p className="font-black text-2xl text-white tracking-tight leading-none mb-1">{statusText}</p>
        {hasTarget && (
          <div className="flex flex-col gap-1">
            <p className="text-base text-white/50 font-medium">{Math.round(percentage)}% {t('budget.percentOfTarget')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
