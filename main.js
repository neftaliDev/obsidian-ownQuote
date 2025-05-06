const { Plugin, PluginSettingTab, Setting, TFile, MarkdownView } = require("obsidian");

class QuotesPlugin extends Plugin {
  settings = {
    quotesFolder: "Books-Quotes",
    dailyTag: "quote-daily",
    dashboardTag: "quote-dashboard",
    lastDashboardUpdate: 0,
    lastQuote: null,
  };

  async onload() {
    console.log("Quotes Plugin loaded");

    // Cargar configuración
    this.settings = Object.assign({}, this.settings, await this.loadData());

    // Añadir pestaña de configuración
    this.addSettingTab(new QuotesPluginSettings(this.app, this));

    // Registrar procesador de markdown
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
    const quote = await this.getDailyQuote();
    const quoteEl = el.createEl("div", { cls: "quote-daily-container" });
    quoteEl.innerHTML = quote;
  }

  async updateDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (today > this.settings.lastDashboardUpdate) {
      this.settings.lastDashboardUpdate = today;
      await this.saveData(this.settings);
      this.app.workspace.updateOptions();
    }
  }

  async getDailyQuote() {
    const quotes = await this.loadQuotes();
    if (!quotes || quotes.length === 0) {
      return "<blockquote>No se encontraron citas</blockquote>";
    }

    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % quotes.length;
    const { quote, source } = quotes[quoteIndex];

    return `
            <blockquote class="quote-daily">
                <p>${quote}</p>
                <footer>— <cite>${source}</cite></footer>
            </blockquote>
        `;
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
            const cleanQuote = block
              .replace(/^> \[!quote\][ \t]*/gm, "")
              .replace(/^> /gm, "")
              .trim();

            if (cleanQuote) {
              quotes.push({
                quote: cleanQuote,
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
      const quoteData = await this.getDailyQuote();
      activeView.editor.replaceSelection(`> [!quote] Cita del día\n> ${quoteData}\n> — *Fuente*`);
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
