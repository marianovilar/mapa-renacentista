"""Agrega a las fichas los campos `ediciones` y `bibliografia` a partir de build/zotero.csv.

Uso: python scripts/cargar-ediciones.py
Las referencias con clave de Zotero se arman con los metadatos de la exportación; las que no
están en Zotero se cargan a mano y quedan marcadas `verificado: false`.
Vuelve a escribir los dos campos en cada ficha listada (los reemplaza si ya existían).
"""
import csv, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
csv.field_size_limit(10**9)
with open(os.path.join(RAIZ, 'build', 'zotero.csv'), encoding='utf-8-sig') as f:
    Z = {r['Key']: r for r in csv.DictReader(f)}

TIPOS = {'edición', 'edición y traducción', 'traducción'}


def nombres(s):
    """'Apellido, Nombre; Apellido2, Nombre2' -> 'Nombre Apellido y Nombre2 Apellido2'."""
    out = []
    for n in [x.strip() for x in s.split(';') if x.strip()]:
        if ',' in n:
            ap, no = [p.strip() for p in n.split(',', 1)]
            out.append(f'{no} {ap}'.strip() if no else ap)
        else:
            out.append(n)
    return ', '.join(out[:-1]) + (' y ' if len(out) > 1 else '') + out[-1] if out else ''


def limpiar(t):
    t = re.sub(r'<[^>]+>', '', t or '')
    return re.sub(r'\s+', ' ', t).strip().rstrip('.')


def referencia(clave):
    r = Z[clave]
    tipo = r['Item Type']
    autor = nombres(r['Author'])
    titulo = limpiar(r['Title'])
    pub = limpiar(r['Publication Title'])
    ed = nombres(r['Editor'])
    tr = nombres(r['Translator'])
    anio = r['Publication Year'] or 's. f.'
    lugar = ', '.join(x for x in [limpiar(r['Place']), limpiar(r['Publisher'])] if x)
    partes = []
    if autor:
        partes.append(autor)
    if tipo in ('journalArticle', 'bookSection', 'magazineArticle', 'webpage'):
        partes.append(f'«{titulo}»')
    else:
        partes.append(titulo)
    if tipo == 'bookSection':
        partes.append(f'en {pub}' + (f', ed. {ed}' if ed else ''))
    elif tipo == 'journalArticle':
        vol = r['Volume'] + (f', {r["Issue"]}' if r['Issue'] not in ('', '0') else '')
        partes.append(f'{pub} {vol}'.strip())
    else:
        if ed:
            partes.append(f'ed. {ed}')
    if tr:
        partes.append(f'trad. {tr}')
    if tipo == 'thesis':
        partes.append('tesis' + (f', {limpiar(r["Publisher"])}' if r['Publisher'] else ''))
    elif lugar and tipo not in ('journalArticle',):
        partes.append(lugar)
    texto = ', '.join(p for p in partes if p)
    texto += f' ({anio})' if tipo == 'journalArticle' else f', {anio}'
    if r['Pages'] and tipo in ('journalArticle', 'bookSection'):
        texto += f', {r["Pages"]}'
    return texto.replace(' ,', ',').replace(' :', ':') + '.'


def q(s):
    return '"' + str(s).replace('\\', '\\\\').replace('"', '\\"') + '"'


# ---------- Datos ----------
# ediciones: (clave_zotero | None, tipo, lengua, nota) ; si clave es None, la tupla lleva además la referencia
# como quinto elemento y queda verificado: false.
def zed(clave, tipo, lengua, nota=None):
    return {'zotero': clave, 'tipo': tipo, 'lengua': lengua, 'nota': nota}


def man(ref, anio, tipo, lengua, nota=None):
    return {'ref': ref, 'anio': anio, 'tipo': tipo, 'lengua': lengua, 'nota': nota, 'verificado': False}


PROSATORI = man('Eugenio Garin (ed.), Prosatori latini del Quattrocento, Milán-Nápoles, Ricciardi, 1952', 1952,
                'edición y traducción', 'italiano', 'Antología con traducción italiana; incluye pasajes de este diálogo. Contenido por verificar.')

D = {
 'valla-de-voluptate': {
   'nota_ediciones': 'Las ediciones y traducciones modernas reproducen en general la redacción final (De vero bono): ver esa ficha. La de Lorch (1970) da en apéndice el comienzo de la primera redacción.',
   'ediciones': [zed('VWZZXUVD', 'edición', 'latín', 'Edición crítica de la redacción final, con el comienzo de la primera en apéndice.')],
   'bib': ['AJVXCD6V', '29KZANGX', 'DFVT7MM6', '3C34R7AK', 'Q8TH4FS7', '4UW8KQ9F', 'RC79U792', 'KSKFV3HC'],
 },
 'valla-de-vero-bono': {
   'ediciones': [
     zed('VWZZXUVD', 'edición', 'latín', 'Edición crítica.'),
     zed('TKPK6WBP', 'edición y traducción', 'inglés', 'Con el título De voluptate / On Pleasure; texto latino de la edición de Lorch.'),
     man('Lorenzo Valla, Von der Lust oder Vom wahren Guten / De voluptate sive De vero bono, ed. y trad. Peter Michael Schenkel, introd. Eckhard Keßler, Múnich, Wilhelm Fink, 2004', 2004, 'edición y traducción', 'alemán', 'Ya citada entre las fuentes.'),
     zed('M6BEE5SC', 'traducción', 'español'),
   ],
   'bib': ['C46VXK9X', 'HCJMEH7X', 'AIPGUTBC', 'QZUQPNCU', 'ITHQECFM', 'CK5VUGGH', 'K7HJW83K', 'EMZ22DI9', 'ISNI9WWK', 'QJ5RU6R7', 'RMLLJK8F', '4UW8KQ9F', 'WZVKQRMT'],
 },
 'valla-de-libero-arbitrio': {
   'ediciones': [
     zed('SDD7V536', 'edición', 'latín', 'Edición crítica.'),
     zed('HLWFHH7C', 'traducción', 'italiano'),
     zed('47AXXJK6', 'traducción', 'francés'),
     zed('PXVJVXCY', 'edición y traducción', 'alemán'),
     man('Lorenzo Valla, «Dialogue on Free Will», trad. Charles Trinkaus, en E. Cassirer, P. O. Kristeller y J. H. Randall (eds.), The Renaissance Philosophy of Man, Chicago, University of Chicago Press, 1948', 1948, 'traducción', 'inglés'),
     zed('A2TC6E2G', 'traducción', 'español', 'Traducción parcial.'),
     zed('UA6HEHYJ', 'traducción', 'español', 'Con estudio introductorio; ya citada entre las fuentes.'),
   ],
   'bib': ['VMADGM8L', 'WPXRE8KZ', 'UDFFAUMR', 'GIXGRUB9', 'Z5W8X3ZE', '8G393ETU', 'ZD6YYPRC', 'LV2US7UD'],
 },
 'valla-de-professione-religiosorum': {
   'ediciones': [
     zed('4RF8D9W8', 'edición', 'latín', 'Primera edición (editio princeps).'),
     zed('6FUHSZA5', 'edición', 'latín', 'Edición crítica.'),
     zed('L6CFN5X2', 'traducción', 'inglés'),
     zed('UA6HEHYJ', 'traducción', 'español', 'Con estudio introductorio; ya citada entre las fuentes.'),
   ],
   'bib': ['E5UP2NXB', 'T9NZPC33', '42Q8L63X', '5YSGEXVY'],
 },
 'pontano-charon': {
   'ediciones': [
     man('Giovanni Pontano, I Dialoghi, ed. Carmelo Previtera, Florencia, Sansoni, 1943', 1943, 'edición', 'latín', 'Edición crítica de los cinco diálogos.'),
     zed('9R54TUKP', 'edición y traducción', 'inglés'),
     zed('H56S2MIQ', 'traducción', 'español'),
     zed('AV3MBP7X', 'edición y traducción', 'italiano', 'Los cinco diálogos.'),
   ],
   'bib': ['45BLERH8', 'HC9AJWKP', 'FWGD5XL4', 'N794WXAP', 'ME3VLR3X', 'BXJ4S9RG', 'LRXXBZVB'],
 },
 'pontano-antonius': {
   'ediciones': [
     man('Giovanni Pontano, I Dialoghi, ed. Carmelo Previtera, Florencia, Sansoni, 1943', 1943, 'edición', 'latín', 'Edición crítica de los cinco diálogos.'),
     zed('9R54TUKP', 'edición y traducción', 'inglés'),
     zed('AV3MBP7X', 'edición y traducción', 'italiano', 'Los cinco diálogos.'),
   ],
   'bib': ['45BLERH8', 'HC9AJWKP', 'RVGUEUTJ', 'RUU2H9XD', 'RM48RLLR', 'BXJ4S9RG', 'LRXXBZVB'],
 },
 'pontano-actius': {
   'ediciones': [
     man('Giovanni Pontano, I Dialoghi, ed. Carmelo Previtera, Florencia, Sansoni, 1943', 1943, 'edición', 'latín', 'Edición crítica de los cinco diálogos.'),
     zed('LNE445AS', 'edición y traducción', 'inglés', 'Volumen 2 de los Dialogues de la I Tatti Renaissance Library; contenido por verificar.'),
     zed('AV3MBP7X', 'edición y traducción', 'italiano', 'Los cinco diálogos.'),
   ],
   'bib': ['26DZXPIZ', '45BLERH8', 'HC9AJWKP', 'FWGD5XL4', 'YLKTL6RX', '65H86ZCB', 'BXJ4S9RG', 'LRXXBZVB'],
 },
 'pontano-aegidius': {
   'ediciones': [
     man('Giovanni Pontano, I Dialoghi, ed. Carmelo Previtera, Florencia, Sansoni, 1943', 1943, 'edición', 'latín', 'Edición crítica de los cinco diálogos.'),
     man('Giovanni Pontano, Aegidius: Dialogo, ed. Francesco Tateo, Roma, 2013', 2013, 'edición y traducción', 'italiano', 'Ya citada entre las fuentes.'),
     zed('AV3MBP7X', 'edición y traducción', 'italiano', 'Los cinco diálogos.'),
     zed('SET5CR4V', 'traducción', 'español'),
   ],
   'bib': ['45BLERH8', 'HC9AJWKP', 'FWGD5XL4', 'YNC7BNSS', 'BXJ4S9RG', 'LRXXBZVB'],
 },
 'pontano-asinus': {
   'ediciones': [
     man('Giovanni Pontano, I Dialoghi, ed. Carmelo Previtera, Florencia, Sansoni, 1943', 1943, 'edición', 'latín', 'Edición crítica de los cinco diálogos.'),
     zed('EKKHJZBG', 'edición y traducción', 'italiano'),
     zed('AV3MBP7X', 'edición y traducción', 'italiano', 'Los cinco diálogos.'),
   ],
   'bib': ['45BLERH8', 'HC9AJWKP', 'DAZ4AEC4', 'DSZ7SHEB', 'X39C5WFS', 'C3YC8PZ7', 'FWGD5XL4', 'BXJ4S9RG'],
 },
 'erasmo-colloquia': {
   'ediciones': [
     zed('PVZ9S5M6', 'edición', 'latín', 'Edición crítica (ASD I-3).'),
     zed('GHK8FUJT', 'traducción', 'inglés', 'Collected Works of Erasmus, vols. 39–40.'),
     zed('JWTV9ZBJ', 'traducción', 'español'),
     zed('6MGIR7CN', 'traducción', 'español', 'Selección.'),
     zed('DCHACZD5', 'traducción', 'español', 'Reedición de la traducción castellana del siglo XVI de Alonso de Virués.'),
     zed('GNF5I5I2', 'traducción', 'inglés', 'Traducción decimonónica.'),
   ],
   'bib': ['G5IK82GD', 'P64NNVDN', 'NSNXAT3B', 'WKIUQ73K', 'N794WXAP', 'RDRUFHH4'],
 },
 'erasmo-ciceronianus': {
   'ediciones': [
     zed('76G4SUWH', 'edición', 'latín', 'Edición crítica (ASD I-2), ya citada entre las fuentes.'),
     man('Erasmus, Ciceronianus, trad. Betty I. Knott, en Collected Works of Erasmus 28, Toronto, University of Toronto Press, 1986', 1986, 'traducción', 'inglés'),
     man('Erasmo da Rotterdam, Il Ciceroniano o dello stile migliore, ed. y trad. Angiolo Gambaro, Brescia, La Scuola, 1965', 1965, 'edición y traducción', 'italiano'),
     zed('XXDHYAUA', 'traducción', 'español'),
   ],
   'bib': ['FECVST44'],
 },
 'erasmo-antibarbari': {
   'ediciones': [
     man('Erasmus, Antibarbarorum liber, ed. Kazimierz Kumaniecki, Opera omnia (ASD) I-1, Ámsterdam, North-Holland, 1969', 1969, 'edición', 'latín', 'Edición crítica.'),
     man('Erasmus, The Antibarbarians, trad. Margaret Mann Phillips, en Collected Works of Erasmus 23, Toronto, University of Toronto Press, 1978', 1978, 'traducción', 'inglés'),
   ],
   'bib': [],
 },
 'erasmo-iulius-exclusus': {
   'ediciones': [
     man('Erasmus, Iulius exclusus e coelis, ed. Silvana Seidel Menchi, Opera omnia (ASD) I-8, Leiden, Brill, 2013', 2013, 'edición', 'latín', 'Edición crítica.'),
     man('Erasmus, Julius Excluded from Heaven: A Dialogue, trad. Michael J. Heath, en Collected Works of Erasmus 27, Toronto, University of Toronto Press, 1986', 1986, 'traducción', 'inglés'),
   ],
   'bib': [],
 },
 'moro-utopia': {
   'ediciones': [
     zed('UUIPQZE4', 'edición y traducción', 'inglés', 'Edición crítica de Yale (Complete Works, vol. 4).'),
     man('Thomas More, Utopia: Latin Text and English Translation, ed. George M. Logan, Robert M. Adams y Clarence H. Miller, Cambridge, Cambridge University Press, 1995', 1995, 'edición y traducción', 'inglés'),
     zed('ZJP9CBPD', 'traducción', 'inglés'),
     man("Thomas More, L'Utopie, ed. y trad. André Prévost, París, Mame, 1978", 1978, 'edición y traducción', 'francés', 'Texto original, aparato crítico, traducción y notas.'),
     zed('HAAZCWKV', 'traducción', 'español'),
   ],
   'bib': ['UNPIFVPK', 'C2RQKSPJ', 'J6C9AUAQ', 'CBRT5HZN', 'BFU7NK6U', '229MKE9V', 'Q8NUTBHG', 'QPX2CQUI', 'XWWNEPJJ', 'UEFBXX4A', 'EB4KPIKK', '7JX448WP', 'TM33VI4X', '298KKJ63', 'WPT5C65H', 'SBZ79R97', 'CX9EZW8D'],
 },
 'ficino-de-amore': {
   'ediciones': [
     man('Marsile Ficin, Commentaire sur le Banquet de Platon, ed. y trad. Raymond Marcel, París, Les Belles Lettres, 1956', 1956, 'edición y traducción', 'francés', 'Ya citada entre las fuentes.'),
     zed('E2WBXMFS', 'edición y traducción', 'inglés'),
     zed('R6GEJDPQ', 'traducción', 'español', 'Ya citada entre las fuentes.'),
     man("Marsile Ficin, Commentaire sur le Banquet de Platon, De l'amour, ed. y trad. Pierre Laurens, París, Les Belles Lettres, 2002", 2002, 'edición y traducción', 'francés'),
     man("Marsilio Ficino, El libro dell'amore, ed. Sandra Niccoli, Florencia, Olschki, 1987", 1987, 'edición', 'italiano', 'Versión toscana del propio Ficino.'),
   ],
   'bib': [],
 },
 'landino-disputationes-camaldulenses': {
   'ediciones': [zed('ZIAA5G88', 'edición', 'latín', 'Edición crítica.'), zed('CM6GKG3M', 'traducción', 'español', 'Libro I (De vita contemplativa et activa), con estudio preliminar.')],
   'bib': ['T73ZGARP', 'P69QRDZV'],
 },
 'filelfo-de-exilio': {
   'ediciones': [zed('VT7RHH2Z', 'edición y traducción', 'inglés')],
   'bib': ['4P2GZU7G', '94BBXP35', 'K5CIJSMA', 'BDU2IMWQ', 'DDAXPTGQ', 'KTU5E9QT', 'BSDW6QXZ', 'SSZTU94D', 'GTFCACN9'],
 },
 'facio-de-vitae-felicitate': {
   'ediciones': [],
   'nota_ediciones': 'No se halló edición moderna en la biblioteca. Hay ediciones antiguas (Amberes, Plantino, 1556) y la adaptación castellana de Juan de Lucena.',
   'bib': ['JFRMEU2N', 'DDJ987UB', 'DD7TZ8V3', 'E5UNNGWK', 'M6C98XL7', '5QYZUWYK', 'FJ589J9D'],
 },
 'bruni-dialogi': {
   'ediciones': [
     man('Leonardo Bruni, Dialogi ad Petrum Paulum Histrum, ed. Stefano Ugo Baldassarri, Florencia, Olschki, 1994', 1994, 'edición', 'latín', 'Edición crítica; ya citada entre las fuentes.'),
     zed('SDLLVDKL', 'edición y traducción', 'italiano', 'Ya citada entre las fuentes.'),
     zed('GDTKVXF7', 'traducción', 'inglés', 'Incluye los Diálogos a Pier Paolo Vergerio. Contenido por verificar.'),
     PROSATORI,
     zed('9FYXQSYD', 'traducción', 'español', 'Antología; contenido por verificar.'),
   ],
   'bib': ['F6NK9TNC', 'KZ4AEGLC'],
 },
 'alberti-intercenales': {
   'ediciones': [
     man("Leon Battista Alberti, Intercenales, ed. Franco Bacchelli y Luca D'Ascia, Bolonia, Pendragon, 2003", 2003, 'edición y traducción', 'italiano', 'Ya citada entre las fuentes.'),
     man('Leon Battista Alberti, Dinner Pieces: A Translation of the Intercenales, trad. David Marsh, Binghamton, Medieval & Renaissance Texts & Studies, 1987', 1987, 'traducción', 'inglés', 'Ya citada entre las fuentes.'),
   ],
   'bib': ['8Z982JEN', '66GVID97', 'N794WXAP'],
 },
 'alberti-pontifex': {
   'ediciones': [zed('T8UQDH2V', 'edición', 'latín', 'Primera edición, ya citada entre las fuentes.')],
   'bib': [],
 },
 'scala-de-legibus-et-iudiciis': {
   'ediciones': [
     man('Bartolomeo Scala, Humanistic and Political Writings, ed. Alison Brown, Tempe, 1997', 1997, 'edición', 'latín', 'Ya citada entre las fuentes.'),
     zed('QNPN6X5K', 'edición y traducción', 'inglés'),
   ],
   'bib': [],
 },
 'scala-dialogus-de-consolatione': {
   'ediciones': [
     man('Bartolomeo Scala, Humanistic and Political Writings, ed. Alison Brown, Tempe, 1997', 1997, 'edición', 'latín', 'Ya citada entre las fuentes.'),
     zed('QNPN6X5K', 'edición y traducción', 'inglés'),
   ],
   'bib': [],
 },
 'manetti-dialogus-consolatorius': {
   'ediciones': [man('Giannozzo Manetti, Dialogus consolatorius, ed. Alfonso De Petris, Roma, Edizioni di Storia e Letteratura, 1983', 1983, 'edición', 'latín', 'Ya citada entre las fuentes.')],
   'bib': ['9GW52FHR', 'X4K6BHM2'],
 },
 'zabarella-de-felicitate': {
   'ediciones': [],
   'nota_ediciones': 'No se halló edición moderna. La única impresa conocida en la biblioteca es la de Padua, 1655.',
   'bib': ['IT4ZC29P', 'BUGS9X6A'],
 },
 'poggio-de-avaritia': {
   'ediciones': [
     man('Poggio Bracciolini, De avaritia (Dialogus contra avaritiam), ed. Giuseppe Germano, Livorno, Belforte, 1994', 1994, 'edición y traducción', 'italiano', 'Edición citada por Ciordia (2017).'),
     man('Poggio Bracciolini, «On Avarice», trad. Benjamin G. Kohl y Elizabeth B. Welles, en B. G. Kohl y R. G. Witt (eds.), The Earthly Republic: Italian Humanists on Government and Society, Filadelfia, University of Pennsylvania Press, 1978', 1978, 'traducción', 'inglés'),
     PROSATORI,
   ],
   'bib': ['EI967WSN', 'ZS6BQM3P', '33SVDS9F', 'ZNHEGXR2'],
 },
 'poggio-de-infelicitate-principum': {
   'ediciones': [zed('MC6SRNP2', 'edición', 'latín', 'Edición crítica; ya citada entre las fuentes.')],
   'bib': ['2F37XBR7', '4URDW8QN', 'IPNI6RZ9', 'ZS6BQM3P'],
 },
 'poggio-de-nobilitate': {
   'ediciones': [
     man('Poggio Bracciolini, La vera nobiltà, ed. y trad. Davide Canfora, Roma, Salerno, 1999', 1999, 'edición y traducción', 'italiano', 'Ya citada entre las fuentes.'),
     man('Poggio Bracciolini, De vera nobilitate, ed. Davide Canfora, Roma, Edizioni di Storia e Letteratura, 2002', 2002, 'edición', 'latín', 'Citada por Finzi (2010).'),
     man('Albert Rabil Jr. (ed. y trad.), Knowledge, Goodness, and Power: The Debate over Nobility among Quattrocento Italian Humanists, Binghamton, Medieval & Renaissance Texts & Studies, 1991', 1991, 'traducción', 'inglés', 'Traducción citada por Finzi (2010); incluye las respuestas de la polémica.'),
     zed('W3RTM6ZX', 'edición', 'latín', 'Edición antigua junto con la réplica de Leonardo da Chio.'),
   ],
   'bib': ['ZS6BQM3P', '5BPENC3G'],
 },
 'poggio-de-varietate-fortunae': {
   'ediciones': [
     man('Poggio Bracciolini, De varietate fortunae, ed. Outi Merisalo, Helsinki, Suomalainen Tiedeakatemia, 1993', 1993, 'edición', 'latín', 'Edición crítica citada por Ciordia (2017).'),
     zed('TPZKM4Z6', 'edición y traducción', 'francés', 'Solo el libro I.'),
     zed('KBQFFW2E', 'traducción', 'inglés', 'Solo el libro IV (el viaje de Niccolò de\' Conti).'),
   ],
   'bib': ['BJEI7B8M', 'ZS6BQM3P'],
 },
 'cusa-de-pace-fidei': {
   'ediciones': [
     man('Nicolai de Cusa, De pace fidei, ed. Raymond Klibansky y Hildebrand Bascour, Opera omnia VII, Hamburgo, Felix Meiner, 1959', 1959, 'edición', 'latín', 'Edición crítica.'),
     man("Jasper Hopkins (trad.), Nicholas of Cusa's De pace fidei and Cribratio Alkorani, Minneapolis, Banning, 1990", 1990, 'traducción', 'inglés'),
   ],
   'bib': [],
 },
 'lapo-de-curiae-commodis': {
   'ediciones': [man("Christopher S. Celenza, Renaissance Humanism and the Papal Curia: Lapo da Castiglionchio the Younger's De curiae commodis, Ann Arbor, University of Michigan Press, 1999", 1999, 'edición y traducción', 'inglés', 'Edición crítica con traducción y estudio.')],
   'bib': [],
 },
 'rinuccini-de-libertate': {
   'ediciones': [
     man('Alamanno Rinuccini, Dialogus de libertate, ed. Francesco Adorno, Atti e Memorie dell\'Accademia Toscana di Scienze e Lettere «La Colombaria» 22 (1957)', 1957, 'edición', 'latín'),
     man('Renée Neu Watkins (trad.), Humanism and Liberty: Writings on Freedom from Fifteenth-Century Florence, Columbia, University of South Carolina Press, 1978', 1978, 'traducción', 'inglés'),
   ],
   'bib': [],
 },
 'bembo-de-aetna': {
   'ediciones': [man('Pietro Bembo, Lyric Poetry. Etna, ed. y trad. Mary P. Chatfield, I Tatti Renaissance Library, Cambridge (MA), Harvard University Press, 2005', 2005, 'edición y traducción', 'inglés')],
   'bib': [],
 },
 'valeriano-de-litteratorum-infelicitate': {
   'ediciones': [man("Julia Haig Gaisser, Pierio Valeriano on the Ill Fortune of Learned Men: A Renaissance Humanist and His World, Ann Arbor, University of Michigan Press, 1999", 1999, 'edición y traducción', 'inglés')],
   'bib': [],
 },
 'cortesi-de-hominibus-doctis': {
   'ediciones': [man('Paolo Cortesi, De hominibus doctis dialogus, ed. Giacomo Ferraù, Palermo, Il Vespro, 1979', 1979, 'edición y traducción', 'italiano')],
   'bib': [],
 },
 'petrarca-secretum': {
   'ediciones': [
     man('Francesco Petrarca, Secretum, en Prose, ed. Guido Martellotti, Pier Giorgio Ricci, Enrico Carrara y Enrico Bianchi, Milán-Nápoles, Ricciardi, 1955', 1955, 'edición y traducción', 'italiano'),
     man('Francesco Petrarca, Secretum, ed. Enrico Fenzi, Milán, Mursia, 1992', 1992, 'edición y traducción', 'italiano'),
     man('Francesco Petrarca, Secretum meum / Mein Geheimnis, ed. y trad. Bernhard Huss y Gerhard Regn, Mainz, Dieterich, 2004', 2004, 'edición y traducción', 'alemán', 'Edición citada por Celenza (2017).'),
     man('Francesco Petrarca, My Secret Book, ed. y trad. Nicholas Mann, I Tatti Renaissance Library, Cambridge (MA), Harvard University Press, 2016', 2016, 'edición y traducción', 'inglés'),
     zed('KHQVHFV3', 'traducción', 'español', 'Incluye el Secretum («Mi secreto»). Contenido por verificar.'),
   ],
   'bib': ['JD7345DM', 'JKUDM3WB', 'K7SQ5S7B'],
 },
 'petrarca-de-remediis': {
   'ediciones': [
     man('Francesco Petrarca, Les remèdes aux deux fortunes / De remediis utriusque fortunae, 1354–1366, ed. y trad. Christophe Carraud, Grenoble, 2002', 2002, 'edición y traducción', 'francés', 'Ya citada entre las fuentes.'),
     man("Conrad H. Rawski (trad.), Petrarch's Remedies for Fortune Fair and Foul, 5 vols., Bloomington, Indiana University Press, 1991", 1991, 'traducción', 'inglés'),
     zed('PQEVJAQR', 'edición', 'latín', 'Texto digital.'),
     zed('AMQGQEEW', 'traducción', 'español', 'Traducción castellana del siglo XVI.'),
   ],
   'bib': ['K7SQ5S7B', '2CN7Q88F'],
 },
}


def bloque(ident, datos, fuentes_txt):
    lineas = ['ediciones:']
    eds = datos.get('ediciones', [])
    if not eds:
        lineas[-1] = 'ediciones: []'
    for e in eds:
        if e.get('zotero'):
            r = Z[e['zotero']]
            ref = referencia(e['zotero'])
            anio = r['Publication Year']
        else:
            ref = e['ref'] + '.'
            anio = e['anio']
        assert e['tipo'] in TIPOS, e
        lineas.append(f'  - tipo: {e["tipo"]}')
        lineas.append(f'    lengua: {e["lengua"]}')
        lineas.append(f'    referencia: {q(ref)}')
        if anio:
            lineas.append(f'    anio: {anio}')
        if e.get('zotero'):
            lineas.append(f'    zotero: {e["zotero"]}')
        if e.get('nota'):
            lineas.append(f'    nota: {q(e["nota"])}')
        if e.get('verificado') is False:
            lineas.append('    verificado: false')
    if datos.get('nota_ediciones'):
        lineas.append(f'nota_ediciones: {q(datos["nota_ediciones"])}')
    bib = []
    for k in datos.get('bib', []):
        r = Z[k]
        ap = (r['Author'] or r['Editor']).split(',')[0].strip()
        tit = limpiar(r['Title'])[:30]
        if tit and tit.lower() in fuentes_txt.lower():
            continue
        bib.append((r['Publication Year'] or '0', k))
    bib = sorted(set(bib))
    if bib:
        lineas.append('')
        lineas.append('bibliografia:')
        for _, k in bib:
            lineas.append(f'  - referencia: {q(referencia(k))}')
            lineas.append(f'    zotero: {k}')
    return '\n'.join(lineas) + '\n'


for ident, datos in D.items():
    p = os.path.join(RAIZ, 'data', 'dialogos', ident + '.yaml')
    s = open(p, encoding='utf-8').read()
    s = re.sub(r'\n(ediciones|nota_ediciones|bibliografia):.*?(?=\n[a-z_]+:|\Z)', '', s, flags=re.S)
    m = re.search(r'^fuentes:.*?(?=^\w)', s, flags=re.S | re.M)
    fuentes_txt = m.group(0) if m else ''
    s = s.replace('\nrevision:', '\n' + bloque(ident, datos, fuentes_txt) + '\nrevision:', 1)
    open(p, 'w', encoding='utf-8').write(s)
print(f'{len(D)} fichas actualizadas')
