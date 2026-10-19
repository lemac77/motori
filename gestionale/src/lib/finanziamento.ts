/**
 * Calcola la rata mensile di un finanziamento con ammortamento "alla francese"
 * (rata costante), lo standard per i finanziamenti auto.
 *
 * @param importo Capitale finanziato (€)
 * @param tanAnnuo Tasso Annuo Nominale, es. 7.9 per 7,9%
 * @param numeroRate Numero di rate mensili
 */
export function calcolaRataMensile(importo: number, tanAnnuo: number, numeroRate: number): number {
  if (!importo || !numeroRate || numeroRate <= 0) return 0

  // Tasso 0%: rata è semplicemente il capitale diviso le rate, nessun interesse da calcolare
  if (!tanAnnuo || tanAnnuo <= 0) return importo / numeroRate

  const tassoMensile = tanAnnuo / 100 / 12
  const rata = (importo * tassoMensile) / (1 - Math.pow(1 + tassoMensile, -numeroRate))
  return rata
}
