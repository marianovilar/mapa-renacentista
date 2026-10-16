// Valida los datos de data/ contra docs/esquema.md y genera build/datos.json.
// Uso: npm run validar
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const leer = (ruta) => parse(readFileSync(join(raiz, ruta), 'utf8'));

const personas = leer('data/personas.yaml');
const lugares = leer('data/lugares.yaml');
const regiones = leer('data/regiones.yaml');
const dialogos = readdirSync(join(raiz, 'data/dialogos'))
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ archivo: f, ...leer(`data/dialogos/${f}`) }));

const errores = [];
const avisos = [];

const TIPOS_PERSONA = ['histórica', 'ficticia', 'alegórica', 'mitológica', 'divina'];
const CERTEZAS = ['segura', 'probable', 'conjetural'];
const FORMAS = ['diálogo', 'coloquio', 'convivium', 'mixta'];
const SEXOS = ['masculino', 'femenino'];
const MODOS = ['mimético', 'diegético', 'mixto'];
const RELACIONES_VOCES = ['jerárquica', 'entre pares', 'mixta'];
const ESPACIOS = ['corte', 'curia', 'academia', 'casa privada', 'villa', 'jardín', 'monasterio', 'taller', 'espacio urbano', 'paraje natural', 'visión', 'más allá', 'indeterminado'];
const FORMAS_DEDICATORIA = ['dedicatoria', 'carta-prefatoria', 'apóstrofe'];
const REVISIONES = ['pendiente', 'revisado'];
const RELACIONES = { 'reelaboracion-de': 'reelaborada-en', 'reelaborada-en': 'reelaboracion-de', 'parte-de': 'contiene', contiene: 'parte-de', serie: 'serie' };

function indice(lista, nombre) {
  const mapa = new Map();
  for (const item of lista) {
    if (!item.id) errores.push(`${nombre}: entrada sin id (${JSON.stringify(item)})`);
    else if (mapa.has(item.id)) errores.push(`${nombre}: id duplicado "${item.id}"`);
    else mapa.set(item.id, item);
  }
  return mapa;
}

const idPersonas = indice(personas, 'personas');
const idLugares = indice(lugares, 'lugares');
const idDialogos = indice(dialogos, 'diálogos');

for (const p of personas) {
  if (!p.nombre) errores.push(`persona ${p.id}: falta nombre`);
  if (!TIPOS_PERSONA.includes(p.tipo)) errores.push(`persona ${p.id}: tipo inválido "${p.tipo}"`);
  if (p.sexo != null && !SEXOS.includes(p.sexo)) errores.push(`persona ${p.id}: sexo inválido "${p.sexo}"`);
  if (p.nacimiento && p.muerte && p.nacimiento > p.muerte) errores.push(`persona ${p.id}: nacimiento posterior a muerte`);
}

for (const l of lugares) {
  if (typeof l.lat !== 'number' || typeof l.lon !== 'number') errores.push(`lugar ${l.id}: faltan coordenadas`);
}
indice(regiones, 'regiones');
for (const r of regiones) {
  if (!r.nombre || typeof r.lat !== 'number' || typeof r.lon !== 'number') errores.push(`región ${r.id}: faltan nombre o coordenadas`);
}

function fecha(ctx, f) {
  if (f == null) return;
  if (typeof f.desde !== 'number' || typeof f.hasta !== 'number') errores.push(`${ctx}: fecha sin desde/hasta numéricos`);
  else if (f.desde > f.hasta) errores.push(`${ctx}: desde (${f.desde}) > hasta (${f.hasta})`);
  if (f.certeza && !CERTEZAS.includes(f.certeza)) errores.push(`${ctx}: certeza inválida "${f.certeza}"`);
}
const persona = (ctx, id) => { if (!idPersonas.has(id)) errores.push(`${ctx}: persona inexistente "${id}"`); };
const lugar = (ctx, id) => { if (id != null && !idLugares.has(id)) errores.push(`${ctx}: lugar inexistente "${id}"`); };

const usadas = new Set();
for (const d of dialogos) {
  const c = `${d.archivo}`;
  if (`${d.id}.yaml` !== d.archivo) avisos.push(`${c}: el nombre de archivo no coincide con el id "${d.id}"`);
  for (const campo of ['id', 'titulo', 'lengua', 'autores', 'interlocutores', 'composicion', 'revision']) {
    if (d[campo] == null) errores.push(`${c}: falta el campo obligatorio "${campo}"`);
  }
  if (d.forma && !FORMAS.includes(d.forma)) errores.push(`${c}: forma inválida "${d.forma}"`);
  if (d.modo != null && !MODOS.includes(d.modo)) errores.push(`${c}: modo inválido "${d.modo}"`);
  if (d.relacion_interlocutores != null && !RELACIONES_VOCES.includes(d.relacion_interlocutores)) errores.push(`${c}: relacion_interlocutores inválida "${d.relacion_interlocutores}"`);
  if (d.ambientacion?.espacio != null && !ESPACIOS.includes(d.ambientacion.espacio)) errores.push(`${c}: espacio inválido "${d.ambientacion.espacio}"`);
  if (!REVISIONES.includes(d.revision)) errores.push(`${c}: revision inválida "${d.revision}"`);
  if (d.caso_dudoso && !d.motivo_duda) errores.push(`${c}: caso_dudoso sin motivo_duda`);

  if (Array.isArray(d.interlocutores) && d.interlocutores.length === 0) avisos.push(`${c}: interlocutores por completar`);

  for (const a of d.autores ?? []) { persona(`${c} autores`, a); usadas.add(a); }
  for (const x of d.destinatarios ?? []) {
    persona(`${c} destinatarios`, x.persona); usadas.add(x.persona);
    if (x.forma && !FORMAS_DEDICATORIA.includes(x.forma)) errores.push(`${c}: forma de dedicatoria inválida "${x.forma}"`);
  }
  for (const x of d.interlocutores ?? []) { persona(`${c} interlocutores`, x.persona); usadas.add(x.persona); }
  for (const x of d.evocados ?? []) {
    persona(`${c} evocados`, x.persona); usadas.add(x.persona);
    if ((d.interlocutores ?? []).some((i) => i.persona === x.persona)) avisos.push(`${c}: ${x.persona} figura a la vez como interlocutor y evocado`);
  }

  fecha(`${c} composicion`, d.composicion?.fecha);
  for (const x of d.composicion?.lugares ?? []) lugar(`${c} composicion`, x.lugar);
  fecha(`${c} ambientacion`, d.ambientacion?.fecha);
  lugar(`${c} ambientacion`, d.ambientacion?.lugar);
  fecha(`${c} primera_edicion`, d.primera_edicion?.fecha);
  lugar(`${c} primera_edicion`, d.primera_edicion?.lugar);

  for (const r of d.relaciones ?? []) {
    const otro = idDialogos.get(r.dialogo);
    if (!otro) { errores.push(`${c} relaciones: diálogo inexistente "${r.dialogo}"`); continue; }
    if (!(r.tipo in RELACIONES)) { errores.push(`${c} relaciones: tipo inválido "${r.tipo}"`); continue; }
    const inversa = (otro.relaciones ?? []).some((x) => x.dialogo === d.id && x.tipo === RELACIONES[r.tipo]);
    if (!inversa) avisos.push(`${c}: falta la relación inversa "${RELACIONES[r.tipo]}" en ${otro.archivo}`);
  }

  for (const [i, r] of (d.redacciones ?? []).entries()) {
    const cr = `${c} redacciones[${i}]`;
    fecha(cr, r.fecha);
    for (const l of r.lugares ?? []) lugar(cr, l);
    for (const p of r.interlocutores ?? []) { persona(cr, p); usadas.add(p); }
    lugar(cr, r.ambientacion);
  }
}

for (const p of personas) if (!usadas.has(p.id)) avisos.push(`persona ${p.id}: no aparece en ningún diálogo`);
for (const p of personas) if (p.tipo === 'histórica' && !p.wikidata) avisos.push(`persona ${p.id}: falta wikidata`);
for (const l of lugares) if (!l.wikidata) avisos.push(`lugar ${l.id}: falta wikidata`);

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
console.log('Sin errores. Generado build/datos.json');
