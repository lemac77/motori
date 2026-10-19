import { supabase } from './supabaseClient'
import { Car } from '../types'

// Converte i campi italiani del pannello (marca, modello, alimentazione, cambio...)
// nel formato Car usato dal sito, che era stato pensato per dati statici finti.
export async function fetchCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from('annunci')
    .select(
      'id, marca, modello, versione, prezzo, km, immatricolazione_anno, alimentazione, cambio, cv, descrizione, condizione, colore, carrozzeria, porte, posti, classe_emissioni, accessori, annuncio_foto(url_originale, ordine)'
    )
    .eq('stato_pubblicazione', 'pubblicato')
    .order('created_at', { ascending: false })
    .order('ordine', { foreignTable: 'annuncio_foto', ascending: true })

  if (error) {
    console.error('Errore nel caricamento annunci da Supabase:', error)
    return []
  }

  return (data ?? []).map((a: any) => {
    const images = (a.annuncio_foto ?? [])
      .sort((x: any, y: any) => x.ordine - y.ordine)
      .map((f: any) => f.url_originale)

    return {
      id: a.id,
      brand: a.marca,
      model: a.versione || a.modello,
      modello: a.modello,
      year: a.immatricolazione_anno ?? new Date().getFullYear(),
      km: a.km,
      fuelType: a.alimentazione,
      gearbox: a.cambio,
      price: Number(a.prezzo),
      image: images[0] ?? '',
      images,
      power: a.cv ? `${a.cv} CV` : undefined,
      descrizione: a.descrizione ?? undefined,
      condizione: a.condizione ?? undefined,
      colore: a.colore ?? undefined,
      carrozzeria: a.carrozzeria ?? undefined,
      porte: a.porte ?? undefined,
      posti: a.posti ?? undefined,
      classeEmissioni: a.classe_emissioni ?? undefined,
      accessori: Array.isArray(a.accessori) ? a.accessori : undefined,
    } satisfies Car
  })
}