import { useState } from 'react';
import { Search } from 'lucide-react';

const EMOJI_DB = [
  // Money & Finance
  { char: '💵', en: 'money cash dollar currency', de: 'geld bargeld dollar währung' },
  { char: '💶', en: 'euro money cash currency', de: 'euro geld bargeld währung' },
  { char: '💴', en: 'yen money cash currency', de: 'yen geld bargeld währung' },
  { char: '💷', en: 'pound money cash currency', de: 'pfund geld bargeld währung' },
  { char: '💰', en: 'money bag wealth rich', de: 'geldbeutel reichtum vermögen' },
  { char: '💳', en: 'credit card payment bank', de: 'kreditkarte bezahlung bank' },
  { char: '🏧', en: 'atm cash machine', de: 'geldautomat bargeld' },
  { char: '💸', en: 'money with wings spend', de: 'geld fliegt ausgeben' },
  { char: '🪙', en: 'coin money change', de: 'münze geld wechselgeld' },
  
  // Food & Drink
  { char: '☕', en: 'coffee cafe drink morning', de: 'kaffee cafe getränk trinken morgen' },
  { char: '🍕', en: 'pizza food slice italian', de: 'pizza essen stück italienisch' },
  { char: '🍔', en: 'burger fast food hamburger', de: 'burger fastfood hamburger' },
  { char: '🧀', en: 'cheese food dairy', de: 'käse essen milchprodukt' },
  { char: '🍬', en: 'candy sweet sugar', de: 'süßigkeiten bonbon zucker' },
  { char: '🍷', en: 'wine alcohol drink', de: 'wein alkohol getränk' },
  { char: '🍺', en: 'beer alcohol drink', de: 'bier alkohol getränk' },
  { char: '🍻', en: 'beer cheers bar hopping', de: 'bier kneipe prosten feiern' },
  { char: '🥤', en: 'drink soda juice', de: 'getränk limonade saft' },
  { char: '🍎', en: 'apple fruit healthy', de: 'apfel obst gesund' },
  { char: '🍌', en: 'banana fruit', de: 'banane obst' },
  { char: '🥗', en: 'salad healthy food', de: 'salat gesund essen' },
  { char: '🍝', en: 'pasta italian food', de: 'pasta italienisch essen' },
  { char: '🌮', en: 'taco mexican food', de: 'taco mexikanisch essen' },
  { char: '🍰', en: 'cake dessert birthday', de: 'kuchen dessert geburtstag' },
  
  // Home & Living
  { char: '🏠', en: 'house home rent building', de: 'haus miete wohnung gebäude' },
  { char: '🏡', en: 'house with garden home', de: 'haus mit garten heim' },
  { char: '🏢', en: 'office work building', de: 'büro arbeit gebäude' },
  { char: '🏪', en: 'shop store retail', de: 'geschäft laden einzelhandel' },
  { char: '🏨', en: 'hotel accommodation travel', de: 'hotel unterkunft reisen' },
  { char: '🏠', en: 'apartment flat rent', de: 'wohnung miete' },
  { char: '🛋️', en: 'sofa furniture living room', de: 'sofa möbel wohnzimmer' },
  { char: '🛏️', en: 'bed bedroom sleep', de: 'bett schlafzimmer schlafen' },
  { char: '🚿', en: 'shower bathroom clean', de: 'dusche badezimmer sauber' },
  
  // Transportation
  { char: '🚗', en: 'car auto driving vehicle', de: 'auto fahren kfz fahrzeug' },
  { char: '🚕', en: 'taxi cab transport', de: 'taxi transport' },
  { char: '🚌', en: 'bus public transport', de: 'bus öffentlicher nahverkehr' },
  { char: '🚇', en: 'metro subway train', de: 'metro u-bahn zug' },
  { char: '✈️', en: 'plane flight travel airport', de: 'flugzeug flug reisen flughafen' },
  { char: '🚂', en: 'train railway transport', de: 'zug eisenbahn transport' },
  { char: '🚲', en: 'bicycle bike cycling', de: 'fahrrad rad fahren' },
  { char: '🏍️', en: 'motorcycle bike', de: 'motorrad motorrad' },
  { char: '⛽', en: 'gas fuel station petrol', de: 'benzin tanken tankstelle' },
  { char: '🚗', en: 'parking car', de: 'parken auto' },
  
  // Health & Medical
  { char: '🏥', en: 'hospital health medical doctor', de: 'krankenhaus kranken pflege arzt' },
  { char: '💊', en: 'pill medicine health pharmacy', de: 'pille tablette medizin apotheke' },
  { char: '🩺', en: 'stethoscope doctor medical', de: 'stethoskop arzt medizinisch' },
  { char: '🦷', en: 'tooth dental dentist', de: 'zahn zahnarzt zahnmedizin' },
  { char: '🧴', en: 'lotion cream skincare', de: 'lotion creme hautpflege' },
  { char: '🧻', en: 'toilet paper bathroom', de: 'toilettenpapier badezimmer' },
  { char: '🩹', en: 'band aid first aid', de: 'pflaster erste hilfe' },
  
  // Entertainment & Leisure
  { char: '🎮', en: 'game gaming leisure play', de: 'spiel zocken freizeit spielen' },
  { char: '🎯', en: 'target goal aim', de: 'ziel zielsetzung' },
  { char: '🎪', en: 'circus carnival fun', de: 'zirkus karneval spaß' },
  { char: '🎨', en: 'art paint creative', de: 'kunst malen kreativ' },
  { char: '🎭', en: 'theater drama show', de: 'theater drama show vorstellung' },
  { char: '🎪', en: 'festival event party', de: 'festival event party feier' },
  { char: '🎸', en: 'guitar music instrument', de: 'gitarre musik instrument' },
  { char: '🎬', en: 'movie film cinema', de: 'film kino' },
  { char: '📺', en: 'television tv show', de: 'fernsehen tv show' },
  
  // Shopping & Services
  { char: '🛒', en: 'cart shopping groceries buy', de: 'einkaufswagen einkaufen lebensmittel kaufen' },
  { char: '🛍️', en: 'shopping bags buy retail', de: 'einkaufstüten kaufen einzelhandel' },
  { char: '🎫', en: 'ticket club entrance fee event', de: 'ticket eintritt club event gebühr' },
  { char: '💳', en: 'payment card credit debit', de: 'zahlung karte kredit debit' },
  { char: '🏪', en: 'store shop market', de: 'geschäft laden markt' },
  { char: '🏬', en: 'department store mall', de: 'kaufhaus einkaufszentrum' },
  
  // Clothing & Fashion
  { char: '👗', en: 'dress clothes fashion', de: 'kleid kleidung mode' },
  { char: '👔', en: 'shirt business formal', de: 'hemd geschäftlich formell' },
  { char: '👟', en: 'shoes sneakers footwear', de: 'schuhe sneaker schuhwerk' },
  { char: '👠', en: 'heels shoes formal', de: 'high heels schuhe formell' },
  { char: '🧥', en: 'coat jacket winter', de: 'mantel jacke winter' },
  { char: '👖', en: 'pants jeans trousers', de: 'hose jeans hose' },
  { char: '🧢', en: 'cap hat headwear', de: 'kappe hut kopfbedeckung' },
  
  // Education & Work
  { char: '📚', en: 'books education reading study', de: 'bücher bildung lesen lernen studieren' },
  { char: '📝', en: 'notebook writing notes', de: 'notizbuch schreiben notizen' },
  { char: '✏️', en: 'pencil writing draw', de: 'bleistift schreiben zeichnen' },
  { char: '🎓', en: 'graduation school university', de: 'abschluss schule universität' },
  { char: '💻', en: 'computer laptop work', de: 'computer laptop arbeit' },
  { char: '⌨️', en: 'keyboard typing office', de: 'tastatur tippen büro' },
  { char: '📱', en: 'phone mobile smartphone', de: 'telefon mobil smartphone' },
  
  // Sports & Fitness
  { char: '⚽', en: 'soccer football sport', de: 'fußball sport' },
  { char: '🏀', en: 'basketball sport ball', de: 'basketball sport ball' },
  { char: '🎾', en: 'tennis sport racket', de: 'tennis sport schläger' },
  { char: '🏊', en: 'swimming pool water', de: 'schwimmen pool wasser' },
  { char: '🏃', en: 'running fitness exercise', de: 'laufen fitness sport übung' },
  { char: '🏋️', en: 'gym weights fitness', de: 'fitnessstudio gewichte fitness' },
  { char: '🚴', en: 'cycling bike sport', de: 'radfahren fahrrad sport' },
  
  // Nature & Weather
  { char: '☀️', en: 'sun sunny weather hot', de: 'sonne sonnig wetter heiß' },
  { char: '🌧️', en: 'rain rainy weather wet', de: 'regen regnerisch wetter nass' },
  { char: '❄️', en: 'snow cold winter', de: 'schnee kalt winter' },
  { char: '🌈', en: 'rainbow colorful happy', de: 'regenbogen bunt glücklich' },
  { char: '🌳', en: 'tree nature green', de: 'baum natur grün' },
  { char: '🌺', en: 'flower plant nature', de: 'blume pflanze natur' },
  
  // Animals & Pets
  { char: '🐕', en: 'dog pet animal', de: 'hund haustier tier' },
  { char: '🐈', en: 'cat pet animal', de: 'katze haustier tier' },
  { char: '🐠', en: 'fish aquarium pet', de: 'fisch aquarium haustier' },
  { char: '🐹', en: 'hamster pet small', de: 'hamster haustier klein' },
  
  // Emotions & People
  { char: '😊', en: 'happy smile good', de: 'glücklich lächeln gut' },
  { char: '😢', en: 'sad cry bad', de: 'traurig weinen schlecht' },
  { char: '😴', en: 'sleep tired rest', de: 'schlafen müde ruhe' },
  { char: '🤔', en: 'thinking idea question', de: 'denken idee frage' },
  { char: '👍', en: 'thumbs up good yes', de: 'daumen hoch gut ja' },
  { char: '👎', en: 'thumbs down bad no', de: 'daumen runter schlecht nein' },
  { char: '❤️', en: 'heart love like', de: 'herz liebe mögen' },
  { char: '⭐', en: 'star favorite good', de: 'stern favorit gut' },
  
  // Symbols & Signs
  { char: '⚠️', en: 'warning danger alert', de: 'warnung gefahr alarm' },
  { char: '✅', en: 'check done complete', de: 'haken erledigt komplett' },
  { char: '❌', en: 'cross wrong delete', de: 'kreuz falsch löschen' },
  { char: '🔥', en: 'fire hot popular', de: 'feuer heiß beliebt' },
  { char: '💡', en: 'idea lightbulb smart', de: 'idee glühbirne schlau' },
  { char: '🔔', en: 'bell notification alert', de: 'glocke benachrichtigung alarm' },
  { char: '📌', en: 'pin important note', de: 'pin wichtig notiz' },
  { char: '🎯', en: 'target goal aim', de: 'ziel zielsetzung zielen' },
  { char: '📈', en: 'chart growth increase', de: 'diagramm wachstum zunahme' },
  { char: '📉', en: 'chart decrease loss', de: 'diagramm abnahme verlust' },
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
