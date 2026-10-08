/** Helpers para construir respuestas de los controladores. */
export const ok = (cuerpo) => ({ estadoHttp: 200, cuerpo });
export const creado = (cuerpo) => ({ estadoHttp: 201, cuerpo });
