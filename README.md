# Mapa renacentista

Visualización interactiva del Renacimiento europeo (siglos XIV–XVII): mapas políticos, figuras, obras clásicas redescubiertas y traducidas, y obras nuevas. La interfaz tiene un mapa en el centro y la información en paneles laterales.

**Sitio:** https://marianovilar.github.io/mapa-renacentista/

## Fase 1: diálogos latinos, de Petrarca a Erasmo

Una base de datos navegable de 38 diálogos latinos, del *Secretum* de Petrarca (desde 1347) a la última edición de los *Colloquia* de Erasmo (1533). Cada diálogo registra autor, destinatario, interlocutores, evocados, fecha y lugar de composición, ambientación y primera edición. Al hacer clic en cualquiera de esos datos se ven sus cruces con el resto.

- [`docs/esquema.md`](docs/esquema.md): cómo se cargan los datos.
- [`docs/corpus-candidatos.md`](docs/corpus-candidatos.md): el corpus elegido y las decisiones tomadas.
- [`data/`](data/): los datos (un YAML por diálogo, más `personas.yaml` y `lugares.yaml`).
- [`web/`](web/): el sitio (HTML, CSS y JavaScript sin compilación; mapa con Leaflet).

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
