// Editor de fichas en línea. Lee y guarda los YAML del repositorio con la API de GitHub,
// usando un token personal que solo tiene el administrador (nunca está en el código).
// Valida con las mismas reglas que el sitio (validacion.js) antes de guardar.
import { parse } from 'https://cdn.jsdelivr.net/npm/yaml@2.5.0/+esm';
import { validarDatos } from './validacion.js';

const REPO = 'marianovilar/mapa-renacentista';
const RAMA = 'main';
const API = `https://api.github.com/repos/${REPO}`;
const CLAVE_TOKEN = 'editor-token';
const ESPECIALES = [
  ['data/personas.yaml', 'Personas'],
  ['data/lugares.yaml', 'Lugares'],
];

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const estado = {
  token: null,
  datos: null,        // datos.json publicado: orden, títulos y contexto de validación
  personas: [], lugares: [], regiones: [],
  archivos: [],       // [{ ruta, id, titulo, anio, revisado }]
  actual: null,       // { ruta, sha, original }
};

// ---------- Almacenamiento del token (solo en este navegador, si se pidió) ----------
const guardado = {
  leer() { try { return localStorage.getItem(CLAVE_TOKEN) || sessionStorage.getItem(CLAVE_TOKEN); } catch { return null; } },
  escribir(t, recordar) {
    try { (recordar ? localStorage : sessionStorage).setItem(CLAVE_TOKEN, t); } catch { /* sin almacenamiento: vale para esta pestaña */ }
  },
  borrar() { try { localStorage.removeItem(CLAVE_TOKEN); sessionStorage.removeItem(CLAVE_TOKEN); } catch { /* nada */ } },
};

// ---------- API de GitHub ----------
async function gh(ruta, opciones = {}) {
  const r = await fetch(ruta.startsWith('http') ? ruta : `${API}${ruta}`, {
    ...opciones,
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${estado.token}`, ...(opciones.headers ?? {}) },
  });
  if (!r.ok) {
    const cuerpo = await r.json().catch(() => ({}));
    const e = new Error(cuerpo.message || `HTTP ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return r.json();
}

const deBase64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
function aBase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function leerArchivo(ruta) {
  const j = await gh(`/contents/${ruta}?ref=${RAMA}`);
  return { texto: deBase64(j.content), sha: j.sha };
}

// ---------- Acceso ----------
async function entrar(token, recordar) {
  estado.token = token;
  const repo = await gh('');
  if (!repo.permissions?.push) throw new Error('El token no tiene permiso de escritura en el repositorio.');
  if (recordar !== undefined) guardado.escribir(token, recordar);
  $('#acceso').hidden = true;
  $('#cuerpo').hidden = false;
  $('#salir').hidden = false;
  await cargarTodo();
}

$('#form-acceso').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const msj = $('#mensaje-acceso');
  msj.textContent = 'Comprobando…';
  try {
    await entrar($('#token').value.trim(), $('#recordar').checked);
    $('#token').value = '';
    msj.textContent = '';
  } catch (e) {
    estado.token = null;
    msj.textContent = e.status === 401 ? 'El token no es válido o venció.' : `No se pudo entrar: ${e.message}`;
  }
});

$('#salir').addEventListener('click', () => {
  if (hayCambios() && !confirm('Hay cambios sin guardar. ¿Salir igual?')) return;
  guardado.borrar();
  location.reload();
});

// ---------- Carga de la lista y del contexto ----------
async function cargarTodo() {
  mensaje('Cargando…', null, true);
  const [datos, arbol, ...especiales] = await Promise.all([
    fetch('datos.json', { cache: 'no-cache' }).then((r) => r.json()),
    gh(`/contents/data/dialogos?ref=${RAMA}`),
    leerArchivo('data/personas.yaml'),
    leerArchivo('data/lugares.yaml'),
    leerArchivo('data/regiones.yaml'),
  ]);
  estado.datos = datos;
  [estado.personas, estado.lugares, estado.regiones] = especiales.map((a) => parse(a.texto));
  const porId = new Map(datos.dialogos.map((d) => [d.id, d]));
  estado.archivos = arbol.filter((f) => f.name.endsWith('.yaml')).map((f) => {
    const id = f.name.slice(0, -5);
    const d = porId.get(id);
    return { ruta: f.path, id, titulo: d?.titulo ?? id, anio: d?.composicion?.fecha?.desde ?? 9999, autor: d?.autores?.[0] ?? '', revisado: d?.revision === 'revisado' };
  }).sort((a, b) => a.anio - b.anio || a.titulo.localeCompare(b.titulo));
  pintarLista();
  pintarIds();
  mensaje('Listo. Elegí una ficha a la izquierda.', 'ok', true);
}

function pintarLista() {
  const f = $('#filtro').value.trim().toLowerCase();
  const nombre = (id) => estado.personas.find((p) => p.id === id)?.nombre ?? id;
  const visibles = estado.archivos.filter((a) => !f || `${a.titulo} ${a.id} ${nombre(a.autor)}`.toLowerCase().includes(f));
  const revisadas = estado.archivos.filter((a) => a.revisado).length;
  $('#contador').textContent = `${revisadas}/${estado.archivos.length} revisadas`;
  $('#lista').innerHTML = visibles.map((a) => `<li data-ruta="${esc(a.ruta)}" class="${estado.actual?.ruta === a.ruta ? 'activo' : ''}">
      <span class="anio">${a.anio < 9999 ? a.anio : ''}</span><span class="tit"><i>${esc(a.titulo)}</i><br><span class="id">${esc(nombre(a.autor))}</span></span>${a.revisado ? '<span class="ok" title="Revisada">✓</span>' : ''}</li>`).join('')
    + (f ? '' : `<li class="grupo">Listas</li>${ESPECIALES.map(([ruta, n]) => `<li data-ruta="${ruta}" class="${estado.actual?.ruta === ruta ? 'activo' : ''}"><span class="tit">${n}</span></li>`).join('')}`);
}

function pintarIds() {
  const b = $('#busca-ids').value.trim().toLowerCase();
  const grupo = (titulo, lista) => {
    const items = lista.filter((x) => !b || `${x.id} ${x.nombre}`.toLowerCase().includes(b)).slice(0, b ? 200 : 400);
    return `<li class="grupo">${titulo}</li>` + items.map((x) => `<li data-id="${esc(x.id)}"><span class="tit">${esc(x.nombre)}<br><span class="id">${esc(x.id)}</span></span></li>`).join('');
  };
  $('#ids').innerHTML = grupo('Personas', estado.personas) + grupo('Lugares', estado.lugares);
}

$('#filtro').addEventListener('input', pintarLista);
$('#busca-ids').addEventListener('input', pintarIds);
$('#ids').addEventListener('click', async (ev) => {
  const li = ev.target.closest('li[data-id]');
  if (!li) return;
  try { await navigator.clipboard.writeText(li.dataset.id); mensaje(`Copiado: ${li.dataset.id}`, 'ok', true); } catch { mensaje(`id: ${li.dataset.id}`, null, true); }
});

// ---------- Abrir una ficha ----------
$('#lista').addEventListener('click', async (ev) => {
  const li = ev.target.closest('li[data-ruta]');
  if (!li || li.dataset.ruta === estado.actual?.ruta) return;
  if (hayCambios() && !confirm('La ficha abierta tiene cambios sin guardar. ¿Descartarlos y abrir otra?')) return;
  await abrir(li.dataset.ruta);
});

async function abrir(ruta) {
  mensaje('Abriendo…', null, true);
  const { texto, sha } = await leerArchivo(ruta);
  estado.actual = { ruta, sha, original: texto };
  const esDialogo = ruta.startsWith('data/dialogos/');
  $('#rotulo').innerHTML = esDialogo ? `<i>${esc(estado.archivos.find((a) => a.ruta === ruta)?.titulo ?? ruta)}</i>` : esc(ruta.split('/').pop());
  $('#ver-ficha').hidden = !esDialogo;
  if (esDialogo) $('#ver-ficha').href = `./#/dialogo/${ruta.split('/').pop().slice(0, -5)}`;
  $('#campos').hidden = !esDialogo;
  $('#rotulo-yaml').textContent = esDialogo ? 'Resto de la ficha (YAML)' : 'Contenido (YAML)';
  for (const id of ['#rotulo-yaml', '#yaml', '#botones']) $(id).hidden = false;
  $('#yaml').value = esDialogo ? quitarCampos(texto) : texto;
  if (esDialogo) {
    let d = {};
    try { d = parse(texto) ?? {}; } catch { /* el YAML se revisará al validar */ }
    $('#revisada').checked = d.revision === 'revisado';
    $('#texto-url').value = d.texto_en_linea?.url ?? '';
    $('#texto-desc').value = d.texto_en_linea?.descripcion ?? '';
  }
  // Punto de comparación para saber si hay cambios (con los campos ya aplicados).
  estado.actual.base = aplicarCampos($('#yaml').value);
  pintarLista();
  mensaje('', null, true);
}

// ---------- Campos de formulario ↔ texto YAML ----------
// La revisión y el texto en línea se editan con los campos de arriba; el área de texto muestra el resto.
const BLOQUE_TEXTO = /^texto_en_linea:.*\n(?:[ \t]+.*\n?)*\n?/m;
const quitarCampos = (texto) => texto.replace(/\r\n/g, '\n').replace(BLOQUE_TEXTO, '').replace(/\n*^revision:.*\n?/m, '\n').trimEnd() + '\n';

const comillas = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function aplicarCampos(texto) {
  if (!estado.actual?.ruta.startsWith('data/dialogos/')) return texto;
  let t = texto.replace(/\r\n/g, '\n');
  // Revisión: casilla → pendiente / revisado.
  const rev = `revision: ${$('#revisada').checked ? 'revisado' : 'pendiente'}`;
  t = /^revision:.*$/m.test(t) ? t.replace(/^revision:.*$/m, rev) : `${t.trimEnd()}\n\n${rev}\n`;
  // Texto en línea: se quita el bloque anterior y, si hay enlace, se escribe uno nuevo antes de las fuentes.
  t = t.replace(BLOQUE_TEXTO, '');
  const url = $('#texto-url').value.trim();
  if (url) {
    const bloque = `texto_en_linea:\n  url: ${comillas(url)}\n  descripcion: ${comillas($('#texto-desc').value.trim())}\n\n`;
    const ancla = ['fuentes:', 'ediciones:', 'bibliografia:', 'revision:'].map((k) => t.search(new RegExp(`^${k}`, 'm'))).find((i) => i >= 0);
    t = ancla >= 0 ? t.slice(0, ancla) + bloque + t.slice(ancla) : `${t.trimEnd()}\n\n${bloque}`;
  }
  return t.endsWith('\n') ? t : `${t}\n`;
}

function hayCambios() {
  if (!estado.actual) return false;
  return aplicarCampos($('#yaml').value) !== estado.actual.base;
}

// ---------- Validar ----------
function validar() {
  const ruta = estado.actual.ruta;
  const texto = aplicarCampos($('#yaml').value);
  let nuevo;
  try {
    nuevo = parse(texto);
  } catch (e) {
    mensaje('El YAML tiene un error de formato (revisá la sangría y las comillas):', 'error', true);
    mensaje(e.message.split('\n')[0], 'error');
    return null;
  }
  const archivo = ruta.split('/').pop();
  const ctx = {
    personas: ruta === 'data/personas.yaml' ? nuevo : estado.personas,
    lugares: ruta === 'data/lugares.yaml' ? nuevo : estado.lugares,
    regiones: estado.regiones,
    dialogos: estado.datos.dialogos.map((d) => ({ archivo: `${d.id}.yaml`, ...d })),
  };
  if (ruta.startsWith('data/dialogos/')) {
    ctx.dialogos = ctx.dialogos.filter((d) => d.archivo !== archivo);
    ctx.dialogos.push({ archivo, ...(nuevo ?? {}) });
  } else if (!Array.isArray(nuevo)) {
    mensaje('La lista debe empezar cada entrada con «- id: …».', 'error', true);
    return null;
  }
  const { errores, avisos } = validarDatos(ctx);
  const propio = (m) => (ruta.startsWith('data/dialogos/') ? m.startsWith(archivo) : true);
  const errs = errores.filter(propio);
  mensaje('', null, true);
  if (errs.length) {
    mensaje('Hay errores; corregilos antes de guardar:', 'error');
    for (const e of errs) mensaje(`✗ ${e}`, 'error');
    if (errs.some((e) => e.includes('inexistente'))) mensaje('Los ids de personas y lugares están en el buscador de la derecha.', 'aviso');
    return null;
  }
  mensaje('Sin errores.', 'ok');
  for (const a of avisos.filter((m) => m.startsWith(archivo))) mensaje(`Aviso (no impide guardar): ${a}`, 'aviso');
  return texto;
}

$('#validar').addEventListener('click', () => estado.actual && validar());

// ---------- Guardar y publicar ----------
$('#guardar').addEventListener('click', async () => {
  if (!estado.actual) return;
  if (!hayCambios()) { mensaje('No hay cambios para guardar.', null, true); return; }
  const texto = validar();
  if (texto == null) return;
  const titulo = estado.archivos.find((a) => a.ruta === estado.actual.ruta)?.titulo ?? estado.actual.ruta.split('/').pop();
  const msg = prompt('Mensaje que describe el cambio:', `Corrección: ${titulo}`);
  if (!msg) return;
  const boton = $('#guardar');
  boton.disabled = true;
  try {
    const r = await gh(`/contents/${estado.actual.ruta}`, {
      method: 'PUT',
      body: JSON.stringify({ message: msg, content: aBase64(texto), sha: estado.actual.sha, branch: RAMA }),
    });
    estado.actual.sha = r.content.sha;
    estado.actual.original = texto;
    estado.actual.base = texto;
    const a = estado.archivos.find((x) => x.ruta === estado.actual.ruta);
    if (a) { a.revisado = /^revision:\s*revisado/m.test(texto); pintarLista(); }
    mensaje('Guardado en GitHub. Publicando el sitio…', 'ok');
    seguirPublicacion(r.commit.sha);
  } catch (e) {
    if (e.status === 409 || e.status === 422) mensaje('La ficha cambió en GitHub desde que la abriste (quizás la editaste desde otro lado). Copiá tus cambios, volvé a abrirla y aplicalos de nuevo.', 'error');
    else mensaje(`No se pudo guardar: ${e.message}`, 'error');
  } finally {
    boton.disabled = false;
  }
});

// Consulta el estado de la publicación (GitHub Actions) del commit recién hecho.
async function seguirPublicacion(sha) {
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    try {
      const j = await fetch(`${API}/actions/runs?head_sha=${sha}`, { cache: 'no-store' }).then((r) => r.json());
      const run = j.workflow_runs?.[0];
      if (run?.status === 'completed') {
        if (run.conclusion === 'success') mensaje('Publicado: el cambio ya se ve en el sitio.', 'ok');
        else mensaje(`La publicación falló; el sitio sigue con la versión anterior. Detalle: ${run.html_url}`, 'error');
        return;
      }
    } catch { /* se reintenta */ }
  }
  mensaje('La publicación está tardando; revisá la pestaña Actions del repositorio.', 'aviso');
}

$('#descartar').addEventListener('click', async () => {
  if (!estado.actual) return;
  const ruta = estado.actual.ruta;
  estado.actual = null;
  await abrir(ruta);
  mensaje('Cambios descartados.', null, true);
});

window.addEventListener('beforeunload', (ev) => { if (hayCambios()) { ev.preventDefault(); ev.returnValue = ''; } });
$('#yaml').addEventListener('keydown', (ev) => {
  if (ev.key !== 'Tab') return;
  ev.preventDefault();
  const t = ev.target;
  const [i, f] = [t.selectionStart, t.selectionEnd];
  t.value = t.value.slice(0, i) + '  ' + t.value.slice(f);
  t.selectionStart = t.selectionEnd = i + 2;
});

// ---------- Mensajes ----------
function mensaje(texto, clase, limpiar = false) {
  const caja = $('#mensajes');
  if (limpiar) caja.innerHTML = '';
  if (texto) caja.insertAdjacentHTML('beforeend', `<p class="${clase ?? ''}">${esc(texto)}</p>`);
}

// ---------- Arranque: si hay un token recordado, se entra directamente ----------
const previo = guardado.leer();
if (previo) {
  entrar(previo).catch(() => { guardado.borrar(); estado.token = null; $('#mensaje-acceso').textContent = 'El token guardado ya no es válido; ingresalo de nuevo.'; });
}
