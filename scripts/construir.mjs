// Arma el sitio publicable en dist/: copia web/ y agrega build/datos.json.
// Uso: npm run construir  (lo usa también la publicación en GitHub Pages)
import { cpSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const dist = join(raiz, 'dist');

rmSync(dist, { recursive: true, force: true });
cpSync(join(raiz, 'web'), dist, { recursive: true });
copyFileSync(join(raiz, 'build', 'datos.json'), join(dist, 'datos.json'));
console.log('Sitio listo en dist/');
