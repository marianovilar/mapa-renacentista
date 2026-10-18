// Arma el sitio publicable en dist/: copia web/ y agrega build/datos.json.
// Uso: npm run construir  (lo usa también la publicación en GitHub Pages)
import { cpSync, copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const dist = join(raiz, 'dist');

rmSync(dist, { recursive: true, force: true });
cpSync(join(raiz, 'web'), dist, { recursive: true });
for (const f of ['datos.json', 'dialogos.csv', 'personas.csv', 'lugares.csv']) copyFileSync(join(raiz, 'build', f), join(dist, f));
// Marca de versión en el código y los estilos, para que el navegador no use una copia vieja tras publicar.
const version = Date.now().toString(36);
const indice = join(dist, 'index.html');
writeFileSync(indice, readFileSync(indice, 'utf8').replace('src="app.js"', `src="app.js?v=${version}"`).replace('href="estilos.css"', `href="estilos.css?v=${version}"`));
console.log('Sitio listo en dist/');
