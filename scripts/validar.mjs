// Valida los datos de data/ contra docs/esquema.md y genera build/datos.json.
// Uso: npm run validar
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { validarDatos } from '../web/validacion.js';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const leer = (ruta) => parse(readFileSync(join(raiz, ruta), 'utf8'));

const personas = leer('data/personas.yaml');
const lugares = leer('data/lugares.yaml');
const regiones = leer('data/regiones.yaml');
const dialogos = readdirSync(join(raiz, 'data/dialogos'))
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ archivo: f, ...leer(`data/dialogos/${f}`) }));

const { errores, avisos, idPersonas, idLugares } = validarDatos({ personas, lugares, regiones, dialogos });

// Cruces: personas que aparecen en más de un diálogo, con su rol en cada uno.
const cruces = new Map();
for (const d of dialogos) {
  const anotar = (id, rol) => {
    if (!cruces.has(id)) cruces.set(id, []);
    cruces.get(id).push(`${d.titulo} (${rol})`);
  };
  for (const a of d.autores ?? []) anotar(a, 'autor');
  for (const x of d.destinatarios ?? []) anotar(x.persona, 'destinatario');
  for (const x of d.interlocutores ?? []) anotar(x.persona, 'interlocutor');
  for (const x of d.evocados ?? []) anotar(x.persona, 'evocado');
  for (const r of d.redacciones ?? []) for (const p of r.interlocutores ?? []) {
    if (!(d.interlocutores ?? []).some((x) => x.persona === p)) anotar(p, `interlocutor en ${r.titulo}`);
  }
}

console.log(`${dialogos.length} diálogos, ${personas.length} personas, ${lugares.length} lugares\n`);
const multiples = [...cruces].filter(([, v]) => new Set(v.map((s) => s.split(' (')[0])).size > 1);
if (multiples.length) {
  console.log('Cruces (personas en más de un diálogo):');
  for (const [id, v] of multiples) console.log(`  ${idPersonas.get(id)?.nombre}: ${v.join('; ')}`);
  console.log();
}
if (avisos.length) { console.log(`Avisos (${avisos.length}):`); avisos.forEach((a) => console.log(`  · ${a}`)); console.log(); }
if (errores.length) {
  console.log(`ERRORES (${errores.length}):`); errores.forEach((e) => console.log(`  ✗ ${e}`));
  process.exit(1);
}

mkdirSync(join(raiz, 'build'), { recursive: true });
const salida = { dialogos: dialogos.map(({ archivo, ...d }) => d), personas, lugares, regiones };
writeFileSync(join(raiz, 'build/datos.json'), JSON.stringify(salida, null, 2));

// Tablas para descargar desde la página «Sobre los datos». Con BOM, para que Excel lea bien los acentos.
const csv = (filas) => '﻿' + filas
  .map((f) => f.map((v) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','))
  .join('\r\n') + '\r\n';
const nom = (id) => idPersonas.get(id)?.nombre ?? id;
const lug = (id) => idLugares.get(id)?.nombre ?? id ?? '';
const lista = (xs) => xs.filter(Boolean).join('; ');
writeFileSync(join(raiz, 'build/dialogos.csv'), csv([
  ['id', 'titulo', 'autores', 'lengua', 'forma', 'modo', 'libros', 'composicion_desde', 'composicion_hasta', 'composicion_certeza', 'composicion_lugares',
    'destinatarios', 'interlocutores', 'evocados', 'ambientacion_lugar', 'ambientacion_desde', 'ambientacion_hasta', 'ambientacion_espacio',
    'primera_edicion_anio', 'primera_edicion_lugar', 'primera_edicion_impresor', 'temas', 'caso_dudoso', 'revision', 'fuentes', 'ediciones_modernas', 'traducciones', 'bibliografia', 'texto_en_linea'],
  ...dialogos.map((d) => [
    d.id, d.titulo, lista((d.autores ?? []).map(nom)), d.lengua, d.forma, d.modo, d.libros,
    d.composicion?.fecha?.desde, d.composicion?.fecha?.hasta, d.composicion?.fecha?.certeza,
    lista((d.composicion?.lugares ?? []).map((x) => lug(x.lugar))),
    lista((d.destinatarios ?? []).map((x) => nom(x.persona))),
    lista((d.interlocutores ?? []).map((x) => nom(x.persona))),
    lista((d.evocados ?? []).map((x) => nom(x.persona))),
    lug(d.ambientacion?.lugar), d.ambientacion?.fecha?.desde, d.ambientacion?.fecha?.hasta, d.ambientacion?.espacio,
    d.primera_edicion?.fecha?.desde, lug(d.primera_edicion?.lugar), d.primera_edicion?.impresor,
    lista(d.temas ?? []), d.caso_dudoso ? 'sí' : '', d.revision, (d.fuentes ?? []).join(' | '),
    (d.ediciones ?? []).filter((e) => e.tipo !== 'traducción').map((e) => e.referencia).join(' | '),
    lista([...new Set((d.ediciones ?? []).filter((e) => e.tipo !== 'edición').map((e) => e.lengua))]),
    (d.bibliografia ?? []).map((b) => b.referencia).join(' | '),
    d.texto_en_linea?.url,
  ]),
]));
writeFileSync(join(raiz, 'build/personas.csv'), csv([
  ['id', 'nombre', 'nombre_latino', 'nacimiento', 'muerte', 'tipo', 'sexo', 'nota'],
  ...personas.map((p) => [p.id, p.nombre, p.nombre_latino, p.nacimiento, p.muerte, p.tipo, p.sexo, p.nota]),
]));
writeFileSync(join(raiz, 'build/lugares.csv'), csv([
  ['id', 'nombre', 'nombre_latino', 'lat', 'lon', 'nota'],
  ...lugares.map((l) => [l.id, l.nombre, l.nombre_latino, l.lat, l.lon, l.nota]),
]));
console.log('Sin errores. Generado build/datos.json y las tablas CSV');
