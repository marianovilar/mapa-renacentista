# Mapa renacentista

Visualización interactiva del Renacimiento europeo (siglos XIV–XVII): mapas políticos, figuras, obras clásicas redescubiertas y traducidas, y obras nuevas. La interfaz prevista tiene un mapa en el centro y la información en paneles laterales.

## Fase 1: diálogos latinos, de Petrarca a Erasmo

Una base de datos navegable de unos 30 diálogos latinos, del *Secretum* de Petrarca (desde 1347) a la última edición de los *Colloquia* de Erasmo (1533). Cada diálogo registra autor, destinatario, interlocutores, fecha y lugar de composición, ambientación y primera edición. Al hacer clic en cualquiera de esos datos se ven sus cruces con el resto.

- [`docs/esquema.md`](docs/esquema.md): cómo se cargan los datos.
- [`docs/corpus-candidatos.md`](docs/corpus-candidatos.md): lista de trabajo para elegir el corpus.
- [`data/`](data/): los datos (un YAML por diálogo, más `personas.yaml` y `lugares.yaml`).

## Validar los datos

Requiere [Node.js](https://nodejs.org/).

```bash
npm install
npm run validar
```

El script comprueba las referencias y las fechas, lista las personas que aparecen en más de un diálogo y genera `build/datos.json`, que usará la interfaz.
