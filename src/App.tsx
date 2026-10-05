/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { CompanySettings, Quote, Client, Order, UserProfile } from './types';
import { StorageService } from './lib/storage';
import { generateQuotePDF, downloadPDF } from './lib/pdfGenerator';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { QuotesList } from './components/QuotesList';
import { QuoteEditor } from './components/QuoteEditor';
import { QuotePreviewModal } from './components/QuotePreviewModal';
import { OrdersList } from './components/OrdersList';
import { ClientsList } from './components/ClientsList';
import { ClientModal } from './components/ClientModal';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { SettingsPasswordModal } from './components/SettingsPasswordModal';

function MainApp() {
  const { showToast } = useToast();

  // Authentication & Session protection
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(StorageService.isLoggedIn());
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState<boolean>(false);
  const [isSettingsPasswordOpen, setIsSettingsPasswordOpen] = useState<boolean>(false);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'quotes' | 'orders' | 'clients' | 'settings'>('dashboard');

  // Core Data State
  const [company, setCompany] = useState<CompanySettings>(StorageService.getCompany());
  const [user, setUser] = useState<UserProfile>(StorageService.getCurrentUser());
  const [quotes, setQuotes] = useState<Quote[]>(StorageService.getQuotes());
  const [clients, setClients] = useState<Client[]>(StorageService.getClients());
  const [orders, setOrders] = useState<Order[]>(StorageService.getOrders());

  // Editor and Modal States
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [activeQuoteForEdit, setActiveQuoteForEdit] = useState<Quote | null>(null);
  const [activeQuoteForPreview, setActiveQuoteForPreview] = useState<Quote | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // Refresh data from storage
  const refreshAllData = useCallback(() => {
    setCompany(StorageService.getCompany());
    setUser(StorageService.getCurrentUser());
    setQuotes(StorageService.getQuotes());
    setClients(StorageService.getClients());
    setOrders(StorageService.getOrders());
  }, []);

  // Listen to any changes in storage
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handlers for Quote Workflow
  const handleStartNewQuote = (presetClient?: Client) => {
    if (presetClient) {
      setActiveQuoteForEdit({
        id: '',
        company_id: company.id,
        quote_number: StorageService.getNextQuoteNumber(),
        date: new Date().toISOString().slice(0, 10),
        validity_days: 30,
        status: 'brouillon',
        client_id: presetClient.id,
        client_name: presetClient.name,
        client_phone: presetClient.phone,
        client_whatsapp: presetClient.whatsapp || presetClient.phone.replace(/\D/g, ''),
        client_address: presetClient.address,
        client_email: presetClient.email,
        project_object: 'Devis de finition bâtiment',
        project_description: 'Travaux de finition et traitement des éléments en bois.',
        execution_location: presetClient.address,
        estimated_duration: '7 jours ouvrés',
        items: [
          {
            id: `itm_${Date.now()}_1`,
            item_type: 'fourniture',
            designation: 'Porte 5 panneaux',
            description: 'Porte en bois massif 5 panneaux avec finitions et moulures soignées',
            quantity: 1,
            unit: 'pièce',
            unit_price: 75000,
            total_price: 75000,
          },
          {
            id: `itm_${Date.now()}_2`,
            item_type: 'main_d_oeuvre',
            designation: 'Main d\'œuvre de pose & ajustage sur chantier',
            description: 'Installation, calage, fixations et ajustages sur le lieu des travaux',
            quantity: 1,
            unit: 'forfait',
            unit_price: 25000,
            total_price: 25000,
          },
        ],
        materials_subtotal: 75000,
        labor_subtotal: 25000,
        subtotal: 100000,
        discount_type: 'none',
        discount_value: 0,
        discount_amount: 0,
        total_amount: 100000,
        deposit_requested: 60000,
        balance_due: 40000,
        terms_and_conditions: company.default_terms,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      setActiveQuoteForEdit(null);
    }
    setIsEditingQuote(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setActiveQuoteForEdit(quote);
    setIsEditingQuote(true);
  };

  const handleSaveQuoteFromEditor = (savedQuote: Quote) => {
    setIsEditingQuote(false);
    setActiveQuoteForEdit(null);
    refreshAllData();
    // Offer preview immediately
    setActiveQuoteForPreview(savedQuote);
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const doc = await generateQuotePDF(quote, company);
      const filename = `Devis-${quote.quote_number}-${quote.client_name.replace(/\s+/g, '_')}.pdf`;
      downloadPDF(doc, filename);
      showToast('success', 'PDF téléchargé !', filename);
    } catch (err) {
      console.error(err);
      showToast('error', 'Erreur de génération PDF');
    }
  };

  const handleConvertToOrder = (quoteId: string) => {
    const order = StorageService.convertQuoteToOrder(quoteId);
    if (order) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast('success', 'Commande créée !', `Commande n° ${order.order_number} lancée en fabrication.`);
      refreshAllData();
      if (activeQuoteForPreview) {
        setActiveQuoteForPreview(null);
      }
      setCurrentTab('orders');
    } else {
      showToast('error', 'Erreur', 'Impossible de convertir ce devis en commande.');
    }
  };

  // If user is not authenticated, render LoginScreen
  if (!isLoggedIn) {
    return (
      <LoginScreen
        company={company}
        onLoginSuccess={(authedUser) => {
          setUser(authedUser);
          setIsLoggedIn(true);
          refreshAllData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar & Mobile Bottom Tab */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setIsEditingQuote(false);
          if (tab === 'settings') {
            if (!isSettingsUnlocked) {
              setIsSettingsPasswordOpen(true);
              return;
            }
          }
          setCurrentTab(tab);
        }}
        onNewQuote={() => handleStartNewQuote()}
        company={company}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          StorageService.logout();
          setIsLoggedIn(false);
          setIsSettingsUnlocked(false);
          showToast('info', 'Session fermée', 'Déconnexion effectuée.');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {isEditingQuote ? (
          <QuoteEditor
            initialQuote={activeQuoteForEdit}
            clients={clients}
            company={company}
            onSave={handleSaveQuoteFromEditor}
            onCancel={() => {
              setIsEditingQuote(false);
              setActiveQuoteForEdit(null);
            }}
            onPreview={(quote) => setActiveQuoteForPreview(quote)}
            onDownloadPDF={handleDownloadPDF}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                company={company}
                quotes={quotes}
                clients={clients}
                orders={orders}
                onNewQuote={() => handleStartNewQuote()}
                onNewClient={() => setIsNewClientOpen(true)}
                onViewQuote={(quote) => setActiveQuoteForPreview(quote)}
                onDownloadQuotePDF={handleDownloadPDF}
                onGoToQuotes={() => setCurrentTab('quotes')}
                onGoToClients={() => setCurrentTab('clients')}
                onGoToOrders={() => setCurrentTab('orders')}
              />
            )}

            {currentTab === 'quotes' && (
              <QuotesList
                quotes={quotes}
                company={company}
                onNewQuote={() => handleStartNewQuote()}
                onEditQuote={handleEditQuote}
                onViewQuote={(quote) => setActiveQuoteForPreview(quote)}
                onDownloadPDF={handleDownloadPDF}
                onQuotesUpdated={refreshAllData}
                onConvertToOrder={handleConvertToOrder}
              />
            )}

            {currentTab === 'orders' && (
              <OrdersList
                orders={orders}
                company={company}
                onOrdersUpdated={refreshAllData}
              />
            )}

            {currentTab === 'clients' && (
              <ClientsList
                clients={clients}
                quotes={quotes}
                orders={orders}
                onClientsUpdated={refreshAllData}
                onCreateQuoteForClient={(cli) => handleStartNewQuote(cli)}
                onViewQuote={(quote) => setActiveQuoteForPreview(quote)}
              />
            )}

            {currentTab === 'settings' && isSettingsUnlocked && (
              <SettingsView
                company={company}
                onCompanyUpdated={(updated) => {
                  setCompany(updated);
                  refreshAllData();
                }}
                onLockSettings={() => {
                  setIsSettingsUnlocked(false);
                  setCurrentTab('dashboard');
                  showToast('info', 'Paramètres verrouillés', 'Code d\'accès requis pour y réaccéder.');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Settings Passcode Protection Modal */}
      {isSettingsPasswordOpen && (
        <SettingsPasswordModal
          isOpen={isSettingsPasswordOpen}
          onClose={() => setIsSettingsPasswordOpen(false)}
          onSuccess={() => {
            setIsSettingsUnlocked(true);
            setIsSettingsPasswordOpen(false);
            setCurrentTab('settings');
          }}
        />
      )}

      {/* Quote Preview Modal */}
      {activeQuoteForPreview && (
        <QuotePreviewModal
          quote={activeQuoteForPreview}
          company={company}
          isOpen={Boolean(activeQuoteForPreview)}
          onClose={() => setActiveQuoteForPreview(null)}
          onEdit={(q) => {
            setActiveQuoteForPreview(null);
            handleEditQuote(q);
          }}
          onConvertToOrder={handleConvertToOrder}
        />
      )}

      {/* New Client Modal */}
      {isNewClientOpen && (
        <ClientModal
          isOpen={isNewClientOpen}
          onClose={() => setIsNewClientOpen(false)}
          onClientSaved={() => {
            refreshAllData();
            setIsNewClientOpen(false);
          }}
        />
      )}

      {/* Auth / Multi-tenant Modal */}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          currentUser={user}
          onUserChanged={(u) => {
            setUser(u);
            refreshAllData();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
