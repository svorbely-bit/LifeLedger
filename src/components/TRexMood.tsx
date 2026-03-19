import { motion } from 'framer-motion';
import { useI18n } from '../lib/i18n';

interface TRexMoodProps {
  percentage: number;
}

export function TRexMood({ percentage }: TRexMoodProps) {
  const { t } = useI18n();
  let title = '';
  let icon = '';
  let color = '';
  let bgGradient = '';

  if (percentage >= 70) {
    title = t('trex.summer');
    icon = '🦖🏖️☀️';
    color = 'text-orange-400';
    bgGradient = 'from-orange-500/20 to-yellow-500/20';
  } else if (percentage >= 50) {
    title = t('trex.rainy');
    icon = '🦖🌧️🌂';
    color = 'text-blue-400';
    bgGradient = 'from-blue-500/20 to-cyan-500/20';
  } else {
    title = t('trex.freezing');
    icon = '🦖❄️⛄';
    color = 'text-indigo-300';
    bgGradient = 'from-indigo-500/20 to-blue-900/40';
  }

  return (
    <div className={`glass p-6 rounded-3xl relative overflow-hidden text-center transition-colors duration-1000 border border-white/5`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} pointer-events-none transition-colors duration-1000`} />
      
      <motion.div 
        key={icon} // re-animate when icon changes
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="text-7xl mb-2 relative z-10 drop-shadow-xl flex justify-center"
      >
         <span className={percentage >= 70 ? 'animate-bounce' : ''} style={{ animationDuration: '2s' }}>
            {icon}
         </span>
      </motion.div>
      
      <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${color.replace('text-', 'from-').replace('300', '400')} to-white relative z-10`}>
        {title}
      </h2>
      <p className={`text-2xl font-bold mt-1 max-w-[280px] mx-auto relative z-10 font-medium ${
    percentage >= 100 ? 'text-green-400' : 
    percentage >= 50 ? 'text-yellow-400' : 
    'text-red-400'
  }`}>
         Score: {Math.round(percentage)}%
      </p>
    </div>
  );
}
