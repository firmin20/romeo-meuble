import React, { useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { Client } from '../types';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';

interface ClientModalProps {
  client?: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onClientSaved: (savedClient: Client) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onClientSaved,
}) => {
  const { showToast } = useToast();

  const [name, setName] = useState(client?.name || '');
  const [phone, setPhone] = useState(client?.phone || '+237 ');
  const [whatsapp, setWhatsapp] = useState(client?.whatsapp || '');
  const [address, setAddress] = useState(client?.address || 'Yaoundé');
  const [email, setEmail] = useState(client?.email || '');
  const [notes, setNotes] = useState(client?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Nom obligatoire', 'Veuillez saisir le nom complet du client.');
      return;
    }
    if (!phone.trim() || phone.trim() === '+237') {
      showToast('error', 'Téléphone obligatoire', 'Veuillez renseigner un numéro de téléphone.');
      return;
    }

    const saved = StorageService.saveClient({
      id: client?.id,
      name,
      phone,
      whatsapp: whatsapp || phone.replace(/\D/g, ''),
      address: address || 'Yaoundé',
      email,
      notes,
    });

    showToast('success', client ? 'Client modifié !' : 'Client créé avec succès !', saved.name);
    onClientSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">
              {client ? 'Modifier le client' : 'Nouveau client'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom complet du client <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: M. Tagne Patrice, Dr. Atangana..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone principal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: +237 688 757 194"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (!whatsapp) {
                    setWhatsapp(e.target.value.replace(/\D/g, ''));
                  }
                }}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numéro WhatsApp
              </label>
              <input
                type="text"
                placeholder="Ex: 237688757194"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse / Quartier à Yaoundé
              </label>
              <input
                type="text"
                placeholder="Ex: Nkoabang, Bastos, Odza..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email (facultatif)
              </label>
              <input
                type="email"
                placeholder="Ex: client@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes & Préférences (tissus, essences de bois...)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Aime le bois d'Iroko, préfère les mousses fermes 35kg/m³..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{client ? 'Enregistrer les modifications' : 'Créer le client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
