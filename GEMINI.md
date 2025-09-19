# Quotes Plugin for Obsidian

![Quotes Plugin](https://img.shields.io/badge/Obsidian-Plugin-663399?style=for-the-badge&logo=obsidian)

A simple plugin to manage and display daily quotes from your Obsidian vault, with automatic dashboard integration.

---

## Features

- 📚 **Daily Quote Insertion**: Insert a random quote from your quotes folder into the active markdown file
- 🖼️ **Dashboard Display**: Automatically show a daily quote in your dashboard (sidebar)
- 🔁 **Automatic Updates**: Dashboard updates once per day (based on calendar date)
- 🛠️ **Easy Configuration**: Set your quotes folder path and customize behavior
- 📂 **Structured Quotes**: Works with quotes stored in `.md` files following a specific format


---

## Usage

- **Insert Daily Quote**: Press `Ctrl+Shift+D` (or the command you set) to insert the current day's quote
- **Dashboard**: The dashboard will automatically display the current day's quote when you open a markdown view

---

## Configuration

The plugin requires a folder in your Obsidian vault containing `.md` files with quotes in this format:

```markdown
> [!quote] Source Name
> Quote text here
```

**Example**:

```markdown
> [!quote] John Lennon
> "Imagine..."
```

You can configure the quotes folder path in the plugin settings.

---

## Known Issues

- The plugin may not work if your quotes folder is empty or has incorrect formatting
- The dashboard updates only once per day (based on the last update timestamp)
- The plugin processes all quotes files every time the dashboard updates (could be optimized)

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with clear documentation of your changes.

---

# Posibles nuevas funciones o mejoras

Aquí hay una lista de posibles nuevas funciones y mejoras que podrían mejorar la experiencia del plugin:

1. **Opción de cita aleatoria**: Agregar una configuración para alternar entre citas diarias y aleatorias (en lugar de siempre usar el día del año para seleccionar)

2. **Categorización de citas**: Permitir que las citas tengan categorías y mostrar un dashboard con diferentes categorías (ej.: "Literatura", "Filosofía", "Tecnología")

3. **Exportación de citas**: Añadir un comando para exportar todas las citas a CSV o JSON para análisis externo

4. **Intervalo de actualización del dashboard**: Permitir configurar la frecuencia de actualización del dashboard (ej.: cada hora, cada día, etc.)

5. **Mejorar el manejo de errores**: Mostrar mensajes más amigables cuando no se encuentran citas o hay problemas con el formato

6. **Optimización de rendimiento**: Implementar un caché para las citas y evitar procesar todos los archivos cada vez que se actualice el dashboard

7. **Formato avanzado**: Permitir personalizar el formato de las citas (ej.: añadir autores, fechas, categorías en el formato)

8. **Filtros de citas**: Añadir filtros para mostrar solo citas de fuentes específicas o categorías

9. **Sistema de notificaciones**: Enviar notificaciones al usuario cuando se inserta una nueva cita o cuando el dashboard actualiza

10. **Integración con otras herramientas**: 
    - Conectar con plugins de seguimiento de lectura para mostrar citas de libros que hayas leído
    - Integración con el sistema de tareas de Obsidian para vincular citas a proyectos

11. **Soporte para estructuras avanzadas**: Permitir que las citas se almacenen en YAML frontmatter en lugar de bloques de markdown

12. **Personalización del dashboard**: Permitir que el usuario defina el tamaño y el estilo del dashboard (ej.: cuadros, listas, etc.)

13. **Soporte para múltiples carpetas**: Permitir configurar múltiples carpetas para almacenar citas

14. **Historial de citas**: Mantener un historial de citas para mostrar en el dashboard (ej.: "Últimas 5 citas")

15. **Exportación por fecha**: Añadir la opción de exportar citas por fecha específica para análisis temporal

---

¡Espero que este README y la lista de mejoras te sean útiles para seguir desarrollando este plugin! 🚀
