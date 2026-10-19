// Lista marche comuni sul mercato italiano dell'usato.
// Modello e versione restano campo libero con autocomplete sullo storico,
// perché le combinazioni modello/allestimento sono troppo numerose
// e cambiano troppo spesso per una lista statica mantenibile.
const MARCHE_NOTE = [
  'Abarth', 'Alfa Romeo', 'Audi', 'BMW', 'Citroen', 'Cupra', 'Dacia', 'DS',
  'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jaguar', 'Jeep', 'Kia', 'Land Rover',
  'Lancia', 'Lexus', 'Maserati', 'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi',
  'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 'Seat', 'Skoda', 'Smart',
  'Ssangyong', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
].sort((a, b) => a.localeCompare(b, 'it'))

// "MARCA NON PRESENTE" resta sempre la prima voce, prima delle marche in ordine
// alfabetico, così è subito visibile per chi deve inserire una marca a mano.
export const MARCA_NON_IN_LISTA = 'MARCA NON PRESENTE'

export const MARCHE = [MARCA_NON_IN_LISTA, ...MARCHE_NOTE]
