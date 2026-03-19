import { useState } from 'react';
import { Search } from 'lucide-react';

const EMOJI_DB = [
  { char: '💵', en: 'money cash dollar', de: 'geld bargeld dollar' },
  { char: '☕', en: 'coffee cafe drink', de: 'kaffee cafe getränk trinken' },
  { char: '🍕', en: 'pizza food slice', de: 'pizza essen stück' },
  { char: '🍔', en: 'burger fast food', de: 'burger fastfood' },
  { char: '🧀', en: 'cheese food', de: 'käse essen' },
  { char: '🍬', en: 'candy sweet', de: 'süßigkeiten bonbon' },
  { char: '🏠', en: 'house home rent', de: 'haus miete wohnung' },
  { char: '🚗', en: 'car auto driving', de: 'auto fahren kfz' },
  { char: '⛽', en: 'gas fuel station', de: 'benzin tanken tankstelle' },
  { char: '🏥', en: 'hospital health medical', de: 'krankenhaus kranken pflege arzt' },
  { char: '💊', en: 'pill medicine health', de: 'pille tablette medizin' },
  { char: '🎮', en: 'game gaming leisure', de: 'spiel zocken freizeit' },
  { char: '🍻', en: 'beer cheers bar hopping', de: 'bier kneipe prosten' },
  { char: '🎫', en: 'ticket club entrance fee', de: 'ticket eintritt club' },
  { char: '🛒', en: 'cart shopping groceries', de: 'einkaufswagen einkaufen lebensmittel' },
  { char: '👗', en: 'dress clothes fashion', de: 'kleid kleidung mode' },
  { char: '✈️', en: 'plane flight travel', de: 'flugzeug flug reisen' },
  { char: '📚', en: 'books education reading', de: 'bücher bildung lesen' },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = EMOJI_DB.filter(e => {
    const s = search.toLowerCase();
    return e.en.includes(s) || e.de.includes(s) || e.char.includes(s);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background/90 glass p-4 rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2 mb-4 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Search size={18} className="text-white/50" />
          <input 
            type="text" 
            placeholder="Search emoji (en/de)..." 
            className="bg-transparent border-none text-white focus:outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        
        <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
          {filtered.map(e => (
            <button
              key={e.char}
              onClick={() => onSelect(e.char)}
              className="text-3xl hover:scale-125 transition-transform aspect-square flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/20"
            >
              {e.char}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-6 text-center text-white/50 text-sm py-4">
              No emojis found. Try different keywords.
            </div>
          )}
        </div>
        
        <button 
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl border border-white/10 hover:bg-white/10 text-white/70 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
