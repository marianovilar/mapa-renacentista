// Mapa renacentista — fase 1. Lee datos.json (generado por npm run validar)
// y arma tres vistas enlazadas: índice, mapa con línea de tiempo y ficha de detalle.
// La selección vive en la URL (#/dialogo/id, #/persona/id, #/lugar/id).

const L = window.L;
const AÑO_MIN = 1340;
const AÑO_MAX = 1535;

const ROLES_LUGAR = {
  composicion: 'Composición',
  ambientacion: 'Ambientación',
  edicion: 'Primera edición',
};
const ROLES_PERSONA = {
  autor: 'Autor de',
  destinatario: 'Destinatario de',
  interlocutor: 'Interlocutor en',
  evocado: 'Evocado en',
};
const FORMAS_DEDICATORIA = { dedicatoria: 'dedicatoria', 'carta-prefatoria': 'carta prefatoria', apóstrofe: 'apóstrofe' };
const RELACIONES = {
  'reelaboracion-de': 'Reelaboración de',
  'reelaborada-en': 'Reelaborada en',
  'parte-de': 'Parte de',
  contiene: 'Contiene',
  serie: 'Misma serie que',
};

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Desplaza solo el contenedor (no la página) hasta que el elemento sea visible. */
function desplazarDentro(cont, el) {
  const c = cont.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  if (e.top < c.top) cont.scrollTop -= c.top - e.top + 8;
  else if (e.bottom > c.bottom) cont.scrollTop += e.bottom - c.bottom + 8;
}
const color = (variable) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

// ---------- Datos e índices ----------

const db = {
  dialogos: new Map(),
  personas: new Map(),
  lugares: new Map(),
  porPersona: new Map(), // id → [{ d, rol, nota, alias }]
  porLugar: new Map(), // id → [{ d, rol, nota }]
  regiones: [],
};

function anotar(mapa, id, entrada) {
  if (id == null) return;
  if (!mapa.has(id)) mapa.set(id, []);
  mapa.get(id).push(entrada);
}

function indexar(datos) {
  db.regiones = datos.regiones ?? [];
  for (const p of datos.personas) db.personas.set(p.id, p);
  for (const l of datos.lugares) db.lugares.set(l.id, l);
  const ordenados = [...datos.dialogos].sort((a, b) => inicio(a) - inicio(b) || a.titulo.localeCompare(b.titulo));
  for (const d of ordenados) {
    db.dialogos.set(d.id, d);
    for (const a of d.autores ?? []) anotar(db.porPersona, a, { d, rol: 'autor' });
    for (const x of d.destinatarios ?? []) anotar(db.porPersona, x.persona, { d, rol: 'destinatario', nota: FORMAS_DEDICATORIA[x.forma] });
    for (const x of d.interlocutores ?? []) anotar(db.porPersona, x.persona, { d, rol: 'interlocutor', alias: x.nombre_en_el_texto });
    for (const x of d.evocados ?? []) anotar(db.porPersona, x.persona, { d, rol: 'evocado' });
    for (const r of d.redacciones ?? []) {
      for (const p of r.interlocutores ?? []) {
        if (!(d.interlocutores ?? []).some((x) => x.persona === p)) anotar(db.porPersona, p, { d, rol: 'interlocutor', nota: `en ${r.titulo}` });
      }
    }
    for (const x of d.composicion?.lugares ?? []) anotar(db.porLugar, x.lugar, { d, rol: 'composicion', nota: x.nota });
    anotar(db.porLugar, d.ambientacion?.lugar, { d, rol: 'ambientacion' });
    anotar(db.porLugar, d.primera_edicion?.lugar, { d, rol: 'edicion' });
  }
}

const inicio = (d) => d.composicion?.fecha?.desde ?? 9999;
const fin = (d) => d.composicion?.fecha?.hasta ?? inicio(d);
const nombre = (id) => db.personas.get(id)?.nombre ?? id;
const autoresDe = (d) => (d.autores ?? []).map(nombre).join(', ');

function fmtFecha(f) {
  if (!f || f.desde == null) return null;
  const rango = f.desde === f.hasta ? `${f.desde}` : `${f.desde}–${f.hasta}`;
  return f.certeza === 'conjetural' ? `c. ${rango}` : rango;
}

function fmtVida(p) {
  if (!p.nacimiento && !p.muerte) return '';
  return `${p.nacimiento ?? '?'}–${p.muerte ?? '?'}`;
}

/** Diálogos ligados a la selección actual, con el rol de cada lugar. */
function dialogosDe(sel) {
  if (!sel) return [];
  if (sel.tipo === 'dialogo') return db.dialogos.has(sel.id) ? [db.dialogos.get(sel.id)] : [];
  const fuente = sel.tipo === 'persona' ? db.porPersona : db.porLugar;
  return [...new Set((fuente.get(sel.id) ?? []).map((e) => e.d))];
}

// ---------- Enlaces ----------

const enlaceD = (d) => `<a href="#/dialogo/${esc(d.id)}"><i>${esc(d.titulo)}</i></a>`;
const enlaceP = (id) => `<a href="#/persona/${esc(id)}">${esc(nombre(id))}</a>`;
const enlaceL = (id) => (id && db.lugares.has(id) ? `<a href="#/lugar/${esc(id)}">${esc(db.lugares.get(id).nombre)}</a>` : '');

// ---------- Ruta ----------

function leerRuta() {
  const [, tipo, id] = decodeURIComponent(location.hash).split('/');
  if (['dialogo', 'persona', 'lugar'].includes(tipo) && id) return { tipo, id };
  return null;
}

// Páginas de texto: cada una vive en su propio archivo HTML dentro de web/.
const PAGINAS = { presentacion: 'presentacion.html', datos: 'datos.html' };

function aplicarRuta() {
  const pagina = location.hash.split('/')[1];
  const enTexto = pagina in PAGINAS;
  $('#explorar').hidden = enTexto;
  for (const art of document.querySelectorAll('.presentacion')) art.hidden = art.id !== pagina;
  for (const a of document.querySelectorAll('.navegacion a')) {
    a.classList.toggle('activo', a.dataset.seccion === (enTexto ? pagina : 'explorar'));
  }
  if (enTexto) {
    pintarPagina(pagina);
    scrollTo(0, 0);
    return;
  }
  const sel = leerRuta();
  pintarDetalle(sel);
  pintarMapa(sel);
  pintarRed(sel);
  pintarTiempo(sel);
  marcarLista(sel);
}

// ---------- Ficha de detalle ----------

function pintarDetalle(sel) {
  const panel = $('#detalle');
  let html;
  if (!sel) html = vistaInicio();
  else if (sel.tipo === 'dialogo' && db.dialogos.has(sel.id)) html = vistaDialogo(db.dialogos.get(sel.id));
  else if (sel.tipo === 'persona' && db.personas.has(sel.id)) html = vistaPersona(db.personas.get(sel.id));
  else if (sel.tipo === 'lugar' && db.lugares.has(sel.id)) html = vistaLugar(db.lugares.get(sel.id));
  else html = `<p>No se encontró «${esc(sel.id)}».</p>`;
  panel.innerHTML = html;
  panel.scrollTop = 0;
}

function vistaInicio() {
  const cruces = [...db.porPersona]
    .map(([id, es]) => [id, new Set(es.map((e) => e.d.id)).size])
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const sinFuentes = [...db.dialogos.values()].filter((d) => !d.fuentes?.length).length;
  return `
    <div class="entrada">
      <div class="tipo-ficha">Fase 1</div>
      <h1 class="detalle-titulo">Diálogos latinos del Renacimiento</h1>
      <p class="detalle-sub">Del <i>Secretum</i> de Petrarca a la última edición de los <i>Colloquia</i> de Erasmo</p>
      <div class="cifras">
        <div class="cifra"><b>${db.dialogos.size}</b><span>diálogos</span></div>
        <div class="cifra"><b>${db.personas.size}</b><span>personas</span></div>
        <div class="cifra"><b>${db.porLugar.size}</b><span>lugares</span></div>
      </div>
      <p>Elegí un diálogo, una persona o un lugar en el índice, el mapa o la línea de tiempo. Cada nombre de la ficha lleva a su propia ficha, con todos sus cruces.</p>
      <p class="nota-suelta">Prototipo en revisión: ${sinFuentes} de ${db.dialogos.size} fichas todavía no citan ninguna fuente y ninguna está revisada por completo. Las fechas, los lugares y algunos repartos son provisionales.</p>
      <div class="seccion">
        <h3>Personas con más cruces</h3>
        <ul class="items">
          ${cruces.map(([id, n]) => `<li>${enlaceP(id)}<span class="contador">${n} diálogos</span></li>`).join('')}
        </ul>
      </div>
    </div>`;
}

function filaDato(etiqueta, valor) {
  return valor ? `<dt>${etiqueta}</dt><dd>${valor}</dd>` : '';
}

function fechaConCerteza(f) {
  const t = fmtFecha(f);
  if (!t) return null;
  const extra = f.certeza && f.certeza !== 'segura' ? ` <span class="certeza">(${esc(f.certeza)})</span>` : '';
  const nota = f.nota ? `<span class="items"><span class="nota">${esc(f.nota)}</span></span>` : '';
  return `${esc(t)}${extra}${nota}`;
}

function listaPersonas(lista, conAlias = true) {
  if (!lista?.length) return '';
  return `<ul class="items">${lista
    .map((x) => {
      const alias = conAlias && x.nombre_en_el_texto && x.nombre_en_el_texto !== nombre(x.persona) ? ` <span class="alias">(${esc(x.nombre_en_el_texto)})</span>` : '';
      const forma = x.forma ? ` <span class="certeza">· ${esc(FORMAS_DEDICATORIA[x.forma] ?? x.forma)}</span>` : '';
      const nota = x.nota ? `<span class="nota">${esc(x.nota)}</span>` : '';
      return `<li>${enlaceP(x.persona)}${alias}${forma}${nota}</li>`;
    })
    .join('')}</ul>`;
}

function vistaDialogo(d) {
  const etiquetas = [
    d.lengua,
    d.forma,
    d.libros ? `${d.libros} ${d.libros === 1 ? 'libro' : 'libros'}` : null,
  ].filter(Boolean).map((t) => `<span class="etiqueta">${esc(t)}</span>`);
  if (d.caso_dudoso) etiquetas.push(`<span class="etiqueta aviso" title="${esc(d.motivo_duda)}">caso dudoso</span>`);
  if (d.revision === 'pendiente') etiquetas.push('<span class="etiqueta">sin revisar</span>');
  if (!d.fuentes?.length) etiquetas.push('<span class="etiqueta aviso" title="Los datos de esta ficha todavía no se apoyan en ninguna fuente citada">sin fuentes</span>');

  const lugaresComp = (d.composicion?.lugares ?? [])
    .map((x) => `${enlaceL(x.lugar)}${x.nota ? `<span class="items"><span class="nota">${esc(x.nota)}</span></span>` : ''}`)
    .join('<br>');
  const amb = d.ambientacion;
  const ambTexto = amb && (amb.lugar || amb.fecha || amb.nota)
    ? [enlaceL(amb.lugar), fmtFecha(amb.fecha) ? esc(fmtFecha(amb.fecha)) : ''].filter(Boolean).join(', ') +
      (amb.nota || amb.fecha?.nota ? `<span class="items"><span class="nota">${esc([amb.fecha?.nota, amb.nota].filter(Boolean).join(' '))}</span></span>` : '')
    : null;
  const ed = d.primera_edicion;
  const edTexto = ed
    ? [enlaceL(ed.lugar), ed.impresor ? esc(ed.impresor) : '', esc(fmtFecha(ed.fecha) ?? '')].filter(Boolean).join(', ') +
      (ed.fecha?.nota || ed.nota ? `<span class="items"><span class="nota">${esc([ed.fecha?.nota, ed.nota].filter(Boolean).join(' '))}</span></span>` : '')
    : null;

  const relaciones = (d.relaciones ?? []).filter((r) => db.dialogos.has(r.dialogo));
  const redacciones = d.redacciones ?? [];

  return `
    <div class="tipo-ficha">Diálogo</div>
    <h1 class="detalle-titulo"><i>${esc(d.titulo)}</i></h1>
    ${d.titulo_completo && d.titulo_completo !== d.titulo ? `<p class="detalle-sub">${esc(d.titulo_completo)}</p>` : ''}
    <p>${(d.autores ?? []).map(enlaceP).join(', ')}</p>
    <div class="etiquetas">${etiquetas.join('')}</div>
    ${d.caso_dudoso ? `<p class="nota-suelta">${esc(d.motivo_duda)}</p>` : ''}
    ${d.resumen ? `<p class="resumen">${esc(d.resumen)}</p>` : ''}

    <div class="seccion">
      <h3>Fechas y lugares</h3>
      <dl class="datos">
        ${filaDato('Composición', fechaConCerteza(d.composicion?.fecha))}
        ${filaDato('Escrito en', lugaresComp)}
        ${filaDato('Ambientación', ambTexto)}
        ${filaDato('1.ª edición', edTexto)}
      </dl>
    </div>

    ${d.denominacion || d.modo || d.relacion_interlocutores || amb?.espacio ? `<div class="seccion">
      <h3>Forma</h3>
      <dl class="datos">
        ${filaDato('Denominación', d.denominacion ? `<i>${esc(d.denominacion)}</i>` : null)}
        ${filaDato('Modo', esc(d.modo ?? ''))}
        ${filaDato('Voces', esc(d.relacion_interlocutores ?? ''))}
        ${filaDato('Espacio', esc(amb?.espacio ?? ''))}
      </dl>
    </div>` : ''}

    <div class="seccion">
      <h3>Destinatarios</h3>
      ${listaPersonas(d.destinatarios, false) || '<p class="nota-suelta">Sin destinatario registrado.</p>'}
      ${d.nota_destinatarios ? `<p class="nota-suelta">${esc(d.nota_destinatarios)}</p>` : ''}
    </div>

    <div class="seccion">
      <h3>Interlocutores</h3>
      ${listaPersonas(d.interlocutores) || '<p class="nota-suelta">Por completar.</p>'}
      ${d.nota_interlocutores ? `<p class="nota-suelta">${esc(d.nota_interlocutores)}</p>` : ''}
    </div>

    ${d.evocados?.length ? `<div class="seccion"><h3>Evocados</h3>${listaPersonas(d.evocados)}</div>` : ''}

    ${redacciones.length ? `<div class="seccion"><h3>Redacciones</h3><ul class="items">${redacciones
      .map((r) => `<li><i>${esc(r.titulo ?? '')}</i> ${esc(fmtFecha(r.fecha) ?? '')} ${(r.lugares ?? []).map(enlaceL).join(', ')}${r.nota ? `<span class="nota">${esc(r.nota)}</span>` : ''}</li>`)
      .join('')}</ul></div>` : ''}

    ${relaciones.length ? `<div class="seccion"><h3>Obras vinculadas</h3><ul class="items">${relaciones
      .map((r) => `<li>${esc(RELACIONES[r.tipo] ?? r.tipo)} ${enlaceD(db.dialogos.get(r.dialogo))}${r.nota ? `<span class="nota">${esc(r.nota)}</span>` : ''}</li>`)
      .join('')}</ul></div>` : ''}

    ${d.temas?.length ? `<div class="seccion"><h3>Temas</h3><div class="etiquetas">${d.temas.map((t) => `<span class="etiqueta">${esc(t)}</span>`).join('')}</div></div>` : ''}

    ${d.fuentes?.length ? `<div class="seccion"><h3>Fuentes</h3><ul class="fuentes">${d.fuentes.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}

    <p class="corregir"><a href="${esc(urlCorreccion(d))}" target="_blank" rel="noopener">Proponer una corrección</a> · <a href="#/datos">Sobre los datos</a></p>`;
}

// Abre el formulario de GitHub (.github/ISSUE_TEMPLATE/correccion-ficha.yml) con la ficha ya identificada.
function urlCorreccion(d) {
  const q = new URLSearchParams({ template: 'correccion-ficha.yml', title: `Corrección: ${d.titulo}`, ficha: `${d.titulo} (${d.id})` });
  return `https://github.com/marianovilar/mapa-renacentista/issues/new?${q}`;
}

function vistaPersona(p) {
  const entradas = db.porPersona.get(p.id) ?? [];
  const secciones = Object.entries(ROLES_PERSONA)
    .map(([rol, titulo]) => {
      const es = entradas.filter((e) => e.rol === rol);
      if (!es.length) return '';
      return `<div class="seccion"><h3>${titulo}</h3><ul class="items">${es
        .map((e) => {
          const extra = [e.alias ? `como <span class="alias">${esc(e.alias)}</span>` : '', e.nota ? esc(e.nota) : ''].filter(Boolean).join(' · ');
          return `<li>${enlaceD(e.d)} <span class="certeza">${esc(fmtFecha(e.d.composicion?.fecha) ?? '')}</span>${extra ? `<span class="nota">${extra}</span>` : ''}</li>`;
        })
        .join('')}</ul></div>`;
    })
    .join('');

  // Coincidencias: otras personas presentes en los mismos diálogos, con cualquier rol.
  const propios = new Set(entradas.map((e) => e.d.id));
  const coinciden = new Map();
  for (const [id, es] of db.porPersona) {
    if (id === p.id) continue;
    const comunes = new Set(es.filter((e) => propios.has(e.d.id)).map((e) => e.d.id));
    if (comunes.size) coinciden.set(id, comunes.size);
  }
  const top = [...coinciden].sort((a, b) => b[1] - a[1] || nombre(a[0]).localeCompare(nombre(b[0]))).slice(0, 20);

  const etiquetas = [p.tipo, p.sexo, fmtVida(p)].filter(Boolean).map((t) => `<span class="etiqueta">${esc(t)}</span>`).join('');
  return `
    <div class="tipo-ficha">Persona</div>
    <h1 class="detalle-titulo">${esc(p.nombre)}</h1>
    ${p.nombre_latino && p.nombre_latino !== p.nombre ? `<p class="detalle-sub">${esc(p.nombre_latino)}</p>` : ''}
    <div class="etiquetas">${etiquetas}</div>
    ${p.nota ? `<p class="nota-suelta">${esc(p.nota)}</p>` : ''}
    ${p.wikidata ? `<p><a href="https://www.wikidata.org/wiki/${esc(p.wikidata)}" target="_blank" rel="noopener">Wikidata ${esc(p.wikidata)}</a></p>` : ''}
    ${secciones || '<p class="nota-suelta">No aparece en ningún diálogo.</p>'}
    ${top.length ? `<div class="seccion"><h3>Coincide con</h3><ul class="items">${top
      .map(([id, n]) => `<li>${enlaceP(id)}<span class="contador">${n} ${n === 1 ? 'diálogo' : 'diálogos'}</span></li>`)
      .join('')}</ul></div>` : ''}`;
}

function vistaLugar(l) {
  const entradas = db.porLugar.get(l.id) ?? [];
  const secciones = Object.entries(ROLES_LUGAR)
    .map(([rol, titulo]) => {
      const es = entradas.filter((e) => e.rol === rol);
      if (!es.length) return '';
      return `<div class="seccion"><h3><span class="punto" style="background:var(--${rol})"></span> ${titulo}</h3><ul class="items">${es
        .map((e) => `<li>${enlaceD(e.d)} · ${esc(autoresDe(e.d))} <span class="certeza">${esc(fmtFecha(e.d.composicion?.fecha) ?? '')}</span>${e.nota ? `<span class="nota">${esc(e.nota)}</span>` : ''}</li>`)
        .join('')}</ul></div>`;
    })
    .join('');
  return `
    <div class="tipo-ficha">Lugar</div>
    <h1 class="detalle-titulo">${esc(l.nombre)}</h1>
    ${l.nombre_latino && l.nombre_latino !== l.nombre ? `<p class="detalle-sub">${esc(l.nombre_latino)}</p>` : ''}
    ${l.nota ? `<p class="nota-suelta">${esc(l.nota)}</p>` : ''}
    ${secciones || '<p class="nota-suelta">Sin diálogos asociados.</p>'}`;
}

// ---------- Índice ----------

let pestana = 'dialogos';

function pintarLista() {
  const q = $('.buscador').value.trim().toLowerCase();
  const coincide = (...textos) => !q || textos.some((t) => String(t ?? '').toLowerCase().includes(q));
  let html = '';
  if (pestana === 'dialogos') {
    let siglo = null;
    for (const d of db.dialogos.values()) {
      const personas = [...(d.autores ?? []), ...(d.interlocutores ?? []).map((x) => x.persona)].map(nombre);
      if (!coincide(d.titulo, d.titulo_completo, ...personas)) continue;
      const s = Math.floor(inicio(d) / 100) + 1;
      if (s !== siglo) { siglo = s; html += `<li class="grupo">Siglo ${['XIV', 'XV', 'XVI'][s - 14] ?? s}</li>`; }
      html += `<li><a href="#/dialogo/${esc(d.id)}" data-id="dialogo/${esc(d.id)}"><span class="principal"><i>${esc(d.titulo)}</i></span><span class="secundario">${esc(autoresDe(d))} · ${esc(fmtFecha(d.composicion?.fecha) ?? '')}</span></a></li>`;
    }
  } else if (pestana === 'personas') {
    const lista = [...db.personas.values()].filter((p) => db.porPersona.has(p.id)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    for (const p of lista) {
      if (!coincide(p.nombre, p.nombre_latino)) continue;
      const n = new Set(db.porPersona.get(p.id).map((e) => e.d.id)).size;
      const roles = [...new Set(db.porPersona.get(p.id).map((e) => e.rol))].join(', ');
      html += `<li><a href="#/persona/${esc(p.id)}" data-id="persona/${esc(p.id)}"><span class="principal">${esc(p.nombre)}</span><span class="secundario">${esc(roles)} · ${n} ${n === 1 ? 'diálogo' : 'diálogos'}</span></a></li>`;
    }
  } else {
    const lista = [...db.lugares.values()].filter((l) => db.porLugar.has(l.id)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    for (const l of lista) {
      if (!coincide(l.nombre, l.nombre_latino)) continue;
      const n = new Set(db.porLugar.get(l.id).map((e) => e.d.id)).size;
      html += `<li><a href="#/lugar/${esc(l.id)}" data-id="lugar/${esc(l.id)}"><span class="principal">${esc(l.nombre)}</span><span class="secundario">${esc(l.nombre_latino ?? '')} · ${n} ${n === 1 ? 'diálogo' : 'diálogos'}</span></a></li>`;
    }
  }
  $('#lista').innerHTML = html || '<li class="grupo">Sin resultados</li>';
  marcarLista(leerRuta());
}

function marcarLista(sel) {
  for (const a of document.querySelectorAll('#lista a.activo')) a.classList.remove('activo');
  if (!sel) return;
  const a = document.querySelector(`#lista a[data-id="${sel.tipo}/${CSS.escape(sel.id)}"]`);
  if (a) { a.classList.add('activo'); desplazarDentro($('#lista'), a); }
}

function iniciarLista() {
  for (const b of document.querySelectorAll('.pestanas button')) {
    b.addEventListener('click', () => {
      pestana = b.dataset.pestana;
      for (const x of document.querySelectorAll('.pestanas button')) x.setAttribute('aria-selected', x === b);
      pintarLista();
    });
  }
  $('.buscador').addEventListener('input', pintarLista);
  pintarLista();
}

// ---------- Mapa ----------

let mapa;
const marcadores = new Map(); // id de lugar → circleMarker
let capaLineas;

function iniciarMapa() {
  mapa = L.map('mapa', { zoomControl: true, attributionControl: true, minZoom: 3, maxZoom: 10 }).setView([46, 9], 5);
  // Relieve sin fronteras ni nombres modernos: la capa política llegará en otra fase.
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Relieve &copy; Esri, USGS, NOAA',
    maxNativeZoom: 9,
  }).addTo(mapa);
  capaLineas = L.layerGroup().addTo(mapa);
  pintarRegiones();

  for (const [id] of db.porLugar) {
    const l = db.lugares.get(id);
    if (!l) continue;
    const m = L.circleMarker([l.lat, l.lon], { radius: radio(id), weight: 2 })
      .bindTooltip(l.nombre, { className: 'etiqueta-lugar', direction: 'top', offset: [0, -6] })
      .on('click', () => { location.hash = `#/lugar/${id}`; })
      .addTo(mapa);
    marcadores.set(id, m);
  }

  $('#leyenda-mapa').innerHTML = Object.entries(ROLES_LUGAR)
    .map(([rol, t]) => `<span><i class="punto" style="background:var(--${rol})"></i>${t}</span>`)
    .join('');

  new ResizeObserver(() => mapa.invalidateSize()).observe($('#mapa'));
}

// Nombres de regiones: solo texto, debajo de los marcadores y sin capturar clics.
// Se ocultan a escala de continente, donde se encimarían.
const ZOOM_REGIONES = 6;

function pintarRegiones() {
  mapa.createPane('regiones');
  const panel = mapa.getPane('regiones');
  panel.style.zIndex = 390;
  panel.style.pointerEvents = 'none';
  for (const r of db.regiones) {
    const latino = r.nombre_latino && r.nombre_latino !== r.nombre ? `<i>(${esc(r.nombre_latino)})</i>` : '';
    L.marker([r.lat, r.lon], {
      pane: 'regiones',
      interactive: false,
      keyboard: false,
      icon: L.divIcon({ className: 'region', html: `<div class="region-texto"><span>${esc(r.nombre)}</span>${latino}</div>`, iconSize: null }),
    }).addTo(mapa);
  }
  const alternar = () => panel.classList.toggle('oculto', mapa.getZoom() < ZOOM_REGIONES);
  mapa.on('zoomend', alternar);
  alternar();
}

function radio(id) {
  const n = new Set((db.porLugar.get(id) ?? []).map((e) => e.d.id)).size;
  return 4 + Math.sqrt(n) * 2.6;
}

function pintarMapa(sel) {
  const dialogos = dialogosDe(sel);
  const ids = new Set(dialogos.map((d) => d.id));
  // Rol principal de cada lugar dentro de la selección (composición manda sobre ambientación y edición).
  const roles = new Map();
  for (const [id, es] of db.porLugar) {
    for (const rol of Object.keys(ROLES_LUGAR)) {
      if (!roles.has(id) && es.some((e) => e.rol === rol && ids.has(e.d.id))) roles.set(id, rol);
    }
  }
  if (sel?.tipo === 'lugar' && !roles.has(sel.id)) roles.set(sel.id, 'composicion');

  const superficie = color('--superficie');
  const resaltados = [];
  for (const [id, m] of marcadores) {
    const rol = roles.get(id);
    if (rol) {
      m.setStyle({ color: superficie, fillColor: color(`--${rol}`), fillOpacity: 0.95, opacity: 1, weight: 2 });
      m.bringToFront();
      resaltados.push(m.getLatLng());
    } else {
      m.setStyle({ color: superficie, fillColor: color('--neutro'), fillOpacity: sel ? 0.25 : 0.7, opacity: sel ? 0.4 : 1, weight: 2 });
    }
    m.closeTooltip();
  }

  // Líneas de composición → ambientación, para ver el desplazamiento entre escribir y situar.
  capaLineas.clearLayers();
  for (const d of dialogos) {
    const destino = db.lugares.get(d.ambientacion?.lugar);
    if (!destino) continue;
    for (const x of d.composicion?.lugares ?? []) {
      const origen = db.lugares.get(x.lugar);
      if (!origen || origen.id === destino.id) continue;
      L.polyline([[origen.lat, origen.lon], [destino.lat, destino.lon]], {
        color: color('--ambientacion'), weight: 2, opacity: 0.7, dashArray: '4 5', interactive: false,
      }).addTo(capaLineas);
    }
  }

  // Con el mapa oculto (vista de red o presentación) Leaflet no puede calcular el encuadre.
  if (!$('#mapa').clientWidth) return;
  mapa.invalidateSize(); // por si el mapa acaba de volver a mostrarse con un tamaño viejo
  if (resaltados.length === 1) mapa.flyTo(resaltados[0], Math.max(mapa.getZoom(), 6), { duration: 0.6 });
  else if (resaltados.length > 1) mapa.flyToBounds(L.latLngBounds(resaltados).pad(0.3), { duration: 0.6, maxZoom: 7 });
  if (resaltados.length && resaltados.length <= 6) {
    for (const [id, m] of marcadores) if (roles.has(id)) m.openTooltip();
  }
}

// ---------- Línea de tiempo ----------

const ALTO_FILA = 12;
const SEPARACION = 4;
let filas = null; // id de diálogo → fila

function empaquetar() {
  // Cada diálogo en la primera fila libre, ordenados por fecha de inicio.
  const finDeFila = [];
  filas = new Map();
  for (const d of db.dialogos.values()) {
    if (inicio(d) === 9999) continue;
    let f = finDeFila.findIndex((x) => x < inicio(d) - 1);
    if (f === -1) { f = finDeFila.length; finDeFila.push(0); }
    finDeFila[f] = Math.max(fin(d), inicio(d) + 3); // margen mínimo para obras de un año
    filas.set(d.id, f);
  }
}

function pintarTiempo(sel) {
  if (!filas) empaquetar();
  const cont = $('#tiempo');
  const ancho = Math.max(cont.clientWidth, 320);
  const nFilas = Math.max(...filas.values()) + 1;
  const alto = 22 + nFilas * (ALTO_FILA + SEPARACION);
  const x = (año) => 8 + ((año - AÑO_MIN) / (AÑO_MAX - AÑO_MIN)) * (ancho - 16);
  const relacionados = new Set(dialogosDe(sel).map((d) => d.id));
  const elegido = sel?.tipo === 'dialogo' ? sel.id : null;

  let ejes = '';
  for (let a = 1350; a <= AÑO_MAX; a += 25) {
    ejes += `<line x1="${x(a)}" x2="${x(a)}" y1="16" y2="${alto}"/><text x="${x(a)}" y="11" text-anchor="middle">${a}</text>`;
  }

  let barras = '';
  for (const d of db.dialogos.values()) {
    if (!filas.has(d.id)) continue;
    const f = d.composicion.fecha;
    const x1 = x(f.desde);
    const w = Math.max(x(f.hasta + 1) - x1, 6);
    const y = 20 + filas.get(d.id) * (ALTO_FILA + SEPARACION);
    const activo = relacionados.has(d.id);
    const relleno = activo ? color('--composicion') : color('--neutro');
    const opac = sel && !activo ? 0.22 : f.certeza === 'conjetural' ? 0.55 : 0.85;
    const borde = d.id === elegido ? `stroke="${color('--tinta')}" stroke-width="2"` : f.certeza === 'conjetural' ? `stroke="${relleno}" stroke-dasharray="3 2"` : '';
    barras += `<rect class="barra" data-id="${esc(d.id)}" x="${x1}" y="${y}" width="${w}" height="${ALTO_FILA}" rx="3" fill="${relleno}" fill-opacity="${opac}" ${borde}/>`;
  }

  cont.innerHTML = `<svg width="${ancho}" height="${alto}" role="img" aria-label="Línea de tiempo de composición de los diálogos"><g class="eje">${ejes}</g>${barras}</svg>`;

  const elegidoRect = elegido && cont.querySelector(`rect[data-id="${CSS.escape(elegido)}"]`);
  if (elegidoRect) desplazarDentro(cont, elegidoRect);
}

function iniciarTiempo() {
  const cont = $('#tiempo');
  const globo = $('#globo');
  cont.addEventListener('click', (e) => {
    const id = e.target.closest('.barra')?.dataset.id;
    if (id) location.hash = `#/dialogo/${id}`;
  });
  cont.addEventListener('mousemove', (e) => {
    const id = e.target.closest('.barra')?.dataset.id;
    if (!id) { globo.hidden = true; return; }
    const d = db.dialogos.get(id);
    globo.innerHTML = `<b>${esc(d.titulo)}</b>${esc(autoresDe(d))} · ${esc(fmtFecha(d.composicion?.fecha))}${d.composicion.fecha.certeza === 'conjetural' ? ' (conjetural)' : ''}`;
    globo.hidden = false;
    const r = globo.getBoundingClientRect();
    globo.style.left = `${Math.min(e.clientX + 12, innerWidth - r.width - 8)}px`;
    globo.style.top = `${e.clientY - r.height - 10}px`;
  });
  cont.addEventListener('mouseleave', () => { globo.hidden = true; });
  new ResizeObserver(() => pintarTiempo(leerRuta())).observe(cont);
}

// ---------- Aviso sobre el estado de los datos ----------
// Se puede ocultar; la elección se recuerda en este navegador. La ficha de inicio repite el aviso.

function iniciarAviso() {
  const aviso = $('#aviso-datos');
  if (leerPreferencia('aviso-datos') === 'oculto') aviso.hidden = true;
  $('#cerrar-aviso').addEventListener('click', () => {
    aviso.hidden = true;
    guardarPreferencia('aviso-datos', 'oculto');
    requestAnimationFrame(() => mapa.invalidateSize());
  });
}

// ---------- Selector de vista (mapa o red) ----------

function leerPreferencia(clave, porDefecto) {
  try { return localStorage.getItem(clave) ?? porDefecto; } catch { return porDefecto; }
}
function guardarPreferencia(clave, valor) {
  try { localStorage.setItem(clave, valor); } catch { /* sin almacenamiento: no pasa nada */ }
}

function mostrarVista(vista) {
  for (const b of document.querySelectorAll('.selector-vista button')) b.setAttribute('aria-selected', b.dataset.vista === vista);
  $('#vista-mapa').hidden = vista !== 'mapa';
  $('#vista-red').hidden = vista !== 'red';
  guardarPreferencia('vista', vista);
  if (vista === 'mapa') {
    requestAnimationFrame(() => { mapa.invalidateSize(); pintarMapa(leerRuta()); });
  } else if (red.svg) {
    pintarRed(leerRuta());
  }
}

function iniciarVistas() {
  for (const b of document.querySelectorAll('.selector-vista button')) {
    b.addEventListener('click', () => mostrarVista(b.dataset.vista));
  }
  mostrarVista(leerPreferencia('vista', 'mapa') === 'red' ? 'red' : 'mapa');
}

// ---------- Red de diálogos ----------
// Cada diálogo es un nodo. Dos diálogos se unen si comparten una persona:
//   autor       → la misma persona es autor de ambos;
//   dedicatoria → la misma persona es destinataria de ambos;
//   personaje   → cualquier otro cruce: interlocutor o evocado en alguno de los dos,
//                 o roles distintos en cada uno (el autor de uno que es personaje del otro).

const TIPOS_ENLACE = {
  autor: { etiqueta: 'Mismo autor', color: '--composicion', curva: 0 },
  personaje: { etiqueta: 'Personajes en común', color: '--ambientacion', curva: 0.18 },
  dedicatoria: { etiqueta: 'Mismo destinatario', color: '--edicion', curva: -0.18 },
};
const RED_ANCHO = 1000;
const RED_ALTO = 640;
const red = { nodos: [], enlaces: [], porDialogo: new Map(), tipos: new Set(Object.keys(TIPOS_ENLACE)), todos: false };

/** Personas que cuentan para un enlace: por defecto solo las históricas. */
const personasDe = (e) => (red.todos ? e.personas : e.personas.filter((id) => db.personas.get(id)?.tipo === 'histórica'));
/** Un enlace se dibuja si su tipo está activo y le queda al menos una persona que contar. */
const activo = (e) => red.tipos.has(e.tipo) && personasDe(e).length > 0;

/** persona → roles ('autor' | 'destinatario' | 'personaje') que tiene en el diálogo d. */
function rolesEn(d) {
  const roles = new Map();
  const poner = (id, rol) => { if (!roles.has(id)) roles.set(id, new Set()); roles.get(id).add(rol); };
  for (const a of d.autores ?? []) poner(a, 'autor');
  for (const x of d.destinatarios ?? []) poner(x.persona, 'destinatario');
  for (const x of d.interlocutores ?? []) poner(x.persona, 'personaje');
  for (const x of d.evocados ?? []) poner(x.persona, 'personaje');
  for (const r of d.redacciones ?? []) for (const p of r.interlocutores ?? []) poner(p, 'personaje');
  return roles;
}

function construirRed() {
  const lista = [...db.dialogos.values()];
  const roles = new Map(lista.map((d) => [d.id, rolesEn(d)]));
  const pares = new Map();
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i], b = lista[j];
      const rb = roles.get(b.id);
      for (const [persona, rolesA] of roles.get(a.id)) {
        const rolesB = rb.get(persona);
        if (!rolesB) continue;
        const tipo = rolesA.has('autor') && rolesB.has('autor') ? 'autor'
          : rolesA.has('destinatario') && rolesB.has('destinatario') ? 'dedicatoria'
          : 'personaje';
        const clave = `${a.id}|${b.id}|${tipo}`;
        if (!pares.has(clave)) pares.set(clave, { source: a.id, target: b.id, tipo, personas: [] });
        pares.get(clave).personas.push(persona);
      }
    }
  }
  red.enlaces = [...pares.values()];
  const grado = new Map();
  for (const e of red.enlaces) for (const id of [e.source, e.target]) grado.set(id, (grado.get(id) ?? 0) + 1);
  red.nodos = lista.map((d) => ({ id: d.id, d, grado: grado.get(d.id) ?? 0 }));
  for (const e of red.enlaces) {
    for (const [x, y] of [[e.source, e.target], [e.target, e.source]]) {
      if (!red.porDialogo.has(x)) red.porDialogo.set(x, []);
      red.porDialogo.get(x).push({ otro: y, enlace: e });
    }
  }

  // La disposición se calcula una sola vez, para que la red no se mueva entre selecciones.
  const sim = d3.forceSimulation(red.nodos)
    .force('enlace', d3.forceLink(red.enlaces).id((n) => n.id).distance(90).strength(0.25))
    .force('carga', d3.forceManyBody().strength(-260))
    .force('x', d3.forceX(RED_ANCHO / 2).strength(0.06))
    .force('y', d3.forceY(RED_ALTO / 2).strength(0.09))
    .force('choque', d3.forceCollide().radius((n) => radioNodo(n) + 14))
    .stop();
  for (let i = 0; i < 400; i++) sim.tick();
  for (const n of red.nodos) {
    n.x = Math.max(40, Math.min(RED_ANCHO - 40, n.x));
    n.y = Math.max(30, Math.min(RED_ALTO - 30, n.y));
  }
}

const radioNodo = (n) => 5 + Math.sqrt(n.grado) * 2.2;

/** Curva cuadrática: cada tipo se curva distinto, para que no se tapen si un par comparte dos. */
function trazo(e) {
  const { x: x1, y: y1 } = e.source;
  const { x: x2, y: y2 } = e.target;
  const k = TIPOS_ENLACE[e.tipo].curva;
  const mx = (x1 + x2) / 2 - (y2 - y1) * k;
  const my = (y1 + y2) / 2 + (x2 - x1) * k;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

/** Rectángulo que contiene los nodos dados, con margen para las etiquetas. */
function limites(nodos) {
  const xs = nodos.map((n) => n.x), ys = nodos.map((n) => n.y);
  const x0 = Math.min(...xs) - 70, x1 = Math.max(...xs) + 70;
  const y0 = Math.min(...ys) - 40, y1 = Math.max(...ys) + 30;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Acerca la vista a los nodos destacados, o la devuelve al encuadre completo. */
function encuadrarRed(ids) {
  const total = red.marco;
  let t = d3.zoomIdentity;
  if (ids && ids.size > 1) {
    const b = limites(red.nodos.filter((n) => ids.has(n.id)));
    const k = Math.min(3, Math.max(1, Math.min(total.w / b.w, total.h / b.h)));
    t = d3.zoomIdentity
      .translate(total.x + total.w / 2, total.y + total.h / 2)
      .scale(k)
      .translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
  }
  red.svg.transition().duration(600).call(red.zoom.transform, t);
}

function iniciarRed() {
  construirRed();
  // El encuadre se ajusta a la red real, no al área de cálculo, para no dejar márgenes vacíos.
  red.marco = limites(red.nodos);
  const { x, y, w, h } = red.marco;
  const svg = d3.select('#red').attr('viewBox', `${x} ${y} ${w} ${h}`).attr('preserveAspectRatio', 'xMidYMid meet');
  const lienzo = svg.append('g');
  red.zoom = d3.zoom().scaleExtent([0.5, 5]).on('zoom', (ev) => lienzo.attr('transform', ev.transform));
  red.svg = svg;
  svg.call(red.zoom);

  lienzo.append('g').attr('class', 'enlaces').selectAll('path').data(red.enlaces).join('path')
    .attr('d', trazo)
    .attr('fill', 'none')
    .on('mousemove', (ev, e) => mostrarGlobo(ev,
      `<b>${esc(e.source.d.titulo)} · ${esc(e.target.d.titulo)}</b>${esc(TIPOS_ENLACE[e.tipo].etiqueta)}: ${esc((personasDe(e).length ? personasDe(e) : e.personas).map(nombre).join(', '))}`))
    .on('mouseleave', ocultarGlobo);

  const nodo = lienzo.append('g').attr('class', 'nodos').selectAll('g').data(red.nodos).join('g')
    .attr('class', 'nodo')
    .attr('transform', (n) => `translate(${n.x},${n.y})`)
    .on('click', (ev, n) => { location.hash = `#/dialogo/${n.id}`; })
    .on('mousemove', (ev, n) => mostrarGlobo(ev,
      `<b>${esc(n.d.titulo)}</b>${esc(autoresDe(n.d))} · ${esc(fmtFecha(n.d.composicion?.fecha) ?? '')} · ${n.grado} ${n.grado === 1 ? 'conexión' : 'conexiones'}`))
    .on('mouseleave', ocultarGlobo);
  nodo.append('circle').attr('r', radioNodo);
  nodo.append('text')
    .attr('dy', (n) => -radioNodo(n) - 4)
    .attr('text-anchor', 'middle')
    .text((n) => (n.d.titulo.length > 28 ? `${n.d.titulo.slice(0, 26)}…` : n.d.titulo));

  $('#leyenda-red').innerHTML = Object.entries(TIPOS_ENLACE)
    .map(([tipo, t]) => `<label><input type="checkbox" data-tipo="${tipo}" checked><i class="raya" style="background:var(${t.color})"></i>${t.etiqueta}</label>`)
    .join('') +
    '<label class="opcion-todos"><input type="checkbox" id="red-todos">Incluir todos los personajes (ficticios, alegóricos, mitológicos)</label>' +
    '<span class="nota-leyenda">Clic en un diálogo para ver sus conexiones</span>';
  $('#red-todos').addEventListener('change', (ev) => {
    red.todos = ev.target.checked;
    pintarRed(leerRuta());
  });
  for (const c of document.querySelectorAll('#leyenda-red input[data-tipo]')) {
    c.addEventListener('change', () => {
      if (c.checked) red.tipos.add(c.dataset.tipo);
      else red.tipos.delete(c.dataset.tipo);
      pintarRed(leerRuta());
    });
  }
}

function pintarRed(sel) {
  // Destacados: el diálogo elegido y sus vecinos, o los diálogos de la persona o el lugar elegidos.
  const elegido = sel?.tipo === 'dialogo' ? sel.id : null;
  let destacados = null;
  let visible = activo;
  if (elegido) {
    destacados = new Set([elegido]);
    for (const { otro, enlace } of red.porDialogo.get(elegido) ?? []) if (activo(enlace)) destacados.add(otro);
    visible = (e) => activo(e) && (e.source.id === elegido || e.target.id === elegido);
  } else if (sel) {
    destacados = new Set(dialogosDe(sel).map((d) => d.id));
    visible = sel.tipo === 'persona'
      ? (e) => red.tipos.has(e.tipo) && e.personas.includes(sel.id)
      : (e) => activo(e) && destacados.has(e.source.id) && destacados.has(e.target.id);
  }

  d3.select('#red .enlaces').selectAll('path')
    .attr('stroke', (e) => color(TIPOS_ENLACE[e.tipo].color))
    .attr('stroke-width', (e) => (destacados && visible(e) ? 2.6 : 1.4))
    .attr('stroke-opacity', (e) => (!visible(e) ? 0 : destacados ? 0.9 : 0.4))
    .style('pointer-events', (e) => (visible(e) ? 'stroke' : 'none'));

  d3.select('#red .nodos').selectAll('g')
    .classed('elegido', (n) => n.id === elegido)
    .classed('atenuado', (n) => Boolean(destacados) && !destacados.has(n.id))
    .classed('destacado', (n) => Boolean(destacados) && destacados.has(n.id));

  if (!$('#vista-red').hidden) encuadrarRed(destacados);
}

function mostrarGlobo(ev, html) {
  const globo = $('#globo');
  globo.innerHTML = html;
  globo.hidden = false;
  const r = globo.getBoundingClientRect();
  globo.style.left = `${Math.min(ev.clientX + 12, innerWidth - r.width - 8)}px`;
  globo.style.top = `${Math.max(8, ev.clientY - r.height - 10)}px`;
}
function ocultarGlobo() { $('#globo').hidden = true; }

// ---------- Páginas de texto ----------

// Los textos viven en web/*.html, para poder editarlos sin tocar el código.
async function pintarPagina(pagina) {
  const art = document.getElementById(pagina);
  if (art.dataset.listo) return;
  art.dataset.listo = '1';
  try {
    const r = await fetch(PAGINAS[pagina]);
    if (!r.ok) throw new Error(r.status);
    art.innerHTML = await r.text();
    rellenarCifras(art);
  } catch (err) {
    delete art.dataset.listo;
    art.innerHTML = `<p>No se pudo cargar la página (${esc(err.message)}).</p>`;
  }
}

// Completa los <span data-cifra="…"> de las páginas de texto con cuentas hechas sobre los datos.
function rellenarCifras(art) {
  const ds = [...db.dialogos.values()];
  const cifras = {
    dialogos: ds.length,
    personas: db.personas.size,
    lugares: db.lugares.size,
    'con-fuentes': ds.filter((d) => d.fuentes?.length).length,
    'sin-fuentes': ds.filter((d) => !d.fuentes?.length).length,
    revisados: ds.filter((d) => d.revision === 'revisado').length,
    dudosos: ds.filter((d) => d.caso_dudoso).length,
  };
  for (const el of art.querySelectorAll('[data-cifra]')) el.textContent = cifras[el.dataset.cifra] ?? '—';
}

// ---------- Arranque ----------

async function arrancar() {
  try {
    const datos = await fetch('datos.json').then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
    indexar(datos);
  } catch (err) {
    $('#detalle').innerHTML = `<p>No se pudieron cargar los datos (${esc(err.message)}). Corré <code>npm run validar</code> y recargá.</p>`;
    return;
  }
  iniciarAviso();
  iniciarLista();
  iniciarMapa();
  iniciarRed();
  iniciarVistas();
  iniciarTiempo();
  addEventListener('hashchange', aplicarRuta);
  aplicarRuta();
}

arrancar();
