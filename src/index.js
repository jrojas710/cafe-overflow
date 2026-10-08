import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearAplicacion } from './app.js';

const raizProyecto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directorioDatos = process.env.DATOS_DIR ?? path.join(raizProyecto, 'datos');
const puerto = Number(process.env.PORT ?? 3000);

const servidor = crearAplicacion({ directorioDatos });

servidor.listen(puerto, () => {
  console.log('☕  Café Overflow — Dev & Coffee Lounge');
  console.log(`    Abre http://localhost:${puerto} en tu navegador`);
  console.log(`    Datos en: ${directorioDatos}`);
});
