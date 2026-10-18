# Esquema de datos — Fase 1: diálogos latinos

Este documento fija cómo se cargan los datos. Si un caso no encaja, se discute y se ajusta el esquema **antes** de forzar el dato.

## Alcance de la fase 1

- **Género:** diálogos en prosa latina (incluye coloquios, *convivia* y diálogos narrados).
- **Período:** del *Secretum* de Petrarca (redacción desde 1347) a la última edición de los *Colloquia* revisada por Erasmo (Basilea, Froben, 1533).
- **Tamaño:** 46 diálogos. No se busca exhaustividad.
- **Casos dudosos:** se incluyen con `caso_dudoso: true` y el motivo explicado (por ejemplo, *Utopia*, dialogada solo en el libro I).

## Archivos

```
data/
  dialogos/<id>.yaml   un archivo por diálogo
  personas.yaml        autores, destinatarios y personajes (una sola lista)
  lugares.yaml         ciudades y sitios, con coordenadas
```

Cada entidad tiene un `id` corto en minúsculas y con guiones (`bruni`, `petrarca-secretum`). Las relaciones se escriben con esos `id`.

## Fechas

Siempre como **rango**, porque muchas obras no tienen datación precisa:

```yaml
fecha:
  desde: 1401
  hasta: 1406
  certeza: probable      # segura | probable | conjetural
  nota: "Libro I hacia 1401; libro II posterior (debate Baron)."
```

Para un año exacto, `desde` y `hasta` coinciden. Por convención se usan años enteros. Si hiciera falta precisar el mes, va en `nota`.

En cada diálogo se distinguen tres fechas:

| Campo | Qué es |
|---|---|
| `composicion.fecha` | cuándo se escribió |
| `ambientacion.fecha` | cuándo transcurre la conversación (fecha dramática) |
| `primera_edicion.fecha` | primera impresión, si la hubo |

## Personas y roles

Una sola lista `personas.yaml` para todos, porque una misma persona puede ser autor en un diálogo, personaje en otro y destinatario en un tercero.

```yaml
- id: salutati
  nombre: Coluccio Salutati
  nombre_latino: Colucius Salutatus
  nacimiento: 1331
  muerte: 1406
  tipo: histórica          # histórica | ficticia | alegórica | mitológica | divina
  sexo: masculino          # masculino | femenino (para alegorías, el de la personificación)
  wikidata: Q93113
```

En el diálogo, cada persona aparece con su **rol**:

| Campo | Rol |
|---|---|
| `autores` | quien escribe |
| `destinatarios` | a quien se dedica o dirige la obra (dedicatoria, carta prefatoria, apóstrofe) |
| `interlocutores` | quienes hablan en el diálogo |
| `evocados` | quienes no hablan pero tienen un papel central: el homenajeado, el ausente que aparece bajo una máscara, el muerto recordado |

Destinatarios e interlocutores admiten detalles:

```yaml
destinatarios:
  - persona: vergerio
    forma: dedicatoria     # dedicatoria | carta-prefatoria | apóstrofe
interlocutores:
  - persona: petrarca
    nombre_en_el_texto: Franciscus
    nota: "El autor como personaje."
```

`nombre_en_el_texto` registra cómo aparece la persona en la obra (Franciscus, Morus) sin duplicar a la persona.

## Lugares

```yaml
- id: florencia
  nombre: Florencia
  nombre_latino: Florentia
  lat: 43.7696
  lon: 11.2558
  wikidata: null
```

En cada diálogo se distinguen:

- `composicion.lugares`: dónde se escribió. Es una lista, porque hay obras redactadas en varios sitios.
- `ambientacion.lugar`: dónde transcurre la conversación.
- `primera_edicion.lugar`: dónde se imprimió.

## Forma del diálogo

Campos que siguen la propuesta de Elena Bilancia para una base de diálogos («Giudicare i libri dalla copertina», *Umanistica Digitale*, 16, 2023): cómo se presenta la obra, cómo se organizan las voces y dónde transcurre.

| Campo | Qué registra | Valores |
|---|---|---|
| `denominacion` | la palabra genérica que usa el título o el frontispicio | texto libre en latín: `dialogus`, `disputatio`, `commentarium`… Se omite si el título no trae ninguna |
| `modo` | cómo llegan las palabras de los personajes | `mimético` (hablan directamente, con sus nombres al margen), `diegético` (un narrador refiere la conversación) o `mixto` |
| `relacion_interlocutores` | cómo se reparte la autoridad entre las voces | `jerárquica` (maestro y discípulo, quien sabe y quien aprende), `entre pares` o `mixta` |
| `ambientacion.espacio` | el tipo de escena | `corte`, `curia`, `academia`, `casa privada`, `villa`, `jardín`, `monasterio`, `taller`, `espacio urbano`, `paraje natural`, `visión`, `más allá` o `indeterminado` |

`forma` sigue indicando el subgénero (diálogo, coloquio, *convivium*); que la conversación sea narrada va ahora en `modo`.

## Redacciones y obras vinculadas

- **Revisión de la misma obra:** si cambian la fecha o el lugar pero no el reparto, va en la misma ficha, en `redacciones`. Es una lista en la que cada entrada repite los campos que cambian (por ejemplo, las revisiones de *De vero falsoque bono*).
- **Reelaboración:** si cambian los interlocutores, la versión nueva tiene su propia ficha y las dos se vinculan con `relaciones`. Es el caso de Valla, *De voluptate* (1431) y *De vero bono* (1433).

```yaml
relaciones:
  - dialogo: valla-de-vero-bono
    tipo: reelaborada-en      # reelaboracion-de | reelaborada-en | parte-de | contiene | serie
```

`serie` vincula obras hermanas con fichas propias, como los tres libros del *Idiota* de Cusa. `parte-de` y `contiene` quedan para las obras divididas en fichas, como las seis etapas de los *Colloquia*.

Si falta un dato y no se puede completar todavía, el campo queda vacío y se explica en una nota hermana: `nota_destinatarios`, `nota_interlocutores`.

## Control de calidad

- `revision: pendiente | revisado`. Todo lo cargado de forma provisional queda `pendiente` hasta que alguien lo coteje con la bibliografía.
- `fuentes`: referencias que respaldan las fechas y los datos.
- `ediciones`: ediciones modernas y traducciones. Cada una lleva `tipo` (`edición` | `edición y traducción` | `traducción`), `lengua` (la del texto si es edición, la de llegada si hay traducción), `referencia`, `anio` y, si está en la biblioteca de Zotero, `zotero` (la clave del ítem). Las que no se pudieron comprobar llevan `verificado: false`. `nota_ediciones` explica las ausencias.
- `texto_en_linea`: un único enlace al texto del diálogo en acceso abierto, con `url` y `descripcion` (qué edición es y en qué repositorio). Se prefiere, en este orden: una edición moderna libre de derechos, un texto transcrito y el facsímil de una edición antigua; y se comprueba que se vea completo desde la Argentina. Si no hay ninguno, el campo se omite.
- `bibliografia`: estudios pertinentes identificados en la biblioteca de Zotero por sus metadatos, no necesariamente leídos. A diferencia de `fuentes`, no respaldan los datos de la ficha. Cada entrada tiene `referencia` y `zotero`.
- Ambos campos se cargan con `scripts/cargar-ediciones.py`, que arma las referencias a partir de `build/zotero.csv`.
- `npm run validar` comprueba que los `id` referidos existan, que las fechas tengan sentido y que no falten campos obligatorios.

## Campos de un diálogo (resumen)

| Campo | Obligatorio | Tipo |
|---|---|---|
| `id` | sí | texto |
| `titulo` | sí | título breve usual |
| `titulo_completo` | no | título completo latino |
| `lengua` | sí | `latín` en esta fase |
| `autores` | sí | lista de `id` de persona |
| `destinatarios` | no | lista (ver arriba) |
| `interlocutores` | sí | lista (ver arriba) |
| `evocados` | no | lista de `persona` y `nota` |
| `composicion` | sí | `fecha` y `lugares` |
| `ambientacion` | no | `fecha`, `lugar` y `espacio` |
| `primera_edicion` | no | `fecha`, `lugar`, `impresor` |
| `redacciones` | no | lista |
| `relaciones` | no | lista de `dialogo` y `tipo` |
| `forma` | no | `diálogo` \| `coloquio` \| `convivium` \| `diálogo narrado` \| `mixta` |
| `libros` | no | número de libros |
| `temas` | no | etiquetas libres |
| `caso_dudoso` | no | `true` y `motivo_duda` |
| `resumen` | no | dos o tres líneas |
| `fuentes` | no | lista de referencias |
| `ediciones` | no | lista de `tipo`, `lengua`, `referencia`, `anio`, `zotero`, `nota`, `verificado` |
| `texto_en_linea` | no | `url` y `descripcion` |
| `bibliografia` | no | lista de `referencia` y `zotero` |
| `revision` | sí | `pendiente` \| `revisado` |
