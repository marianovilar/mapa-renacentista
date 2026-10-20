# Coordenadas renacentistas

Espacios navegables que conectan obras del Renacimiento europeo (siglos XIV–XVII) a través de sus personas, lugares, fechas y temas. El primero, en desarrollo, reúne los diálogos latinos de Petrarca a Erasmo; más adelante se sumarán otros espacios, por ejemplo de obras literarias o pictóricas.

**Sitio:** https://marianovilar.github.io/mapa-renacentista/

## Primer espacio: diálogos latinos, de Petrarca a Erasmo

Una base de datos navegable de 46 diálogos latinos, del *Secretum* de Petrarca (desde 1347) a la última edición de los *Colloquia* de Erasmo (1533). Cada diálogo registra autor, destinatario, interlocutores, evocados, fecha y lugar de composición, ambientación y primera edición. Al hacer clic en cualquiera de esos datos se ven sus cruces con el resto.

- [`docs/esquema.md`](docs/esquema.md): cómo se cargan los datos.
- [`docs/corpus-candidatos.md`](docs/corpus-candidatos.md): el corpus elegido y las decisiones tomadas.
- [`data/`](data/): los datos (un YAML por diálogo, más `personas.yaml` y `lugares.yaml`).
- [`web/`](web/): el sitio (HTML, CSS y JavaScript sin compilación; mapa con Leaflet y red de diálogos con d3).

## Corregir fichas

- **Editor en línea:** `https://marianovilar.github.io/mapa-renacentista/editor.html`. Se entra con un token personal de GitHub con permiso de escritura sobre este repositorio (la página explica cómo crearlo). Tiene una casilla para marcar la ficha como revisada, campos para el enlace al texto en línea, el resto del YAML para editar a mano y un buscador de ids. Valida con las mismas reglas que el sitio y, si no hay errores, guarda el cambio en GitHub y sigue la publicación.
- **Editor local:** doble clic en `editar-fichas.bat` (requiere Python y Node.js). Muestra las fichas en orden cronológico, valida los cambios y, si no hay errores, los publica (commit y push). Incluye un buscador de los ids de personas y lugares.
- **En GitHub:** editar el YAML con el lápiz y guardar. Si la validación falla, el sitio no se actualiza y el error aparece en la pestaña Actions.

## Trabajar en local

Requiere [Node.js](https://nodejs.org/).

```bash
npm install
npm run dev
```

Valida los datos y abre el sitio en http://localhost:4321. Después de editar un YAML, volvé a correr `npm run dev` (o `npm run validar`) y recargá la página.

- `npm run validar` comprueba referencias y fechas, lista los cruces y genera `build/datos.json`.
- `npm run construir` arma en `dist/` el sitio listo para publicar.

## Publicación

Cada vez que se sube algo a `main`, GitHub Actions valida los datos y publica el sitio en GitHub Pages (`.github/workflows/pages.yml`). Si la validación falla, el sitio no se actualiza.

## Créditos

Desarrollado por Mariano Vilar, integrante del proyecto UBACYT «El diálogo como género y como problema en la Modernidad Temprana (siglos XV a XVII): del diálogo con los antiguos a los encuentros con nuevas formas de alteridad cultural», con asistencia de Claude (Anthropic).
