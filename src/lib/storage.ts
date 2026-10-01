import { 
  CompanySettings, 
  Client, 
  Quote, 
  Order, 
  Payment, 
  UserProfile,
  QuoteStatus,
  OrderStatus
} from '../types';

const STORAGE_KEYS = {
  COMPANY: 'romeo_company_settings_v1',
  CLIENTS: 'romeo_clients_v1',
  QUOTES: 'romeo_quotes_v1',
  ORDERS: 'romeo_orders_v1',
  PAYMENTS: 'romeo_payments_v1',
  CURRENT_USER: 'romeo_current_user_v1',
  TENANTS: 'romeo_tenants_v1',
};

export const DEFAULT_COMPANY: CompanySettings = {
  id: 'comp_romeo_001',
  name: 'ROMÉO MEUBLE',
  activity: 'Menuiserie & Tapisserie',
  manager_name: 'Mouaffo Roméo',
  phone_primary: '+237 688 757 194',
  phone_secondary: '+237 698 833 019',
  address: 'Nkoabang, Yaoundé, Cameroun (À 100 m avant la station Blessing, à côté de Sorepco)',
  city: 'Yaoundé',
  country: 'Cameroun',
  email: 'contact@romeo-meuble.cm',
  currency: 'FCFA',
  logo_url: '/assets/logo.png',
  signature_url: '/assets/signature.png',
  stamp_url: '/assets/cachet.png',
  show_stamp_on_quotes: true,
  default_terms: 'Ce devis est établi selon les dimensions, matériaux, tissus et finitions convenus avec le client. La fabrication commence dès validation du devis et encaissement de l\'acompte convenu. Les délais d\'exécution courent à compter de la réception de l\'acompte.',
  default_whatsapp_message: 'Bonjour {client_name},\n\nVotre devis ROMÉO MEUBLE N° {quote_number} est disponible.\nMontant total : {total_amount} FCFA.\nAcompte demandé : {deposit_amount} FCFA.\n\nVous trouverez le devis PDF complet ci-joint.\n\nMerci pour votre confiance.\n\nROMÉO MEUBLE\nMenuiserie & Tapisserie\nWhatsApp : +237 688 757 194',
  updated_at: new Date().toISOString(),
};

export const DEFAULT_USER: UserProfile = {
  id: 'usr_romeo_001',
  email: 'mouaffo.romeo@romeo-meuble.cm',
  full_name: 'Mouaffo Roméo',
  company_id: 'comp_romeo_001',
  role: 'admin',
};

// Realistic seed data for ROMÉO MEUBLE
const SEED_CLIENTS: Client[] = [
  {
    id: 'cli_001',
    company_id: 'comp_romeo_001',
    name: 'M. Tagne Patrice',
    phone: '+237 699 12 34 56',
    whatsapp: '237699123456',
    address: 'Bastos, face ambassade, Yaoundé',
    email: 'patrice.tagne@gmail.com',
    notes: 'Client fidèle. Préfère les bois durs nobles (Iroko, Bubinga) et tissus anti-taches.',
    created_at: '2026-08-15T09:00:00.000Z',
    updated_at: '2026-08-15T09:00:00.000Z',
  },
  {
    id: 'cli_002',
    company_id: 'comp_romeo_001',
    name: 'Mme Ngo Biyong Jeanne',
    phone: '+237 677 45 89 21',
    whatsapp: '237677458921',
    address: 'Odza Koweït, entrée goudronnée, Yaoundé',
    email: 'jeanne.biyong@yahoo.fr',
    notes: 'Projet ameublement villa neuve. Chambre des maîtres et salon VIP.',
    created_at: '2026-09-02T14:30:00.000Z',
    updated_at: '2026-09-02T14:30:00.000Z',
  },
  {
    id: 'cli_003',
    company_id: 'comp_romeo_001',
    name: 'Dr. Atangana Eric',
    phone: '+237 694 22 10 05',
    whatsapp: '237694221005',
    address: 'Santa Barbara, descente clinique, Yaoundé',
    email: 'e.atangana@santemed.cm',
    notes: 'Réfection complète de canapés cuir / velours pour cabinet médical.',
    created_at: '2026-09-10T11:15:00.000Z',
    updated_at: '2026-09-10T11:15:00.000Z',
  },
  {
    id: 'cli_004',
    company_id: 'comp_romeo_001',
    name: 'Mme Fotso Clarisse',
    phone: '+237 671 90 44 12',
    whatsapp: '237671904412',
    address: 'Quartier du Golf, Yaoundé',
    email: 'clarisse.fotso@gmail.com',
    notes: 'Mobilier haut de gamme salle à manger en bois massif.',
    created_at: '2026-09-20T16:00:00.000Z',
    updated_at: '2026-09-20T16:00:00.000Z',
  },
];

const SEED_QUOTES: Quote[] = [
  {
    id: 'quo_001',
    company_id: 'comp_romeo_001',
    quote_number: 'RM-2026-0001',
    date: '2026-09-12',
    validity_days: 30,
    status: 'accepte',
    client_id: 'cli_001',
    client_name: 'M. Tagne Patrice',
    client_phone: '+237 699 12 34 56',
    client_whatsapp: '237699123456',
    client_address: 'Bastos, face ambassade, Yaoundé',
    client_email: 'patrice.tagne@gmail.com',
    project_object: 'Confection salon prestige & table basse Iroko',
    project_description: 'Fabrication artisanale sur mesure avec finitions de prestige.',
    execution_location: 'Bastos, face ambassade, Yaoundé',
    estimated_duration: '15 jours ouvrés',
    items: [
      {
        id: 'itm_001_1',
        designation: 'Salon complet 7 places en velours royal',
        description: 'Ossature robuste en bois dur traité, mousse polyuréthane HR 35kg/m³, velours antitache bleu nuit',
        quantity: 1,
        unit: 'ensemble',
        unit_price: 550000,
        total_price: 550000,
      },
      {
        id: 'itm_001_2',
        designation: 'Table basse design en bois d\'Iroko massif',
        description: 'Dimensions 120 x 70 cm avec plateau double finition vernis mat satiné et tiroir invisible',
        quantity: 1,
        unit: 'pièce',
        unit_price: 150000,
        total_price: 150000,
      },
      {
        id: 'itm_001_3',
        designation: 'Livraison & installation soignée à Bastos',
        description: 'Transport sécurisé et mise en place dans le salon',
        quantity: 1,
        unit: 'forfait',
        unit_price: 25000,
        total_price: 25000,
      },
    ],
    subtotal: 725000,
    discount_type: 'fixed',
    discount_value: 25000,
    discount_amount: 25000,
    total_amount: 700000,
    deposit_requested: 400000,
    balance_due: 300000,
    notes: 'Livraison convenue pour fin septembre 2026. Teinte tissu validée avec échantillon.',
    terms_and_conditions: DEFAULT_COMPANY.default_terms,
    converted_to_order_id: 'ord_001',
    created_at: '2026-09-12T10:00:00.000Z',
    updated_at: '2026-09-14T11:00:00.000Z',
  },
  {
    id: 'quo_002',
    company_id: 'comp_romeo_001',
    quote_number: 'RM-2026-0002',
    date: '2026-09-18',
    validity_days: 15,
    status: 'en_attente',
    client_id: 'cli_002',
    client_name: 'Mme Ngo Biyong Jeanne',
    client_phone: '+237 677 45 89 21',
    client_whatsapp: '237677458921',
    client_address: 'Odza Koweït, entrée goudronnée, Yaoundé',
    client_email: 'jeanne.biyong@yahoo.fr',
    project_object: 'Aménagement chambre parentale capitonnée',
    project_description: 'Lit King Size capitonné avec rangements intégrés et chevets suspendus.',
    execution_location: 'Odza Koweït, Yaoundé',
    estimated_duration: '10 jours ouvrés',
    items: [
      {
        id: 'itm_002_1',
        designation: 'Lit King Size 180x200 capitonné avec coffre',
        description: 'Tête de lit géométrique 140cm de hauteur en tissu lin beige, vérins hydrauliques pour coffre de rangement',
        quantity: 1,
        unit: 'pièce',
        unit_price: 320000,
        total_price: 320000,
      },
      {
        id: 'itm_002_2',
        designation: 'Tables de chevet suspendues assorties',
        description: 'Deux tiroirs coulisses amorties avec poignées laiton doré',
        quantity: 2,
        unit: 'paire',
        unit_price: 60000,
        total_price: 120000,
      },
    ],
    subtotal: 440000,
    discount_type: 'percent',
    discount_value: 5,
    discount_amount: 22000,
    total_amount: 418000,
    deposit_requested: 250000,
    balance_due: 168000,
    notes: 'Devis envoyé sur WhatsApp pour validation des coloris.',
    terms_and_conditions: DEFAULT_COMPANY.default_terms,
    created_at: '2026-09-18T15:20:00.000Z',
    updated_at: '2026-09-18T15:20:00.000Z',
  },
  {
    id: 'quo_003',
    company_id: 'comp_romeo_001',
    quote_number: 'RM-2026-0003',
    date: '2026-09-22',
    validity_days: 30,
    status: 'envoye',
    client_id: 'cli_003',
    client_name: 'Dr. Atangana Eric',
    client_phone: '+237 694 22 10 05',
    client_whatsapp: '237694221005',
    client_address: 'Santa Barbara, descente clinique, Yaoundé',
    client_email: 'e.atangana@santemed.cm',
    project_object: 'Devis de finition bâtiment & réfection salon',
    project_description: 'Travaux de finition et traitement des éléments en bois, réfection salon d\'attente.',
    execution_location: 'Santa Barbara, descente clinique, Yaoundé',
    estimated_duration: '7 jours ouvrés',
    items: [
      {
        id: 'itm_003_1',
        designation: 'Réfection & retapissage complet canapé d\'attente 5 places',
        description: 'Changement total mousse assise (densité 32kg/m³), sangles neuves, cuir synthétique hospitalier lavable couleur camel',
        quantity: 1,
        unit: 'ensemble',
        unit_price: 260000,
        total_price: 260000,
      },
      {
        id: 'itm_003_2',
        designation: 'Réfection de 2 fauteuils de bureau',
        description: 'Garnissage tapissier et retouches vernis boiserie',
        quantity: 2,
        unit: 'pièce',
        unit_price: 45000,
        total_price: 90000,
      },
    ],
    subtotal: 350000,
    discount_type: 'none',
    discount_value: 0,
    discount_amount: 0,
    total_amount: 350000,
    deposit_requested: 200000,
    balance_due: 150000,
    notes: 'Travail à réaliser rapidement pendant le week-end.',
    terms_and_conditions: DEFAULT_COMPANY.default_terms,
    created_at: '2026-09-22T08:45:00.000Z',
    updated_at: '2026-09-22T08:45:00.000Z',
  },
  {
    id: 'quo_004',
    company_id: 'comp_romeo_001',
    quote_number: 'RM-2026-0004',
    date: '2026-09-27',
    validity_days: 30,
    status: 'brouillon',
    client_id: 'cli_004',
    client_name: 'Mme Fotso Clarisse',
    client_phone: '+237 671 90 44 12',
    client_whatsapp: '237671904412',
    client_address: 'Quartier du Golf, Yaoundé',
    client_email: 'clarisse.fotso@gmail.com',
    project_object: 'Fabrication table à manger 8 places en Iroko',
    project_description: 'Table contemporaine avec piètement acier et chaises assorties.',
    execution_location: 'Quartier du Golf, Yaoundé',
    estimated_duration: '12 jours ouvrés',
    items: [
      {
        id: 'itm_004_1',
        designation: 'Table à manger 8 places en bois massif d\'Iroko',
        description: 'Longueur 220cm, largeur 100cm, pieds en trapèze acier thermo-laqué noir mat, plateau huilé haute protection',
        quantity: 1,
        unit: 'pièce',
        unit_price: 480000,
        total_price: 480000,
      },
      {
        id: 'itm_004_2',
        designation: 'Chaises de salle à manger tapissées grand confort',
        description: 'Dossier ergonomique, assise rembourrée velours ocre et structure bois d\'Iroko',
        quantity: 8,
        unit: 'pièce',
        unit_price: 40000,
        total_price: 320000,
      },
    ],
    subtotal: 800000,
    discount_type: 'percent',
    discount_value: 5,
    discount_amount: 40000,
    total_amount: 760000,
    deposit_requested: 450000,
    balance_due: 310000,
    notes: 'En attente de confirmation finale sur le choix des teintes de bois.',
    terms_and_conditions: DEFAULT_COMPANY.default_terms,
    created_at: '2026-09-27T16:10:00.000Z',
    updated_at: '2026-09-27T16:10:00.000Z',
  },
];

const SEED_ORDERS: Order[] = [
  {
    id: 'ord_001',
    company_id: 'comp_romeo_001',
    order_number: 'CMD-2026-0001',
    quote_id: 'quo_001',
    quote_number: 'RM-2026-0001',
    date: '2026-09-14',
    estimated_delivery_date: '2026-10-05',
    status: 'en_fabrication',
    client_id: 'cli_001',
    client_name: 'M. Tagne Patrice',
    client_phone: '+237 699 12 34 56',
    client_whatsapp: '237699123456',
    client_address: 'Bastos, face ambassade, Yaoundé',
    items: SEED_QUOTES[0].items,
    total_amount: 700000,
    deposit_requested: 400000,
    notes: 'Structure bois terminée à l\'atelier. Phase découpe mousses et couture du velours en cours.',
    created_at: '2026-09-14T11:00:00.000Z',
    updated_at: '2026-09-16T14:00:00.000Z',
  },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'pay_001',
    company_id: 'comp_romeo_001',
    order_id: 'ord_001',
    quote_id: 'quo_001',
    client_id: 'cli_001',
    amount: 250000,
    payment_date: '2026-09-14',
    payment_method: 'mobile_money_mtn',
    reference: 'TXN-MTN-984321',
    note: 'Premier acompte versé à la signature du devis',
    created_at: '2026-09-14T11:15:00.000Z',
  },
  {
    id: 'pay_002',
    company_id: 'comp_romeo_001',
    order_id: 'ord_001',
    quote_id: 'quo_001',
    client_id: 'cli_001',
    amount: 150000,
    payment_date: '2026-09-20',
    payment_method: 'especes',
    reference: 'RECU-ESP-014',
    note: 'Complément acompte remis à l\'atelier de Nkoabang après inspection du squelette bois',
    created_at: '2026-09-20T17:00:00.000Z',
  },
];

// Helper to safely read localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

export class StorageService {
  // --- AUTH & USER ---
  static getCurrentUser(): UserProfile {
    return loadFromStorage<UserProfile>(STORAGE_KEYS.CURRENT_USER, DEFAULT_USER);
  }

  static setCurrentUser(user: UserProfile): void {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  }

  // --- COMPANY SETTINGS ---
  static getCompany(): CompanySettings {
    const current = loadFromStorage<CompanySettings>(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
    let changed = false;
    if (!current.logo_url) {
      current.logo_url = '/assets/logo.png';
      changed = true;
    }
    if (!current.stamp_url || current.stamp_url.includes('romeo-meuble-cachet')) {
      current.stamp_url = '/assets/cachet.png';
      changed = true;
    }
    if (!current.signature_url) {
      current.signature_url = '/assets/signature.png';
      changed = true;
    }
    if (current.show_stamp_on_quotes === undefined) {
      current.show_stamp_on_quotes = true;
      changed = true;
    }
    if (changed) {
      saveToStorage(STORAGE_KEYS.COMPANY, current);
    }
    return current;
  }

  static updateCompany(settings: Partial<CompanySettings>): CompanySettings {
    const current = this.getCompany();
    const updated: CompanySettings = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.COMPANY, updated);
    return updated;
  }

  // --- CLIENTS ---
  static getClients(): Client[] {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, SEED_CLIENTS);
    return all.filter(c => c.company_id === user.company_id);
  }

  static getClientById(id: string): Client | undefined {
    return this.getClients().find(c => c.id === id);
  }

  static saveClient(client: Partial<Client> & { name: string; phone: string; address: string }): Client {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, SEED_CLIENTS);
    
    // Sanitize phone
    const cleanWhatsapp = client.whatsapp || client.phone.replace(/\D/g, '');

    if (client.id) {
      const idx = all.findIndex(c => c.id === client.id && c.company_id === user.company_id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...client,
          whatsapp: cleanWhatsapp,
          updated_at: new Date().toISOString(),
        };
        saveToStorage(STORAGE_KEYS.CLIENTS, all);
        return all[idx];
      }
    }

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      company_id: user.company_id,
      name: client.name.trim(),
      phone: client.phone.trim(),
      whatsapp: cleanWhatsapp,
      address: client.address.trim(),
      email: client.email?.trim(),
      notes: client.notes?.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    all.unshift(newClient);
    saveToStorage(STORAGE_KEYS.CLIENTS, all);
    return newClient;
  }

  static deleteClient(id: string): boolean {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, SEED_CLIENTS);
    const filtered = all.filter(c => !(c.id === id && c.company_id === user.company_id));
    saveToStorage(STORAGE_KEYS.CLIENTS, filtered);
    return true;
  }

  // --- QUOTES (DEVIS) ---
  static getQuotes(): Quote[] {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Quote[]>(STORAGE_KEYS.QUOTES, SEED_QUOTES);
    return all
      .filter(q => q.company_id === user.company_id)
      .map(q => ({
        ...q,
        project_object: q.project_object || (q.items?.[0]?.designation ? `Confection ${q.items[0].designation}` : 'Travaux de menuiserie et tapisserie'),
        project_description: q.project_description || '',
        execution_location: q.execution_location || q.client_address || '',
        estimated_duration: q.estimated_duration || '',
      }));
  }

  static getQuoteById(id: string): Quote | undefined {
    return this.getQuotes().find(q => q.id === id);
  }

  /**
   * Generates next sequential unique quote number: RM-YYYY-0001
   */
  static getNextQuoteNumber(): string {
    const quotes = this.getQuotes();
    const currentYear = new Date().getFullYear();
    const prefix = `RM-${currentYear}-`;

    let maxSeq = 0;
    quotes.forEach(q => {
      if (q.quote_number && q.quote_number.startsWith(prefix)) {
        const seqPart = parseInt(q.quote_number.slice(prefix.length), 10);
        if (!isNaN(seqPart) && seqPart > maxSeq) {
          maxSeq = seqPart;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  static saveQuote(quote: Partial<Quote>): Quote {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Quote[]>(STORAGE_KEYS.QUOTES, SEED_QUOTES);

    const now = new Date().toISOString();

    if (quote.id) {
      const idx = all.findIndex(q => q.id === quote.id && q.company_id === user.company_id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...quote,
          project_object: quote.project_object !== undefined ? quote.project_object : (all[idx].project_object || 'Travaux de menuiserie et tapisserie'),
          project_description: quote.project_description !== undefined ? quote.project_description : (all[idx].project_description || ''),
          execution_location: quote.execution_location !== undefined ? quote.execution_location : (all[idx].execution_location || ''),
          estimated_duration: quote.estimated_duration !== undefined ? quote.estimated_duration : (all[idx].estimated_duration || ''),
          updated_at: now,
        } as Quote;
        saveToStorage(STORAGE_KEYS.QUOTES, all);
        return all[idx];
      }
    }

    const newQuote: Quote = {
      id: `quo_${Date.now()}`,
      company_id: user.company_id,
      quote_number: quote.quote_number || this.getNextQuoteNumber(),
      date: quote.date || new Date().toISOString().slice(0, 10),
      validity_days: quote.validity_days || 30,
      status: quote.status || 'brouillon',
      client_id: quote.client_id || '',
      client_name: quote.client_name || '',
      client_phone: quote.client_phone || '',
      client_whatsapp: quote.client_whatsapp || '',
      client_address: quote.client_address || '',
      client_email: quote.client_email,
      project_object: quote.project_object || 'Travaux de menuiserie et tapisserie',
      project_description: quote.project_description || '',
      execution_location: quote.execution_location || '',
      estimated_duration: quote.estimated_duration || '',
      items: quote.items || [],
      subtotal: quote.subtotal || 0,
      discount_type: quote.discount_type || 'none',
      discount_value: quote.discount_value || 0,
      discount_amount: quote.discount_amount || 0,
      total_amount: quote.total_amount || 0,
      deposit_requested: quote.deposit_requested || 0,
      balance_due: quote.balance_due || 0,
      notes: quote.notes,
      terms_and_conditions: quote.terms_and_conditions || this.getCompany().default_terms,
      include_stamp: quote.include_stamp !== undefined ? quote.include_stamp : (this.getCompany().show_stamp_on_quotes ?? true),
      created_at: now,
      updated_at: now,
    };

    all.unshift(newQuote);
    saveToStorage(STORAGE_KEYS.QUOTES, all);
    return newQuote;
  }

  static updateQuoteStatus(id: string, status: QuoteStatus): Quote | undefined {
    const quotes = this.getQuotes();
    const quote = quotes.find(q => q.id === id);
    if (!quote) return undefined;
    return this.saveQuote({ ...quote, status });
  }

  static deleteQuote(id: string): boolean {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Quote[]>(STORAGE_KEYS.QUOTES, SEED_QUOTES);
    const filtered = all.filter(q => !(q.id === id && q.company_id === user.company_id));
    saveToStorage(STORAGE_KEYS.QUOTES, filtered);
    return true;
  }

  /**
   * Duplicate quote: creates a new quote with new number, current date,
   * copies lines and calculations, keeps original untouched!
   */
  static duplicateQuote(id: string): Quote | undefined {
    const original = this.getQuoteById(id);
    if (!original) return undefined;

    const newQuoteNumber = this.getNextQuoteNumber();
    const clonedItems = original.items.map(item => ({
      ...item,
      id: `itm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    }));

    return this.saveQuote({
      ...original,
      id: undefined,
      quote_number: newQuoteNumber,
      date: new Date().toISOString().slice(0, 10),
      status: 'brouillon',
      items: clonedItems,
      converted_to_order_id: undefined,
      notes: `Duplicata de ${original.quote_number}. ${original.notes || ''}`.trim(),
    });
  }

  // --- ORDERS (COMMANDES) ---
  static getOrders(): Order[] {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    return all.filter(o => o.company_id === user.company_id);
  }

  static getOrderById(id: string): Order | undefined {
    return this.getOrders().find(o => o.id === id);
  }

  static getNextOrderNumber(): string {
    const orders = this.getOrders();
    const currentYear = new Date().getFullYear();
    const prefix = `CMD-${currentYear}-`;

    let maxSeq = 0;
    orders.forEach(o => {
      if (o.order_number && o.order_number.startsWith(prefix)) {
        const seqPart = parseInt(o.order_number.slice(prefix.length), 10);
        if (!isNaN(seqPart) && seqPart > maxSeq) {
          maxSeq = seqPart;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  static saveOrder(order: Partial<Order>): Order {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    const now = new Date().toISOString();

    if (order.id) {
      const idx = all.findIndex(o => o.id === order.id && o.company_id === user.company_id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          ...order,
          updated_at: now,
        } as Order;
        saveToStorage(STORAGE_KEYS.ORDERS, all);
        return all[idx];
      }
    }

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      company_id: user.company_id,
      order_number: order.order_number || this.getNextOrderNumber(),
      quote_id: order.quote_id,
      quote_number: order.quote_number,
      date: order.date || new Date().toISOString().slice(0, 10),
      estimated_delivery_date: order.estimated_delivery_date,
      status: order.status || 'a_realiser',
      client_id: order.client_id || '',
      client_name: order.client_name || '',
      client_phone: order.client_phone || '',
      client_whatsapp: order.client_whatsapp || '',
      client_address: order.client_address || '',
      items: order.items || [],
      total_amount: order.total_amount || 0,
      deposit_requested: order.deposit_requested || 0,
      notes: order.notes,
      created_at: now,
      updated_at: now,
    };

    all.unshift(newOrder);
    saveToStorage(STORAGE_KEYS.ORDERS, all);
    return newOrder;
  }

  static updateOrderStatus(id: string, status: OrderStatus): Order | undefined {
    const order = this.getOrderById(id);
    if (!order) return undefined;
    return this.saveOrder({ ...order, status });
  }

  static deleteOrder(id: string): boolean {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    const filtered = all.filter(o => !(o.id === id && o.company_id === user.company_id));
    saveToStorage(STORAGE_KEYS.ORDERS, filtered);
    return true;
  }

  /**
   * Convert an accepted quote into a formal production order
   */
  static convertQuoteToOrder(quoteId: string): Order | null {
    const quote = this.getQuoteById(quoteId);
    if (!quote) return null;

    // Check if already converted
    if (quote.converted_to_order_id) {
      const existing = this.getOrderById(quote.converted_to_order_id);
      if (existing) return existing;
    }

    // 1. Mark quote accepted if not already
    this.updateQuoteStatus(quoteId, 'accepte');

    // 2. Create the order
    const order = this.saveOrder({
      quote_id: quote.id,
      quote_number: quote.quote_number,
      order_number: this.getNextOrderNumber(),
      client_id: quote.client_id,
      client_name: quote.client_name,
      client_phone: quote.client_phone,
      client_whatsapp: quote.client_whatsapp,
      client_address: quote.client_address,
      items: quote.items,
      total_amount: quote.total_amount,
      deposit_requested: quote.deposit_requested,
      status: 'a_realiser',
      notes: `Commande issue du devis validé ${quote.quote_number}. ${quote.notes || ''}`.trim(),
    });

    // 3. Link order to quote
    this.saveQuote({
      ...quote,
      status: 'accepte',
      converted_to_order_id: order.id,
    });

    return order;
  }

  // --- PAYMENTS ---
  static getPayments(orderId?: string): Payment[] {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const companyPayments = all.filter(p => p.company_id === user.company_id);
    if (orderId) {
      return companyPayments.filter(p => p.order_id === orderId);
    }
    return companyPayments;
  }

  static savePayment(payment: Omit<Payment, 'id' | 'company_id' | 'created_at'> & { id?: string }): Payment {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const now = new Date().toISOString();

    const newPayment: Payment = {
      id: payment.id || `pay_${Date.now()}`,
      company_id: user.company_id,
      order_id: payment.order_id,
      quote_id: payment.quote_id,
      client_id: payment.client_id,
      amount: Math.max(0, payment.amount),
      payment_date: payment.payment_date || now.slice(0, 10),
      payment_method: payment.payment_method,
      reference: payment.reference?.trim(),
      note: payment.note?.trim(),
      created_at: now,
    };

    all.unshift(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, all);
    return newPayment;
  }

  static deletePayment(id: string): boolean {
    const user = this.getCurrentUser();
    const all = loadFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const filtered = all.filter(p => !(p.id === id && p.company_id === user.company_id));
    saveToStorage(STORAGE_KEYS.PAYMENTS, filtered);
    return true;
  }

  // --- STATS HELPER ---
  static getDashboardStats() {
    const quotes = this.getQuotes();
    const orders = this.getOrders();
    const payments = this.getPayments();

    const totalQuotesCount = quotes.length;
    const pendingQuotesCount = quotes.filter(q => q.status === 'en_attente' || q.status === 'envoye').length;
    const acceptedQuotesCount = quotes.filter(q => q.status === 'accepte').length;
    const rejectedQuotesCount = quotes.filter(q => q.status === 'refuse').length;

    const totalQuotesAmount = quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const acceptedQuotesAmount = quotes
      .filter(q => q.status === 'accepte')
      .reduce((sum, q) => sum + (q.total_amount || 0), 0);

    const totalCollectedPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Remaining on active orders
    const totalOrdersAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const remainingToCollect = Math.max(0, totalOrdersAmount - totalCollectedPayments);

    const activeOrdersCount = orders.filter(o => o.status !== 'terminee').length;

    return {
      totalQuotesCount,
      pendingQuotesCount,
      acceptedQuotesCount,
      rejectedQuotesCount,
      totalQuotesAmount,
      acceptedQuotesAmount,
      totalCollectedPayments,
      remainingToCollect,
      activeOrdersCount,
      totalOrdersCount: orders.length,
    };
  }

  // Reset database back to seed demo
  static resetToDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.COMPANY);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.QUOTES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}
