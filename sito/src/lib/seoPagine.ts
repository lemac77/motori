import { cliente } from '@cliente/cliente.config'
import type { Car } from '../types'

const { azienda, showroom, offerta, sito } = cliente
const nome = `${azienda.nome} ${showroom.citta}`
const garanzia = `Garanzia ${offerta.garanziaMesi} mesi`
const rate = `finanziamenti da ${offerta.rateMin} a ${offerta.rateMax} rate`

/** Title + description di ogni pagina, costruiti dal config (niente nomi scritti a mano) */
export function metaPagina(path: string, auto?: Car): { title: string; description: string } | null {
  if (path.startsWith('/parco-auto/')) {
    if (!auto) return null
    return {
      title: `${auto.brand} ${auto.model} | ${nome}`,
      description: `${auto.brand} ${auto.model}, ${auto.year} - ${auto.km?.toLocaleString('it-IT')} km, ${auto.fuelType || ''}. In vendita a ${showroom.citta} da ${azienda.nome} con ${garanzia}. Scopri prezzo e finanziamento.`,
    }
  }
  switch (path) {
    case '/parco-auto':
      return {
        title: `Parco Auto Usate e Nuove | ${nome}`,
        description: `Sfoglia tutte le auto disponibili da ${azienda.nome} a ${showroom.citta}: usato certificato, km0 e nuove, multimarca, con ${garanzia} e ${rate}.`,
      }
    case '/azienda':
      return {
        title: `Chi Siamo | ${nome}`,
        description: `${azienda.nome}: concessionaria multimarca a ${showroom.citta}. Trasparenza, veicoli selezionati e controllo qualità su ogni auto usata.`,
      }
    case '/faq':
      return {
        title: `Domande Frequenti | ${nome}`,
        description: `Documenti per l'acquisto, garanzia, ${rate}, permuta e test drive: le risposte alle domande più comuni su ${azienda.nome}.`,
      }
    case '/garanzia':
      return {
        title: `Garanzia di Conformità ${offerta.garanziaMesi} Mesi | ${nome}`,
        description: `Ogni auto usata ${azienda.nome} include la Garanzia di Conformità di ${offerta.garanziaMesi} mesi${offerta.garanziaEstendibileMesi.length ? `, estendibile fino a ${Math.max(...offerta.garanziaEstendibileMesi)}` : ''}. Scopri cosa copre e come funziona.`,
      }
    case '/contatti':
      return {
        title: `Contatti e Sede | ${nome}`,
        description: `Vieni a trovarci a ${showroom.citta}. Orari, mappa e modulo contatti per prenotare un test drive o chiedere informazioni.`,
      }
    case '/privacy':
      return { title: `Privacy e Cookie | ${nome}`, description: `Informativa privacy e cookie di ${azienda.ragioneSociale}.` }
    case '/termini':
      return { title: `Termini di Utilizzo | ${nome}`, description: `Condizioni di utilizzo del sito di ${azienda.ragioneSociale}.` }
    default:
      return { title: sito.titoloHome, description: sito.descrizioneHome }
  }
}
