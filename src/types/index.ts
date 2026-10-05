export type QuoteStatus = 'brouillon' | 'envoye' | 'en_attente' | 'accepte' | 'refuse' | 'expire';

export type OrderStatus = 'a_realiser' | 'en_fabrication' | 'en_finition' | 'prete' | 'livree' | 'terminee';

export type PaymentMethod = 'especes' | 'mobile_money_mtn' | 'mobile_money_orange' | 'virement' | 'autre';

export type DiscountType = 'none' | 'percent' | 'fixed';

export interface CompanySettings {
  id: string;
  name: string;
  activity: string;
  manager_name: string;
  phone_primary: string;
  phone_secondary: string;
  address: string;
  city: string;
  country: string;
  email: string;
  currency: string;
  logo_url: string;
  signature_url: string;
  stamp_url?: string;
  show_stamp_on_quotes?: boolean;
  default_terms: string;
  default_whatsapp_message: string;
  settings_password?: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type QuoteItemType = 'fourniture' | 'main_d_oeuvre';

export interface QuoteItem {
  id: string;
  item_type?: QuoteItemType;
  designation: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface Quote {
  id: string;
  company_id: string;
  quote_number: string;
  date: string;
  validity_days: number;
  status: QuoteStatus;
  
  // Client details snapshotted in quote
  client_id: string;
  client_name: string;
  client_phone: string;
  client_whatsapp: string;
  client_address: string;
  client_email?: string;

  // Project details
  project_object: string; // Objet du devis *
  project_description?: string; // Description du projet / travaux
  execution_location?: string; // Lieu d'exécution des travaux
  estimated_duration?: string; // Durée estimée des travaux

  // Line items
  items: QuoteItem[];

  // Financial calculations
  subtotal: number;
  materials_subtotal?: number;
  labor_subtotal?: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  total_amount: number;
  deposit_requested: number;
  balance_due: number;

  // Notes & terms
  notes?: string;
  terms_and_conditions: string;
  include_stamp?: boolean;

  converted_to_order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  company_id: string;
  order_id: string;
  quote_id?: string;
  client_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference?: string;
  note?: string;
  created_at: string;
}

export interface Order {
  id: string;
  company_id: string;
  order_number: string;
  quote_id?: string;
  quote_number?: string;
  date: string;
  estimated_delivery_date?: string;
  status: OrderStatus;

  // Client snapshotted
  client_id: string;
  client_name: string;
  client_phone: string;
  client_whatsapp: string;
  client_address: string;

  items: QuoteItem[];
  total_amount: number;
  deposit_requested: number;
  notes?: string;

  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_id: string;
  role: 'admin' | 'staff';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
