const { Plugin, PluginSettingTab, Setting, MarkdownView, MarkdownRenderer } = require("obsidian");

class QuotesPlugin extends Plugin {
  settings = {
    quotesFolder: "Books-Quotes",
    dailyTag: "quote-daily",
    dashboardTag: "quote-dashboard",
    lastDashboardUpdate: 0,
  };

  async onload() {
    console.log("Quotes Plugin loaded");

    // Cargar configuración
    this.settings = Object.assign({}, this.settings, await this.loadData());

    // Añadir pestaña de configuración
    this.addSettingTab(new QuotesPluginSettings(this.app, this));

    // Registrar procesador de markdown para el dashboard
    this.registerMarkdownCodeBlockProcessor(this.settings.dashboardTag, (source, el, ctx) => this.renderDashboardQuote(el, ctx));

    // Comando para insertar quote
    this.addCommand({
      id: "insert-daily-quote",
      name: "Insertar cita del día",
      callback: () => this.insertDailyQuote(),
    });

    // Actualizar dashboard al iniciar
    this.app.workspace.onLayoutReady(() => this.updateDashboard());
  }

  async renderDashboardQuote(el, ctx) {
    console.log("[Quotes] Renderizando dashboard quote...");
    try {
      const quote = await this.getDailyQuote();
      console.log("[Quotes] Quote obtenida:", quote);

      await MarkdownRenderer.renderMarkdown(quote, el, "", this);
      console.log("[Quotes] Quote renderizada correctamente.");
    } catch (error) {
      console.error("[Quotes] Error en renderDashboardQuote:", error);
    }
  }

  async updateDashboard() {
    console.log("[Quotes] Verificando actualización del dashboard...");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    console.log(`[Quotes] Última actualización: ${this.settings.lastDashboardUpdate}, Hoy: ${today}`);

    if (today > this.settings.lastDashboardUpdate) {
      console.log("[Quotes] Actualizando dashboard...");
      this.settings.lastDashboardUpdate = today;
      await this.saveData(this.settings);

      // Forzar actualización de todas las vistas
      this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
        if (leaf.view instanceof MarkdownView) {
          console.log("[Quotes] Actualizando vista:", leaf.view.file?.path);
          leaf.view.previewMode.rerender(true);
        }
      });
    }
  }

  async getDailyQuote() {
    console.log("[Quotes] Obteniendo quote del día...");
    const quotes = await this.loadQuotes();

    if (!quotes || quotes.length === 0) {
      console.warn("[Quotes] No se encontraron citas");
      return "> [!quote] No se encontraron citas\n> Verifica la configuración";
    }

    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % quotes.length;

    console.log(`[Quotes] Día del año: ${dayOfYear}, Índice: ${index}`);

    const { quote, source } = quotes[index];
    const formattedQuote = `> [!quote] ${source}\n> ${quote}\n> — *${source}*`;

    console.log("[Quotes] Quote formateada:", formattedQuote);
    return formattedQuote;
  }

  async loadQuotes() {
    const quotes = [];
    try {
      const files = this.app.vault.getFiles().filter((file) => file.path.startsWith(this.settings.quotesFolder) && file.extension === "md");

      for (const file of files) {
        const content = await this.app.vault.read(file);
        const source = file.basename;

        const quoteBlocks = content.match(/^> \[!quote\].*?$(?:\n>.*?$)*/gm);

        if (quoteBlocks) {
          quoteBlocks.forEach((block) => {
            const quoteText = block
              .replace(/^> \[!quote\][^\n]*\n?>/, "")
              .replace(/^> /gm, "")
              .replace(/\^ref-\d+/g, "")
              .trim();

            if (quoteText) {
              quotes.push({
                quote: quoteText,
                source: source,
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error cargando quotes:", error);
    }
    return quotes;
  }

  async insertDailyQuote() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const quote = await this.getDailyQuote();
      activeView.editor.replaceSelection(quote);
    }
  }

  onunload() {
    console.log("Quotes Plugin unloaded");
  }
}

class QuotesPluginSettings extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Carpeta de quotes")
      .setDesc("Ruta donde se encuentran los archivos con quotes")
      .addText((text) =>
        text
          .setPlaceholder("Ej: Books-Quotes")
          .setValue(this.plugin.settings.quotesFolder)
          .onChange(async (value) => {
            this.plugin.settings.quotesFolder = value;
            await this.plugin.saveData(this.plugin.settings);
          })
      );
  }
}

module.exports = QuotesPlugin;
