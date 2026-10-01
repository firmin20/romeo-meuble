export const BRAND_LOGO_SRC = '/assets/logo.png';
export const BRAND_LOGO_FALLBACK = '/assets/logo.png';

export const BRAND_STAMP_SRC = '/assets/cachet.png';
export const BRAND_STAMP_FALLBACK = '/assets/cachet.png';

export const BRAND_SIGNATURE_SRC = '/assets/signature.png';
export const BRAND_SIGNATURE_FALLBACK = '/assets/signature.png';

export interface PresetCatalogItem {
  designation: string;
  defaultDescription: string;
  defaultPrice: number;
  unit: string;
  category: 'finition' | 'salon' | 'chambre' | 'salle_manger' | 'refection' | 'service';
}

export const PRESET_CATALOG: PresetCatalogItem[] = [
  {
    designation: 'Porte 5 panneaux',
    defaultDescription: 'Porte en bois massif 5 panneaux avec finitions et moulures soignées',
    defaultPrice: 75000,
    unit: 'pièce',
    category: 'finition',
  },
  {
    designation: 'Couvre joint lambris',
    defaultDescription: 'Baguettes couvre-joints profilées pour habillage lambris et encadrements',
    defaultPrice: 35000,
    unit: 'pièce',
    category: 'finition',
  },
  {
    designation: 'Vernis bois',
    defaultDescription: 'Vernis polyuréthane de protection satiné pour menuiserie',
    defaultPrice: 4250,
    unit: 'L',
    category: 'finition',
  },
  {
    designation: 'Diluant',
    defaultDescription: 'Diluant cellulosique haute performance pour application vernis',
    defaultPrice: 1000,
    unit: 'L',
    category: 'finition',
  },
  {
    designation: 'Fin papier ponce',
    defaultDescription: 'Lot de feuilles d\'abrasifs grains fins pour préparation de surface',
    defaultPrice: 5000,
    unit: 'forfait',
    category: 'finition',
  },
  {
    designation: 'Main d\'œuvre',
    defaultDescription: 'Préparation, ajustages, ponçage méticuleux et finitions artisanales',
    defaultPrice: 40000,
    unit: 'forfait',
    category: 'service',
  },
  {
    designation: 'Canapé 3 places grand confort',
    defaultDescription: 'Structure bois dur traité, mousse haute résilience 35kg/m³, tissu velours ou microfibre antitache au choix',
    defaultPrice: 280000,
    unit: 'pièce',
    category: 'salon',
  },
  {
    designation: 'Canapé 5 places d\'angle',
    defaultDescription: 'Canapé d\'angle réversible, coussins déhoussables, piètement en bois massif vernis satiné',
    defaultPrice: 420000,
    unit: 'ensemble',
    category: 'salon',
  },
  {
    designation: 'Salon complet 7 places (3+2+1+1)',
    defaultDescription: 'Salon majestueux 7 assises, garnissage tapissier double piquage, finitions capitonnées de prestige',
    defaultPrice: 650000,
    unit: 'ensemble',
    category: 'salon',
  },
  {
    designation: 'Fauteuil tapissé individuel',
    defaultDescription: 'Fauteuil de salon ergonomique, mousse dense, structure robuste en bois noble',
    defaultPrice: 95000,
    unit: 'pièce',
    category: 'salon',
  },
  {
    designation: 'Table à manger 8 places en bois massif',
    defaultDescription: 'Plateau épais en Iroko ou Bubinga massif, 8 chaises assorties avec assises tapissées',
    defaultPrice: 580000,
    unit: 'ensemble',
    category: 'salle_manger',
  },
  {
    designation: 'Chaise de table tapissée',
    defaultDescription: 'Dossier droit ergonomique, assise rembourrée velours résistant, bois dur verni',
    defaultPrice: 40000,
    unit: 'pièce',
    category: 'salle_manger',
  },
  {
    designation: 'Lit King Size 180x200 avec coffre',
    defaultDescription: 'Cadre bois massif avec sommier à lattes renforcées, tête de lit capitonnée velours beige',
    defaultPrice: 350000,
    unit: 'pièce',
    category: 'chambre',
  },
  {
    designation: 'Tête de lit capitonnée sur mesure',
    defaultDescription: 'Hauteur 130cm, molletonnage épais et boutons capitons artisanaux',
    defaultPrice: 120000,
    unit: 'pièce',
    category: 'chambre',
  },
  {
    designation: 'Armoire dressing 3 battants',
    defaultDescription: 'Penderie centrale avec miroir biseauté, étagères modulables et 3 tiroirs inférieurs',
    defaultPrice: 380000,
    unit: 'pièce',
    category: 'chambre',
  },
  {
    designation: 'Meuble TV contemporain suspendu',
    defaultDescription: 'Panneau mural tasseaux décoratifs, passe-câbles intégré, niche console et rangements push-to-open',
    defaultPrice: 220000,
    unit: 'pièce',
    category: 'salon',
  },
  {
    designation: 'Réfection complète canapé (mousse + tissu)',
    defaultDescription: 'Remplacement intégral de la mousse, resserrage sangles & ressorts, nouveau revêtement au choix',
    defaultPrice: 200000,
    unit: 'ensemble',
    category: 'refection',
  },
  {
    designation: 'Réfection fauteuil tapissier',
    defaultDescription: 'Dégarnissage, renfort de structure, garniture neuve et tissu d\'ameublement sélectionné',
    defaultPrice: 50000,
    unit: 'pièce',
    category: 'refection',
  },
  {
    designation: 'Fabrication spéciale sur mesure',
    defaultDescription: 'Réalisation d\'après plan ou photo validée avec le client',
    defaultPrice: 150000,
    unit: 'pièce',
    category: 'service',
  },
  {
    designation: 'Livraison & installation soignée',
    defaultDescription: 'Transport protégé par bâches, manutention et montage à domicile par notre équipe',
    defaultPrice: 25000,
    unit: 'forfait',
    category: 'service',
  },
];
