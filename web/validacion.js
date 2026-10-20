// Reglas de validación de los datos, compartidas por el validador (npm run validar)
// y por el editor en línea (editor.html). Sin dependencias: recibe los datos ya leídos.
// Cada diálogo trae `archivo` (nombre del YAML) para que los mensajes digan dónde está el problema.

export const TIPOS_PERSONA = ['histórica', 'ficticia', 'alegórica', 'mitológica', 'divina'];
export const CERTEZAS = ['segura', 'probable', 'conjetural'];
export const FORMAS = ['diálogo', 'coloquio', 'convivium', 'mixta'];
export const SEXOS = ['masculino', 'femenino'];
export const MODOS = ['mimético', 'diegético', 'mixto'];
export const RELACIONES_VOCES = ['jerárquica', 'entre pares', 'mixta'];
export const ESPACIOS = ['corte', 'curia', 'academia', 'casa privada', 'villa', 'jardín', 'monasterio', 'taller', 'espacio urbano', 'paraje natural', 'visión', 'más allá', 'indeterminado'];
export const FORMAS_DEDICATORIA = ['dedicatoria', 'carta-prefatoria', 'apóstrofe'];
export const REVISIONES = ['pendiente', 'revisado'];
export const TIPOS_EDICION = ['edición', 'edición y traducción', 'traducción'];
export const LENGUAS = ['latín', 'italiano', 'alemán', 'inglés', 'francés', 'español', 'portugués', 'catalán', 'neerlandés', 'ruso', 'polaco', 'húngaro'];
export const RELACIONES = { 'reelaboracion-de': 'reelaborada-en', 'reelaborada-en': 'reelaboracion-de', 'parte-de': 'contiene', contiene: 'parte-de', serie: 'serie' };

export function validarDatos({ personas, lugares, regiones, dialogos }) {
  const errores = [];
  const avisos = [];
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
    for (const e of d.ediciones ?? []) {
      if (!TIPOS_EDICION.includes(e.tipo)) errores.push(`${c}: tipo de edición inválido "${e.tipo}"`);
      if (!LENGUAS.includes(e.lengua)) errores.push(`${c}: lengua de edición inválida "${e.lengua}"`);
      if (!e.referencia) errores.push(`${c}: edición sin referencia`);
    }
    if (d.texto_en_linea != null && !/^https?:\/\/\S+$/.test(d.texto_en_linea.url ?? '')) errores.push(`${c}: texto_en_linea sin una url válida`);
    if (d.texto_en_linea != null && !d.texto_en_linea.descripcion) errores.push(`${c}: texto_en_linea sin descripcion`);
    for (const b of d.bibliografia ?? []) if (!b.referencia) errores.push(`${c}: entrada de bibliografía sin referencia`);

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

  return { errores, avisos, idPersonas, idLugares, idDialogos, usadas };
}
