/** Niveles del programa de lealtad, de menor a mayor. */
export const Niveles = Object.freeze({
  JUNIOR: 'JUNIOR',
  MID: 'MID',
  SENIOR: 'SENIOR',
});

export const ORDEN_NIVELES = Object.freeze([Niveles.JUNIOR, Niveles.MID, Niveles.SENIOR]);

export function rangoDeNivel(nivel) {
  return ORDEN_NIVELES.indexOf(nivel);
}

export function esNivelValido(nivel) {
  return rangoDeNivel(nivel) !== -1;
}
