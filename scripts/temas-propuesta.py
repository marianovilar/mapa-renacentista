"""Propuesta de vocabulario controlado de temas y su asignación a los diálogos.

Uso: python scripts/temas-propuesta.py      -> escribe docs/vocabulario-temas.md
Cuando la propuesta esté aprobada, este mismo archivo servirá para aplicarla a las fichas.
"""
import os
from collections import defaultdict

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# grupo -> [(tema, definición)]
VOCABULARIO = {
    'Ética y felicidad': [
        ('felicidad y sumo bien', 'En qué consiste la vida feliz y cuál es el bien supremo.'),
        ('placer y epicureísmo', 'La voluptas, Epicuro y Lucrecio, y su recepción cristiana.'),
        ('estoicismo y virtud', 'La honestas, la virtud estoica y la crítica de las pasiones.'),
        ('fortuna', 'Los vaivenes de la fortuna y cómo enfrentarlos.'),
        ('virtudes y vicios', 'Examen moral de vicios concretos: avaricia, ingratitud, vanidad, envidia.'),
        ('riqueza y pobreza', 'El dinero, la propiedad y su valor moral y civil.'),
        ('nobleza', 'Si la nobleza procede de la virtud o del linaje y la riqueza.'),
        ('vida activa y contemplativa', 'La vida pública o de negocios frente al retiro, el estudio y la contemplación.'),
    ],
    'Amor, muerte y condición humana': [
        ('amor', 'El amor humano y divino, de Laura al amor platónico.'),
        ('matrimonio y mujeres', 'El matrimonio, la familia y el lugar de las mujeres.'),
        ('muerte, duelo y consolación', 'La pérdida, el duelo y la escritura consolatoria.'),
        ('miseria y dignidad del hombre', 'La condición humana entre la desdicha y la excelencia.'),
        ('alma e inmortalidad', 'La naturaleza del alma y su destino.'),
    ],
    'Religión': [
        ('fe y filosofía', 'Relación entre teología cristiana y saber filosófico o pagano.'),
        ('libre albedrío', 'Voluntad humana, presciencia divina, gracia y astrología.'),
        ('vida religiosa y conversión', 'Los votos, la vida monástica y laica, la conversión y el examen de conciencia.'),
        ('crítica del clero', 'Sátira o censura de clérigos, frailes y órdenes religiosas.'),
        ('papado y curia', 'El papado, la corte papal y su burocracia.'),
        ('concordia religiosa', 'Diálogo y unidad entre credos y confesiones.'),
    ],
    'Política y sociedad': [
        ('república y libertad', 'La libertad civil, la república y el buen ciudadano.'),
        ('príncipes y tiranía', 'El poder personal, el consejo al príncipe y la tiranía.'),
        ('Florencia y los Médici', 'La ciudad, su elogio y la hegemonía medicea.'),
        ('guerra y paz', 'La guerra, las conjuras y la paz entre estados y cristianos.'),
        ('derecho y leyes', 'La naturaleza de la ley, el derecho natural y la jurisprudencia.'),
    ],
    'Letras y saberes': [
        ('antiguos y modernos', 'La comparación entre la Antigüedad y los contemporáneos.'),
        ('lengua latina y estilo', 'El latín, la imitación, el ciceronianismo y el estilo.'),
        ('poesía y poética', 'La poesía, los poetas y su interpretación.'),
        ('retórica y dialéctica', 'La elocuencia, la disputa y la crítica de la lógica escolástica.'),
        ('historia e historiografía', 'La escritura de la historia y la memoria de los hombres ilustres.'),
        ('educación y studia humanitatis', 'La enseñanza, la defensa de las letras y el saber del laico.'),
        ('fortuna de los letrados', 'La condición, el mecenazgo y las desgracias de los humanistas.'),
        ('conocimiento y docta ignorancia', 'Los límites y los modos del conocer.'),
        ('filosofía natural y medicina', 'La naturaleza, la medida, la experiencia y la medicina.'),
        ('Platón y platonismo', 'La recepción de Platón y del neoplatonismo.'),
        ('Aristóteles y aristotelismo', 'La autoridad de Aristóteles, los peripatéticos y su lectura escolástica o humanista.'),
    ],
    'Formas y ámbitos': [
        ('sátira lucianesca', 'La risa, la parodia y los modelos de Luciano.'),
        ('banquete', 'La conversación de sobremesa o el convite como escena.'),
        ('academia', 'Los círculos letrados y sus reuniones como escena.'),
        ('viajes', 'Relatos de viaje y mundos lejanos.'),
    ],
}

ASIGNACION = {
    'accolti-de-praestantia': ['antiguos y modernos', 'historia e historiografía', 'fortuna de los letrados'],
    'alberti-intercenales': ['sátira lucianesca', 'virtudes y vicios', 'fortuna', 'matrimonio y mujeres', 'fortuna de los letrados'],
    'alberti-pontifex': ['papado y curia', 'crítica del clero', 'virtudes y vicios'],
    'bembo-de-aetna': ['filosofía natural y medicina', 'viajes', 'lengua latina y estilo'],
    'brandolini-de-humanae-vitae-conditione': ['miseria y dignidad del hombre', 'muerte, duelo y consolación'],
    'bruni-dialogi': ['antiguos y modernos', 'poesía y poética', 'retórica y dialéctica', 'Florencia y los Médici', 'república y libertad', 'Aristóteles y aristotelismo'],
    'conversini-consolatorio': ['muerte, duelo y consolación', 'fe y filosofía'],
    'conversini-dialogus-litera': ['vida religiosa y conversión', 'estoicismo y virtud', 'fortuna', 'fortuna de los letrados'],
    'conversini-dragmalogia': ['vida activa y contemplativa', 'república y libertad', 'príncipes y tiranía', 'virtudes y vicios', 'vida religiosa y conversión'],
    'cortesi-de-hominibus-doctis': ['historia e historiografía', 'lengua latina y estilo', 'fortuna de los letrados', 'antiguos y modernos'],
    'cusa-de-pace-fidei': ['concordia religiosa', 'fe y filosofía', 'guerra y paz'],
    'cusa-idiota-de-mente': ['conocimiento y docta ignorancia', 'miseria y dignidad del hombre', 'alma e inmortalidad', 'Platón y platonismo', 'Aristóteles y aristotelismo'],
    'cusa-idiota-de-sapientia': ['conocimiento y docta ignorancia', 'fe y filosofía', 'educación y studia humanitatis'],
    'cusa-idiota-de-staticis': ['filosofía natural y medicina', 'conocimiento y docta ignorancia'],
    'erasmo-antibarbari': ['educación y studia humanitatis', 'antiguos y modernos', 'fe y filosofía'],
    'erasmo-ciceronianus': ['lengua latina y estilo', 'retórica y dialéctica', 'fe y filosofía'],
    'erasmo-colloquia': ['sátira lucianesca', 'crítica del clero', 'matrimonio y mujeres', 'educación y studia humanitatis', 'placer y epicureísmo', 'guerra y paz'],
    'erasmo-iulius-exclusus': ['sátira lucianesca', 'papado y curia', 'guerra y paz', 'príncipes y tiranía'],
    'facio-de-vitae-felicitate': ['felicidad y sumo bien', 'vida activa y contemplativa', 'placer y epicureísmo', 'nobleza'],
    'ficino-de-amore': ['amor', 'Platón y platonismo', 'alma e inmortalidad', 'banquete', 'academia', 'poesía y poética'],
    'filelfo-de-exilio': ['Florencia y los Médici', 'riqueza y pobreza', 'placer y epicureísmo', 'república y libertad'],
    'hutten-vadiscus': ['papado y curia', 'crítica del clero', 'sátira lucianesca'],
    'landino-disputationes-camaldulenses': ['vida activa y contemplativa', 'felicidad y sumo bien', 'poesía y poética', 'Platón y platonismo', 'academia'],
    'lapo-de-curiae-commodis': ['papado y curia', 'sátira lucianesca', 'riqueza y pobreza'],
    'manetti-dialogus-consolatorius': ['muerte, duelo y consolación', 'estoicismo y virtud', 'vida religiosa y conversión', 'Aristóteles y aristotelismo'],
    'manetti-dialogus-in-symposio': ['banquete', 'amor', 'derecho y leyes', 'filosofía natural y medicina'],
    'moro-utopia': ['república y libertad', 'príncipes y tiranía', 'riqueza y pobreza', 'placer y epicureísmo', 'viajes', 'sátira lucianesca'],
    'petrarca-de-remediis': ['fortuna', 'estoicismo y virtud', 'muerte, duelo y consolación', 'virtudes y vicios'],
    'petrarca-secretum': ['vida religiosa y conversión', 'amor', 'fe y filosofía', 'libre albedrío', 'poesía y poética', 'fortuna de los letrados'],
    'platina-de-optimo-cive': ['república y libertad', 'Florencia y los Médici', 'príncipes y tiranía'],
    'poggio-de-avaritia': ['riqueza y pobreza', 'virtudes y vicios', 'crítica del clero', 'papado y curia', 'banquete'],
    'poggio-de-infelicitate-principum': ['príncipes y tiranía', 'felicidad y sumo bien', 'vida activa y contemplativa', 'fortuna de los letrados', 'Florencia y los Médici'],
    'poggio-de-nobilitate': ['nobleza', 'riqueza y pobreza', 'virtudes y vicios', 'Florencia y los Médici'],
    'poggio-de-varietate-fortunae': ['fortuna', 'historia e historiografía', 'antiguos y modernos', 'viajes', 'guerra y paz'],
    'poggio-historia-tripartita': ['banquete', 'lengua latina y estilo', 'derecho y leyes', 'filosofía natural y medicina'],
    'pontano-actius': ['poesía y poética', 'historia e historiografía', 'retórica y dialéctica', 'academia'],
    'pontano-aegidius': ['fe y filosofía', 'alma e inmortalidad', 'libre albedrío', 'retórica y dialéctica', 'muerte, duelo y consolación', 'academia'],
    'pontano-antonius': ['academia', 'poesía y poética', 'lengua latina y estilo', 'antiguos y modernos', 'fortuna de los letrados'],
    'pontano-asinus': ['sátira lucianesca', 'virtudes y vicios', 'guerra y paz', 'príncipes y tiranía'],
    'pontano-charon': ['sátira lucianesca', 'virtudes y vicios', 'crítica del clero', 'muerte, duelo y consolación'],
    'rinuccini-de-libertate': ['república y libertad', 'príncipes y tiranía', 'Florencia y los Médici', 'vida activa y contemplativa'],
    'scala-de-legibus-et-iudiciis': ['derecho y leyes', 'Florencia y los Médici', 'placer y epicureísmo', 'Platón y platonismo'],
    'scala-dialogus-de-consolatione': ['muerte, duelo y consolación', 'miseria y dignidad del hombre', 'estoicismo y virtud', 'Florencia y los Médici'],
    'valeriano-de-litteratorum-infelicitate': ['fortuna de los letrados', 'historia e historiografía', 'guerra y paz'],
    'valla-apologus': ['lengua latina y estilo', 'sátira lucianesca'],
    'valla-de-libero-arbitrio': ['libre albedrío', 'fe y filosofía', 'conocimiento y docta ignorancia'],
    'valla-de-professione-religiosorum': ['vida religiosa y conversión', 'crítica del clero', 'lengua latina y estilo'],
    'valla-de-vero-bono': ['felicidad y sumo bien', 'placer y epicureísmo', 'estoicismo y virtud', 'retórica y dialéctica', 'fe y filosofía'],
    'valla-de-voluptate': ['felicidad y sumo bien', 'placer y epicureísmo', 'estoicismo y virtud', 'retórica y dialéctica', 'fe y filosofía'],
    'zabarella-de-felicitate': ['felicidad y sumo bien', 'placer y epicureísmo', 'virtudes y vicios', 'riqueza y pobreza', 'Aristóteles y aristotelismo'],
}

if __name__ == '__main__':
    temas = {t for g in VOCABULARIO.values() for t, _ in g}
    uso = defaultdict(list)
    for d, ts in ASIGNACION.items():
        for t in ts:
            assert t in temas, (d, t)
            uso[t].append(d)
    titulos = {}
    import re
    for f in os.listdir(os.path.join(RAIZ, 'data', 'dialogos')):
        s = open(os.path.join(RAIZ, 'data', 'dialogos', f), encoding='utf-8').read()
        titulos[f[:-5]] = re.search(r'^titulo: (.*)$', s, re.M).group(1)
    autor = lambda d: d.split('-')[0].capitalize()
    out = ['# Vocabulario controlado de temas (propuesta)', '',
           f'{len(temas)} temas en {len(VOCABULARIO)} grupos, asignados a los {len(ASIGNACION)} diálogos (entre 2 y 6 por diálogo). '
           'Los temas actuales, libres y casi siempre únicos, pasarían a un campo aparte de detalle (`detalles`), que se sigue mostrando en la ficha pero no sirve para conectar.', '',
           'Entre paréntesis, la cantidad de diálogos de la base que lo tendrían.', '']
    for g, items in VOCABULARIO.items():
        out.append(f'## {g}')
        out.append('')
        for t, defi in items:
            ds = uso[t]
            out.append(f'- **{t}** ({len(ds)}). {defi} — ' + '; '.join(f'{autor(d)}, *{titulos[d]}*' for d in sorted(ds)))
        out.append('')
    sueltos = [t for t in temas if len(uso[t]) < 2]
    if sueltos:
        out.append('Temas con un solo diálogo por ahora (se mantienen pensando en la ampliación del corpus): ' + ', '.join(sorted(sueltos)) + '.')
        out.append('')
    open(os.path.join(RAIZ, 'docs', 'vocabulario-temas.md'), 'w', encoding='utf-8').write('\n'.join(out))
    print('ok', len(temas), 'temas;', ', '.join(f'{t}={len(uso[t])}' for t in sorted(temas, key=lambda t: -len(uso[t]))[:8]))
