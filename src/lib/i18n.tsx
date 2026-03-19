import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Language = 'en' | 'de';

interface I18nContextProps {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string, variables?: Record<string, string>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.back': 'Back',

    // Periods and Time
    'period.daily': 'Daily',
    'period.monthly': 'Monthly', 
    'period.yearly': 'Yearly',
    'period.annual': 'Annual',
    'period.daily.short': 'Daily',
    'period.monthly.short': 'Monthly', 
    'period.yearly.short': 'Yearly',

    // Months
    'month.january': 'January',
    'month.february': 'February',
    'month.march': 'March',
    'month.april': 'April',
    'month.may': 'May',
    'month.june': 'June',
    'month.july': 'July',
    'month.august': 'August',
    'month.september': 'September',
    'month.october': 'October',
    'month.november': 'November',
    'month.december': 'December',

    // Weekdays
    'weekday.sunday': 'Sunday',
    'weekday.monday': 'Monday',
    'weekday.tuesday': 'Tuesday',
    'weekday.wednesday': 'Wednesday',
    'weekday.thursday': 'Thursday',
    'weekday.friday': 'Friday',
    'weekday.saturday': 'Saturday',

    // App Shell
    'app.spending': 'Spending',
    'app.logs': 'Logs & History',
    'app.inflation': 'Inflation',
    'app.chores': 'Chores',
    'app.export': 'Export Data',
    'app.import': 'Import Backup',
    'app.logout': 'Logout',
    'app.logoutConfirm': 'Are you sure you want to log out? Your data will be preserved locally.',
    'app.editProfile': 'Edit Profile',
    'profile.name': 'Name',
    'profile.picture': 'Profile Picture',
    'profile.save': 'Save Changes',
    'profile.cancel': 'Cancel',
    
    // Setup Screen
    'setup.welcome': 'Welcome to LifeLedger',
    'setup.subtitle': 'Your sleek, local-first tracker for spending and daily chores.',
    'setup.nameLabel': 'What should we call you?',
    'setup.namePlaceholder': 'e.g. Alex',
    'setup.pictureLabel': 'Profile Picture',
    'setup.pictureHelp': 'Click to upload a custom profile image',
    'setup.trackingLabel': 'Default Tracking Period',
    'setup.daily': 'Daily',
    'setup.weekly': 'Weekly',
    'setup.monthly': 'Monthly',
    'setup.start': 'Get Started',
    'setup.login': 'Sign In',
    'setup.selectProfile': 'Select existing profile',
    'setup.createNew': 'Create new profile',
    'setup.deleteProfile': 'Delete Profile',
    'setup.deleteConfirm': 'Are you sure you want to delete this profile? Its settings will be lost, but your global tickets and logs will remain.',

    // Tab Spending
    'spending.home': 'Home',
    'spending.items': '{{name}} Items',
    'spending.allCategories': 'All Categories',
    'spending.spent': 'Spent',
    'spending.target': 'Target',
    'spending.addPlaceholder': 'Ticket Name',
    'spending.targetPlaceholder': 'Target Amount (Optional)',
    'spending.saveTemplate': 'Save as template for future reuse',
    'spending.defaultPrice': 'Default Price',
    'spending.saveTicket': 'Save Ticket',
    'spending.empty': 'No items yet. Tap + to add {{type}}.',
    'spending.category': 'a category',
    'spending.item': 'an item',
    'spending.recentLogs': 'Recent Logs',
    'spending.deleteCategory': 'Delete Category',
    'spending.deleteItem': 'Delete Item',
    'spending.save': 'Save',
    'spending.templates': 'Templates',
    'spending.searchTemplates': 'Search templates...',
    'spending.noTemplates': 'No templates yet.',
    'spending.noTemplatesDesc': 'Save items as templates when creating them!',
    'spending.noTemplatesFound': 'No templates found matching "{{search}}"',
    'spending.useTemplate': 'Use',
    'spending.addCategory': 'Add Category',
    'spending.total.daily': 'Total daily expenses',
    'spending.total.monthly': 'Total monthly and daily expenses',
    'spending.total.yearly': 'Total daily, monthly and annual expenses',
    'spending.spent.thisDay': 'Total daily expenses',
    'spending.spent.thisMonth': 'Total monthly & daily expenses',
    'spending.spent.thisYear': 'Total daily, monthly & annual expenses',
    'spending.spent.daily': 'spent on daily expenses',
    'spending.spent.monthly': 'spent on monthly expenses',
    'spending.spent.yearly': 'spent on yearly expenses',
    'spending.logDate': 'Date',
    'spending.rollup.daily.title': 'Daily → Monthly',
    'spending.rollup.daily.desc': 'Daily expenses accumulated this month',
    'spending.rollup.subperiod.title': 'Daily & Monthly → Yearly',
    'spending.rollup.subperiod.desc': 'Sub-period expenses accumulated this year',

    // Tab Logs
    'logs.title': 'Expense History',
    'logs.currentPeriod': '{{period}} Period',
    'logs.totalExpensesUsed': 'Total Expenses',
    'logs.previousPeriod': 'Previous {{period}}',
    'logs.decreasedBy': 'Decreased by',
    'logs.increasedBy': 'Increased by',
    'logs.perYear': 'per year',
    'logs.filterDaily': 'Daily',
    'logs.filterWeekly': 'Weekly',
    'logs.filterMonthly': 'Monthly',
    'logs.filterYearly': 'Yearly',
    'logs.period': 'Period',
    'logs.total': 'Total Spent',
    'logs.change': 'Change',
    'logs.vsPrevious': 'vs previous period',
    'logs.projectionTitle': 'Annual Projection',
    'logs.projectionDesc': 'Based on your recent spending habits, you are on track to spend:',
    'logs.gardenDesc': 'Review your completed spending periods and grow your financial wisdom!',
    'logs.noReports': 'No reports yet. Start logging expenses to see your spending history!',
    'logs.thisYear': 'this year.',
    'logs.annualizedDaily': 'Annualized Daily Expenses',
    'logs.annualizedMonthly': 'Annualized Monthly Expenses',
    'logs.totalAnnual': 'Total Annual Expenses',
    'logs.expenseDetails': 'Expense Details',
    'logs.closeDetails': 'Close Details',
    'logs.noExpenses': 'No expenses recorded',
    'logs.daily': 'Daily',
    'logs.monthly': 'Monthly',
    'logs.yearly': 'Yearly',
    'logs.totalAnnualCost': 'Total Annual Cost',
    'logs.totalAnnualExpenses': 'Total Annual Expenses',
    'logs.history': 'History',
    'logs.months': 'Months',
    'logs.years': 'Years',
    'logs.detailedBreakdown': 'Detailed Breakdown',
    'logs.totalSpent': 'Total Spent',
    'logs.ticketBreakdown': 'Ticket Breakdown',
    'logs.expenseBreakdown': 'Expense Breakdown',
    'logs.target': 'Target',
    'logs.expenseComposition': 'Expense Composition',

    // CatTower Status
    'budget.lookingGood': 'Looking Good!',
    'budget.atBudget': 'At Budget!',
    'budget.gettingClose': 'Getting Close...',
    'budget.overBudget': 'Over Budget!',
    'budget.spent': 'spent',
    'budget.target': 'Target',
    'budget.percentOfTarget': 'of target',
    'inflation.priceIncreased': 'Price Increased',
    'inflation.priceDecreased': 'Price Decreased',
    'inflation.noChange': 'No Change',
    'inflation.oldPrice': 'Previous Price',
    'inflation.newPrice': 'New Price',
    'inflation.daysPassed': 'Days since change',
    'inflation.annualRate': 'Annual Rate',
    'inflation.projection': '{{years}}-year projection',
    'inflation.title': 'Inflation Tracker',
    'inflation.subtitle': 'We monitor your saved items to track how fast the cost of your life is rising (or falling).',
    'inflation.overDays': 'Over {{days}} Days',
    'inflation.totalChange': 'Total Change',
    'inflation.tooEarly': 'Too early to annualize',
    'inflation.projectionLabel': '{{years}}-Year Projection',
    'inflation.horizon': 'Projection Horizon',
    'inflation.years': 'Years',
    'inflation.yearlyPace': 'Yearly pace',
    'inflation.empty': 'No inflation data yet. Save items as "templates" with default prices in your spending tracker and edit them later to track inflation!',
    'trex.summer': 'Summer T-Rex',
    'trex.rainy': 'Rainy T-Rex',
    'trex.freezing': 'Freezing T-Rex',
    'chores.yourChores': 'Your Chores',

    // Tab Chores
    'chores.title': 'Daily Chores',
    'chores.home': 'Home',
    'chores.addPlaceholder': 'Chore Title (e.g. Do Dishes)',
    'chores.saveChore': 'Save Chore',
    'chores.empty': 'No chores here. Tap + to add one',
    'chores.completed': 'Completed Today',
    'chores.markComplete': 'Mark Complete',
    'chores.recurring': 'Recurring Daily',
    'chores.completedToday': 'Completed Today',
    'chores.deleteCategory': 'Delete Group',
    'chores.deleteItem': 'Delete Chore',
  },
  de: {
    // Common
    'common.back': 'Zurück',

    // Periods and Time
    'period.daily': 'Täglich',
    'period.monthly': 'Monatlich',
    'period.yearly': 'Jährlich',
    'period.annual': 'Jährlich',
    'period.daily.short': 'Täglich',
    'period.monthly.short': 'Monatlich',
    'period.yearly.short': 'Jährlich',

    // Months
    'month.january': 'Januar',
    'month.february': 'Februar',
    'month.march': 'März',
    'month.april': 'April',
    'month.may': 'Mai',
    'month.june': 'Juni',
    'month.july': 'Juli',
    'month.august': 'August',
    'month.september': 'September',
    'month.october': 'Oktober',
    'month.november': 'November',
    'month.december': 'Dezember',

    // Weekdays
    'weekday.sunday': 'Sonntag',
    'weekday.monday': 'Montag',
    'weekday.tuesday': 'Dienstag',
    'weekday.wednesday': 'Mittwoch',
    'weekday.thursday': 'Donnerstag',
    'weekday.friday': 'Freitag',
    'weekday.saturday': 'Samstag',

    // App Shell
    'app.spending': 'Ausgaben',
    'app.logs': 'Verlauf',
    'app.inflation': 'Inflation',
    'app.chores': 'Aufgaben',
    'app.export': 'Exportieren',
    'app.import': 'Importieren',
    'app.logout': 'Abmelden',
    'app.logoutConfirm': 'Möchtest du dich wirklich abmelden? Deine Daten bleiben lokal gespeichert.',
    'app.editProfile': 'Profil bearbeiten',
    'profile.name': 'Name',
    'profile.picture': 'Profilbild',
    'profile.save': 'Änderungen speichern',
    'profile.cancel': 'Abbrechen',
    
    // Setup Screen
    'setup.welcome': 'Willkommen bei LifeLedger',
    'setup.subtitle': 'Dein moderner, lokaler Tracker für Ausgaben und tägliche Aufgaben.',
    'setup.nameLabel': 'Wie sollen wir dich nennen?',
    'setup.namePlaceholder': 'z.B. Alex',
    'setup.pictureLabel': 'Profilbild',
    'setup.pictureHelp': 'Klicke hier, um ein eigenes Bild hochzuladen',
    'setup.trackingLabel': 'Standard-Zeitraum',
    'setup.daily': 'Täglich',
    'setup.weekly': 'Wöchentlich',
    'setup.monthly': 'Monatlich',
    'setup.start': 'Lass uns anfangen',
    'setup.selectProfile': 'Vorhandenes Profil wählen',
    'setup.createNew': 'Neues Profil erstellen',
    'setup.deleteProfile': 'Profil löschen',
    'setup.deleteConfirm': 'Bist du sicher, dass du dieses Profil löschen möchtest? Die Einstellungen gehen verloren, aber deine globalen Tickets und Logs bleiben erhalten.',

    // Tab Spending
    'spending.home': 'Start',
    'spending.items': '{{name}} Artikel',
    'spending.allCategories': 'Alle Kategorien',
    'spending.spent': 'Ausgegeben',
    'spending.target': 'Ziel',
    'spending.addPlaceholder': 'Kategoriename',
    'spending.targetPlaceholder': 'Zielbetrag (Optional)',
    'spending.saveTemplate': 'Als Vorlage für die Zukunft speichern',
    'spending.defaultPrice': 'Standardpreis',
    'spending.saveTicket': 'Speichern',
    'spending.empty': 'Noch keine Einträge. Tippe auf +, um {{type}} hinzuzufügen.',
    'spending.category': 'eine Kategorie',
    'spending.item': 'einen Artikel',
    'spending.recentLogs': 'Letzte Einträge',
    'spending.deleteCategory': 'Kategorie löschen',
    'spending.deleteItem': 'Artikel löschen',
    'spending.save': 'Speichern',
    'spending.templates': 'Vorlagen',
    'spending.searchTemplates': 'Vorlagen durchsuchen...',
    'spending.noTemplates': 'Noch keine Vorlagen.',
    'spending.noTemplatesDesc': 'Speichere Artikel als Vorlagen beim Erstellen!',
    'spending.noTemplatesFound': 'Keine Vorlagen gefunden für "{{search}}"',
    'spending.useTemplate': 'Verwenden',
    'spending.addCategory': 'Kategorie hinzufügen',
    'spending.total.daily': 'Gesamte tägliche Ausgaben',
    'spending.total.monthly': 'Gesamte monatliche und tägliche Ausgaben',
    'spending.total.yearly': 'Gesamte tägliche, monatliche und jährliche Ausgaben',
    'spending.spent.thisDay': 'Gesamte Tagesausgaben',
    'spending.spent.thisMonth': 'Gesamte Monats- & Tagesausgaben',
    'spending.spent.thisYear': 'Gesamte Tages-, Monats- & Jahresausgaben',
    'spending.spent.daily': 'für Tagesausgaben ausgegeben',
    'spending.spent.monthly': 'für Monatsausgaben ausgegeben',
    'spending.spent.yearly': 'für Jahresausgaben ausgegeben',
    'spending.logDate': 'Datum',
    'spending.rollup.daily.title': 'Täglich → Monatlich',
    'spending.rollup.daily.desc': 'Summe aller bisherigen Tagesausgaben in diesem Monat',
    'spending.rollup.subperiod.title': 'Täglich & Monatlich → Jährlich',
    'spending.rollup.subperiod.desc': 'Summe aller bisherigen Tages- und Monatsausgaben in diesem Jahr',

    // Tab Logs
    'logs.title': 'Ausgabenverlauf',
    'logs.currentPeriod': '{{period}} Zeitraum',
    'logs.totalExpensesUsed': 'Gesamtausgaben',
    'logs.previousPeriod': 'Vorheriger {{period}}',
    'logs.decreasedBy': 'Gesunken um',
    'logs.increasedBy': 'Gestiegen um',
    'logs.perYear': 'pro Jahr',
    'logs.filterDaily': 'Täglich',
    'logs.filterWeekly': 'Wöchentlich',
    'logs.filterMonthly': 'Monatlich',
    'logs.filterYearly': 'Jährlich',
    'logs.period': 'Zeitraum',
    'logs.total': 'Gesamtausgaben',
    'logs.change': 'Änderung',
    'logs.vsPrevious': 'vs. Vorzeitraum',
    'logs.projectionTitle': 'Jahresprognose',
    'logs.projectionDesc': 'Basierend auf deinen aktuellen Ausgaben wirst du dieses Jahr voraussichtlich ausgeben:',
    'logs.gardenDesc': 'Analysiere deinen Fortschritt und meistere deine Finanzen!',
    'logs.noReports': 'Noch keine Berichte. Beginne damit, Ausgaben zu protokollieren, um deine Ausgabenhistorie zu sehen!',
    'logs.thisYear': 'in diesem Jahr.',
    'logs.annualizedDaily': 'Jährliche Tagesausgaben',
    'logs.annualizedMonthly': 'Jährliche Monatsausgaben',
    'logs.totalAnnual': 'Gesamte jährliche Ausgaben',
    'logs.expenseDetails': 'Ausgabendetails',
    'logs.closeDetails': 'Details schließen',
    'logs.noExpenses': 'Keine Ausgaben erfasst',
    'logs.daily': 'Täglich',
    'logs.monthly': 'Monatlich',
    'logs.yearly': 'Jährlich',
    'logs.totalAnnualCost': 'Jährliche Fixkosten',
    'logs.totalAnnualExpenses': 'Gesamte jährliche Ausgaben',
    'logs.history': 'Verlauf',
    'logs.months': 'Monate',
    'logs.years': 'Jahre',
    'logs.totalSpent': 'Gesamtausgaben',
    'logs.ticketBreakdown': 'Ticket-Zusammensetzung',
    'logs.expenseBreakdown': 'Ausgabenaufschlüsselung',
    'logs.expenseComposition': 'Ausgabenzusammensetzung',

    // CatTower Status
    'budget.lookingGood': 'Alles gut!',
    'budget.atBudget': 'Budget erreicht!',
    'budget.gettingClose': 'Gleich erreicht...',
    'budget.overBudget': 'Budget überschritten!',
    'budget.spent': 'ausgegeben',
    'budget.target': 'Ziel',
    'budget.percentOfTarget': 'vom Ziel',
    'inflation.priceIncreased': 'Preis ist gestiegen',
    'inflation.priceDecreased': 'Preis ist gesunken',
    'inflation.noChange': 'Keine Veränderung',
    'inflation.oldPrice': 'Bisheriger Preis',
    'inflation.newPrice': 'Neuer Preis',
    'inflation.daysPassed': 'Tage seit Änderung',
    'inflation.annualRate': 'Jährliche Rate',
    'inflation.projection': '{{years}}-Jahres-Prognose',
    'inflation.title': 'Preis-Monitor',
    'inflation.subtitle': 'Wir behalten deine gespeicherten Artikel im Auge, um zu sehen, wie sich deine Lebenshaltungskosten verändern.',
    'inflation.overDays': 'Über {{days}} Tage',
    'inflation.totalChange': 'Gesamtveränderung',
    'inflation.tooEarly': 'Zu wenig Daten für eine Prognose',
    'inflation.projectionLabel': '{{years}}-Jahres-Prognose',
    'inflation.horizon': 'Prognose-Zeitraum',
    'inflation.years': 'Jahre',
    'inflation.yearlyPace': 'Jährlicher Trend',
    'inflation.empty': 'Noch keine Inflationsdaten. Speichere Artikel als „Vorlagen“ mit Standardpreisen in deiner Ausgabenübersicht und bearbeite sie später, um die Preisentwicklung zu verfolgen!',
    'trex.summer': 'Sommer-Saurier',
    'trex.rainy': 'Regen-Saurier',
    'trex.freezing': 'Eis-Saurier',
    'chores.yourChores': 'Deine Aufgaben',

    // Tab Chores
    'chores.title': 'Tägliche Aufgaben',
    'chores.home': 'Start',
    'chores.addPlaceholder': 'Titel der Aufgabe (z.B. Abwasch)',
    'chores.saveChore': 'Aufgabe speichern',
    'chores.empty': 'Hier gibt es noch nichts zu tun. Erstelle deine erste Aufgabe mit +.',
    'chores.completed': 'Heute erledigt',
    'chores.markComplete': 'Als erledigt markieren',
    'chores.recurring': 'Täglich wiederkehrend',
    'chores.completedToday': 'Heute erledigt',
    'chores.deleteCategory': 'Gruppe löschen',
    'chores.deleteItem': 'Aufgabe löschen',
  }
};

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'de' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const t = (key: string, variables?: Record<string, string>) => {
    let text = translations[language][key] || key;
    if (variables) {
      Object.keys(variables).forEach(varKey => {
        text = text.replace(`{{${varKey}}}`, variables[varKey]);
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
}
