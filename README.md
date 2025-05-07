# QuotesPlugin

**QuotesPlugin** es un plugin para [Obsidian](https://obsidian.md) que muestra automáticamente una **cita del día** en tu dashboard y permite insertarla en tus notas. Las citas se extraen de archivos Markdown ubicados en una carpeta específica del vault.

## Características

- Muestra una **cita diaria** basada en el día del año.
- Inserta la cita actual con un comando personalizado.
- Actualiza automáticamente el dashboard una vez al día.
- Personaliza la carpeta de origen de citas desde la configuración del plugin.
- Soporta bloques de cita en formato `> [!quote]`.

## Requisitos del contenido

Los archivos en la carpeta configurada deben tener citas en formato como este:

```markdown
> [!quote] Autor del libro
> Esta es una cita inspiradora.
> — _Autor del libro_
```

## Uso

1. Crea una carpeta (por defecto: `Books-Quotes`) con archivos `.md` que contengan bloques de cita.

2. En tu dashboard o nota especial, inserta un bloque de código con el tag definido (por defecto: `quote-dashboard`):

   ````markdown
   ```quote-dashboard

   ```
   ````

3. Ejecuta el comando “Insertar cita del día” desde la paleta de comandos para insertar directamente la cita en una nota.

4. La cita diaria se actualiza automáticamente una vez al día al abrir Obsidian o al cargar el dashboard.

## Configuración

Accede a la configuración del plugin para:

- Cambiar la carpeta donde se almacenan las citas (`Books-Quotes` por defecto).
- Asegurarte de que los archivos tengan el formato adecuado para que las citas se detecten correctamente.

## Instalación

1. Coloca el archivo `main.js` (compilado desde este código) dentro de la carpeta del plugin: `.obsidian/plugins/quotes-plugin/`.
2. Activa el plugin desde el menú de configuración de Obsidian.

## Licencia

MIT
