// Servidor local para ver el sitio: sirve web/ y entrega build/datos.json como /datos.json.
// Uso: npm run dev  (valida los datos y abre http://localhost:4321)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const PUERTO = Number(process.env.PORT) || 4321;
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

createServer(async (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const archivo = ruta === '/datos.json'
    ? join(raiz, 'build', 'datos.json')
    : join(raiz, 'web', normalize(ruta === '/' ? '/index.html' : ruta).replace(/^(\.\.[/\\])+/, ''));
  try {
    const cuerpo = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': `${TIPOS[extname(archivo)] ?? 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(cuerpo);
  } catch {
    res.writeHead(404).end('No encontrado');
  }
}).listen(PUERTO, () => console.log(`Sitio en http://localhost:${PUERTO}`));
