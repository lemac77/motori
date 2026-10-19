/**
 * Tipi del sito vetrina autosalone.
 */

export interface Car {
  id: string;
  brand: string;
  model: string;
  modello?: string;
  year: number;
  km: number;
  fuelType: 'Benzina' | 'Diesel' | 'Ibrida' | 'Elettrica' | 'GPL';
  gearbox: 'Manuale' | 'Automatico';
  price: number;
  image: string;
  images?: string[];
  badge?: string;
  power?: string; // e.g. "136 CV"
  featured?: boolean;
  descrizione?: string;
  condizione?: string;
  colore?: string;
  carrozzeria?: string;
  porte?: string;
  posti?: number;
  classeEmissioni?: string;
  accessori?: string[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  initials: string;
  verified: boolean;
}

export interface ServiceItem {
  id: string;
  iconName: string;
  title: string;
  description: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  phone: string;
  carInterest?: string;
  message: string;
  date: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Acquisto' | 'Garanzia' | 'Finanziamenti' | 'Noleggio' | 'Permuta';
}