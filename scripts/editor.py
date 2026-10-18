"""Editor local de fichas de Coordenadas renacentistas.

Uso: doble clic en «editar-fichas.bat» (o: python scripts/editor.py)

- Al abrir, trae los últimos cambios del repositorio (git pull).
- Muestra las fichas en orden cronológico; al elegir una, carga su YAML para editarlo.
- «Validar» guarda el archivo y corre el validador del sitio (npm run validar).
- «Guardar y publicar» valida y, si no hay errores, hace commit y push: el sitio se
  actualiza solo en uno o dos minutos.
- A la derecha, un buscador de personas y lugares: doble clic copia el id.
"""
import os
import re
import subprocess
import tkinter as tk
import webbrowser
from tkinter import messagebox, simpledialog, ttk

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIALOGOS = os.path.join(RAIZ, 'data', 'dialogos')
SITIO = 'https://marianovilar.github.io/mapa-renacentista/'
ESPECIALES = [('Personas (personas.yaml)', os.path.join(RAIZ, 'data', 'personas.yaml')),
              ('Lugares (lugares.yaml)', os.path.join(RAIZ, 'data', 'lugares.yaml'))]


def correr(cmd):
    """Corre un comando en la carpeta del proyecto y devuelve (código, salida)."""
    r = subprocess.run(cmd, cwd=RAIZ, capture_output=True, text=True, encoding='utf-8', errors='replace', shell=isinstance(cmd, str))
    return r.returncode, (r.stdout + r.stderr).strip()


def leer(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def fichas():
    """Lista (año, id, título, autor, revisado) ordenada por fecha de composición."""
    out = []
    for f in os.listdir(DIALOGOS):
        if not f.endswith('.yaml'):
            continue
        s = leer(os.path.join(DIALOGOS, f))
        tit = re.search(r'^titulo:\s*(.+)$', s, re.M)
        anio = re.search(r'^composicion:\s*\n\s+fecha:\s*\n\s+desde:\s*(\d+)', s, re.M)
        aut = re.search(r'^autores:\s*\[([^\]]*)\]', s, re.M)
        rev = re.search(r'^revision:\s*(\w+)', s, re.M)
        out.append((int(anio.group(1)) if anio else 9999, f[:-5], tit.group(1).strip() if tit else f,
                    aut.group(1).split(',')[0].strip() if aut else '', (rev.group(1) if rev else '') == 'revisado'))
    return sorted(out)


def entradas(p):
    """[(id, nombre)] de personas.yaml o lugares.yaml."""
    s = leer(p)
    return re.findall(r'^- id:\s*(\S+)\s*\n\s+nombre:\s*(.+)$', s, re.M)


class Editor(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('Coordenadas renacentistas — editor de fichas')
        self.geometry('1250x780')
        self.actual = None          # ruta del archivo abierto
        self.original = ''          # texto tal como se cargó
        self.construir()
        self.after(100, self.traer_cambios)

    # ---------- Interfaz ----------
    def construir(self):
        estilo = ttk.Style(self)
        estilo.configure('Treeview', rowheight=22)
        cuerpo = ttk.PanedWindow(self, orient='horizontal')
        cuerpo.pack(fill='both', expand=True)

        # Lista de fichas
        izq = ttk.Frame(cuerpo, padding=6)
        ttk.Label(izq, text='Fichas (orden cronológico)', font=('Segoe UI', 10, 'bold')).pack(anchor='w')
        self.filtro = tk.StringVar()
        self.filtro.trace_add('write', lambda *a: self.llenar_lista())
        ttk.Entry(izq, textvariable=self.filtro).pack(fill='x', pady=4)
        self.lista = ttk.Treeview(izq, columns=('anio', 'autor', 'rev'), show='tree headings', selectmode='browse')
        self.lista.heading('#0', text='Título')
        self.lista.heading('anio', text='Año')
        self.lista.heading('autor', text='Autor')
        self.lista.heading('rev', text='✓')
        self.lista.column('#0', width=230)
        self.lista.column('anio', width=50, anchor='center')
        self.lista.column('autor', width=80)
        self.lista.column('rev', width=24, anchor='center')
        self.lista.pack(fill='both', expand=True)
        self.lista.bind('<<TreeviewSelect>>', self.elegir)
        cuerpo.add(izq, weight=1)

        # Editor de texto
        centro = ttk.Frame(cuerpo, padding=6)
        self.rotulo = ttk.Label(centro, text='Elegí una ficha a la izquierda', font=('Segoe UI', 10, 'bold'))
        self.rotulo.pack(anchor='w')
        marco = ttk.Frame(centro)
        marco.pack(fill='both', expand=True, pady=4)
        self.texto = tk.Text(marco, wrap='word', undo=True, font=('Consolas', 11), padx=8, pady=6)
        barra = ttk.Scrollbar(marco, command=self.texto.yview)
        self.texto.configure(yscrollcommand=barra.set)
        barra.pack(side='right', fill='y')
        self.texto.pack(side='left', fill='both', expand=True)
        self.texto.bind('<Tab>', self.tab_a_espacios)
        botones = ttk.Frame(centro)
        botones.pack(fill='x')
        ttk.Button(botones, text='Validar', command=self.validar).pack(side='left')
        ttk.Button(botones, text='Guardar y publicar', command=self.publicar).pack(side='left', padx=6)
        ttk.Button(botones, text='Descartar cambios', command=self.descartar).pack(side='left')
        ttk.Button(botones, text='Ver en el sitio', command=self.ver_en_sitio).pack(side='right')
        ttk.Label(centro, text='Mensajes', font=('Segoe UI', 9, 'bold')).pack(anchor='w', pady=(8, 0))
        self.mensajes = tk.Text(centro, height=9, wrap='word', font=('Consolas', 10), bg='#f6f3ec', state='disabled')
        self.mensajes.pack(fill='x')
        self.mensajes.tag_configure('error', foreground='#a3342a')
        self.mensajes.tag_configure('ok', foreground='#2f6b2f')
        cuerpo.add(centro, weight=4)

        # Buscador de ids
        der = ttk.Frame(cuerpo, padding=6)
        ttk.Label(der, text='Personas y lugares', font=('Segoe UI', 10, 'bold')).pack(anchor='w')
        ttk.Label(der, text='Doble clic: copia el id', foreground='#666').pack(anchor='w')
        self.busca = tk.StringVar()
        self.busca.trace_add('write', lambda *a: self.llenar_ids())
        ttk.Entry(der, textvariable=self.busca).pack(fill='x', pady=4)
        self.ids = ttk.Treeview(der, columns=('id',), show='tree headings')
        self.ids.heading('#0', text='Nombre')
        self.ids.heading('id', text='id')
        self.ids.column('#0', width=150)
        self.ids.column('id', width=120)
        self.ids.pack(fill='both', expand=True)
        self.ids.bind('<Double-1>', self.copiar_id)
        cuerpo.add(der, weight=1)

    def escribir(self, texto, tag=None, limpiar=False):
        self.mensajes.configure(state='normal')
        if limpiar:
            self.mensajes.delete('1.0', 'end')
        self.mensajes.insert('end', texto + '\n', tag)
        self.mensajes.see('end')
        self.mensajes.configure(state='disabled')
        self.update_idletasks()

    def tab_a_espacios(self, _):
        self.texto.insert('insert', '  ')
        return 'break'

    # ---------- Datos ----------
    def traer_cambios(self):
        self.escribir('Trayendo los últimos cambios del repositorio…', limpiar=True)
        cod, salida = correr(['git', 'pull', '--ff-only'])
        if cod == 0:
            self.escribir('Listo: la copia local está al día.', 'ok')
        else:
            self.escribir('No se pudieron traer los cambios:\n' + salida, 'error')
        self.llenar_lista()
        self.llenar_ids()

    def llenar_lista(self):
        f = self.filtro.get().lower()
        self.lista.delete(*self.lista.get_children())
        for anio, ident, tit, aut, rev in fichas():
            if f and f not in (tit + ' ' + aut + ' ' + ident).lower():
                continue
            self.lista.insert('', 'end', iid=ident, text=tit, values=(anio if anio < 9999 else '', aut, '✓' if rev else ''))
        for nombre, ruta in ESPECIALES:
            if not f:
                self.lista.insert('', 'end', iid=ruta, text=nombre, values=('', '', ''))

    def llenar_ids(self):
        b = self.busca.get().lower()
        self.ids.delete(*self.ids.get_children())
        for nombre_lista, ruta in ESPECIALES:
            grupo = self.ids.insert('', 'end', text=nombre_lista.split(' ')[0], open=bool(b))
            for ident, nombre in entradas(ruta):
                if b and b not in (ident + ' ' + nombre).lower():
                    continue
                self.ids.insert(grupo, 'end', text=nombre.strip('"'), values=(ident,))

    def copiar_id(self, _):
        sel = self.ids.selection()
        if not sel or not self.ids.item(sel[0], 'values'):
            return
        ident = self.ids.item(sel[0], 'values')[0]
        self.clipboard_clear()
        self.clipboard_append(ident)
        self.escribir(f'Copiado: {ident}', 'ok')

    def hay_cambios(self):
        return self.actual and self.texto.get('1.0', 'end-1c') != self.original

    def elegir(self, _):
        sel = self.lista.selection()
        if not sel:
            return
        ruta = sel[0] if os.path.isabs(sel[0]) else os.path.join(DIALOGOS, sel[0] + '.yaml')
        if ruta == self.actual:
            return
        if self.hay_cambios() and not messagebox.askyesno('Cambios sin publicar', 'La ficha abierta tiene cambios sin publicar. ¿Descartarlos y abrir otra?'):
            return
        self.actual = ruta
        self.original = leer(ruta)
        self.texto.delete('1.0', 'end')
        self.texto.insert('1.0', self.original)
        self.texto.edit_reset()
        self.rotulo.configure(text=os.path.relpath(ruta, RAIZ))

    def descartar(self):
        if not self.actual:
            return
        self.texto.delete('1.0', 'end')
        self.texto.insert('1.0', self.original)
        with open(self.actual, 'w', encoding='utf-8', newline='\n') as f:
            f.write(self.original)
        self.escribir('Cambios descartados.', limpiar=True)

    # ---------- Validar y publicar ----------
    def guardar(self):
        contenido = self.texto.get('1.0', 'end-1c').replace('\t', '  ')
        if not contenido.endswith('\n'):
            contenido += '\n'
        with open(self.actual, 'w', encoding='utf-8', newline='\n') as f:
            f.write(contenido)

    def validar(self):
        if not self.actual:
            messagebox.showinfo('Sin ficha', 'Primero elegí una ficha.')
            return False
        self.guardar()
        self.escribir('Validando…', limpiar=True)
        cod, salida = correr('npm run validar')
        if cod == 0:
            nombre = os.path.basename(self.actual)
            propios = [l.strip() for l in salida.splitlines() if nombre in l and l.strip().startswith('·')]
            self.escribir('Sin errores.', 'ok')
            for a in propios:
                self.escribir('Aviso (no impide publicar): ' + a.lstrip('· '))
            return True
        errores = [l.strip() for l in salida.splitlines() if l.strip().startswith('✗')]
        self.escribir('Hay errores; corregilos antes de publicar:', 'error')
        for e in errores or salida.splitlines()[-15:]:
            self.escribir('  ' + e.lstrip('✗ '), 'error')
        if any('inexistente' in e for e in errores):
            self.escribir('Tip: los ids de personas y lugares están en el buscador de la derecha.')
        return False

    def publicar(self):
        if not self.hay_cambios():
            messagebox.showinfo('Sin cambios', 'No hay cambios para publicar en esta ficha.')
            return
        if not self.validar():
            return
        rel = os.path.relpath(self.actual, RAIZ).replace('\\', '/')
        tit = re.search(r'^titulo:\s*(.+)$', self.original, re.M)
        sugerido = f'Corrección: {tit.group(1).strip()}' if tit else 'Corrección'
        msg = simpledialog.askstring('Publicar', 'Mensaje que describe el cambio:', initialvalue=sugerido, parent=self)
        if not msg:
            self.escribir('Publicación cancelada; el archivo quedó guardado en tu computadora.')
            return
        self.escribir('Publicando…')
        for paso in (['git', 'add', rel], ['git', 'commit', '-m', msg, '--', rel], ['git', 'pull', '--rebase', '--autostash'], ['git', 'push']):
            cod, salida = correr(paso)
            if cod != 0:
                self.escribir(f'Falló «{" ".join(paso[:2])}»:\n{salida}', 'error')
                return
        self.original = leer(self.actual)
        self.escribir('Publicado. El sitio se actualiza en uno o dos minutos.', 'ok')
        self.llenar_lista()

    def ver_en_sitio(self):
        if self.actual and self.actual.startswith(DIALOGOS):
            webbrowser.open(SITIO + '#/dialogo/' + os.path.basename(self.actual)[:-5])
        else:
            webbrowser.open(SITIO)

    def destroy(self):
        if self.hay_cambios() and not messagebox.askyesno('Cambios sin publicar', 'Hay cambios sin publicar. ¿Cerrar igual? (quedan guardados en tu computadora solo si ya validaste)'):
            return
        super().destroy()


if __name__ == '__main__':
    Editor().mainloop()
