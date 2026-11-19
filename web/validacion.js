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
// Vocabulario controlado de temas: grupo → { tema: definición } (docs/vocabulario-temas.md).
// Lo que no entra acá va en `detalles`.
export const GRUPOS_TEMAS = {
  "Ética y felicidad": {
    "felicidad y sumo bien": "En qué consiste la vida feliz y cuál es el bien supremo.",
    "placer y epicureísmo": "La voluptas, Epicuro y Lucrecio, y su recepción cristiana.",
    "estoicismo y virtud": "La honestas, la virtud estoica y la crítica de las pasiones.",
    "fortuna": "Los vaivenes de la fortuna y cómo enfrentarlos.",
    "virtudes y vicios": "Examen moral de vicios concretos: avaricia, ingratitud, vanidad, envidia.",
    "riqueza y pobreza": "El dinero, la propiedad y su valor moral y civil.",
    "nobleza": "Si la nobleza procede de la virtud o del linaje y la riqueza.",
    "vida activa y contemplativa": "La vida pública o de negocios frente al retiro, el estudio y la contemplación."
  },
  "Amor, muerte y condición humana": {
    "amor": "El amor humano y divino, de Laura al amor platónico.",
    "matrimonio y mujeres": "El matrimonio, la familia y el lugar de las mujeres.",
    "muerte, duelo y consolación": "La pérdida, el duelo y la escritura consolatoria.",
    "miseria y dignidad del hombre": "La condición humana entre la desdicha y la excelencia.",
    "alma e inmortalidad": "La naturaleza del alma y su destino."
  },
  "Religión": {
    "fe y filosofía": "Relación entre teología cristiana y saber filosófico o pagano.",
    "libre albedrío": "Voluntad humana, presciencia divina, gracia y astrología.",
    "vida religiosa y conversión": "Los votos, la vida monástica y laica, la conversión y el examen de conciencia.",
    "crítica del clero": "Sátira o censura de clérigos, frailes y órdenes religiosas.",
    "papado y curia": "El papado, la corte papal y su burocracia.",
    "concordia religiosa": "Diálogo y unidad entre credos y confesiones."
  },
  "Política y sociedad": {
    "república y libertad": "La libertad civil, la república y el buen ciudadano.",
    "príncipes y tiranía": "El poder personal, el consejo al príncipe y la tiranía.",
    "Florencia y los Médici": "La ciudad, su elogio y la hegemonía medicea.",
    "guerra y paz": "La guerra, las conjuras y la paz entre estados y cristianos.",
    "derecho y leyes": "La naturaleza de la ley, el derecho natural y la jurisprudencia."
  },
  "Letras y saberes": {
    "antiguos y modernos": "La comparación entre la Antigüedad y los contemporáneos.",
    "lengua latina y estilo": "El latín, la imitación, el ciceronianismo y el estilo.",
    "poesía y poética": "La poesía, los poetas y su interpretación.",
    "retórica y dialéctica": "La elocuencia, la disputa y la crítica de la lógica escolástica.",
    "historia e historiografía": "La escritura de la historia y la memoria de los hombres ilustres.",
    "educación y studia humanitatis": "La enseñanza, la defensa de las letras y el saber del laico.",
    "fortuna de los letrados": "La condición, el mecenazgo y las desgracias de los humanistas.",
    "conocimiento y docta ignorancia": "Los límites y los modos del conocer.",
    "filosofía natural y medicina": "La naturaleza, la medida, la experiencia y la medicina.",
    "Platón y platonismo": "La recepción de Platón y del neoplatonismo.",
    "Aristóteles y aristotelismo": "La autoridad de Aristóteles, los peripatéticos y su lectura escolástica o humanista."
  },
  "Formas y ámbitos": {
    "sátira lucianesca": "La risa, la parodia y los modelos de Luciano.",
    "banquete": "La conversación de sobremesa o el convite como escena.",
    "academia": "Los círculos letrados y sus reuniones como escena.",
    "viajes": "Relatos de viaje y mundos lejanos."
  }
};
export const TEMAS = Object.values(GRUPOS_TEMAS).flatMap(Object.keys);
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
    for (const t of d.temas ?? []) if (!TEMAS.includes(t)) errores.push(`${c}: tema fuera del vocabulario "${t}" (los temas libres van en detalles)`);
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
