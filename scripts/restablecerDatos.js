/**
 * Borra los datos de ejecución (carpeta datos/). En el siguiente arranque
 * la capa de persistencia los vuelve a crear a partir de las semillas.
 */
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directorioDatos = process.env.DATOS_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'datos');
await rm(directorioDatos, { recursive: true, force: true });
console.log(`Datos restablecidos. Se recrearán desde las semillas al iniciar: ${directorioDatos}`);
