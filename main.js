const { Plugin, PluginSettingTab, Setting, MarkdownView, MarkdownRenderer, moment } = require("obsidian");

// Helper function to navigate nested JSON
function getNested(obj, path) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

class QuotesPlugin extends Plugin {
  settings = {
    quotesFolder: "Books-Quotes",
    dailyTag: "quote-daily",
    dashboardTag: "quote-dashboard",
    lastDashboardUpdate: 0,
  };

  // i18n properties
  locale = {};
  locale_en = {};

  // Translation function
  t(key, vars) {
    let text = getNested(this.locale, key) || getNested(this.locale_en, key) || key;
    if (vars) {
      for (const [key, value] of Object.entries(vars)) {
        text = text.replace(`{${key}}`, value);
      }
    }
    return text;
  }

  // Load language files
  async loadLocale() {
    const enPath = `${this.manifest.dir}/locales/en.json`;
    this.locale_en = JSON.parse(await this.app.vault.adapter.read(enPath));

    const obsidianLang = moment.locale();
    const langPath = `${this.manifest.dir}/locales/${obsidianLang}.json`;
    this.locale = (await this.app.vault.adapter.exists(langPath))
      ? JSON.parse(await this.app.vault.adapter.read(langPath))
      : this.locale_en;
  }

  async onload() {
    // Cargar configuración
    await this.loadLocale();
    console.log(this.t("logs.loaded"));
    this.settings = Object.assign({}, this.settings, await this.loadData());

    // Añadir pestaña de configuración
    this.addSettingTab(new QuotesPluginSettings(this.app, this));

    // Registrar procesador de markdown para el dashboard
    this.registerMarkdownCodeBlockProcessor(this.settings.dashboardTag, (source, el, ctx) => this.renderDashboardQuote(el, ctx));

    // Comando para insertar quote
    this.addCommand({
      id: "insert-daily-quote",
      name: this.t("commands.insertDaily"),
      callback: () => this.insertDailyQuote(),
    });

    // Actualizar dashboard al iniciar
    this.app.workspace.onLayoutReady(() => this.updateDashboard());
  }

  async renderDashboardQuote(el, ctx) {
    console.log(this.t("logs.renderingDashboard"));
    try {
      const quote = await this.getDailyQuote();
      console.log(this.t("logs.quoteFetched"), quote);

      await MarkdownRenderer.renderMarkdown(quote, el, "", this);
      console.log(this.t("logs.quoteRendered"));
    } catch (error) {
      console.error(this.t("logs.renderError"), error);
    }
  }

  async updateDashboard() {
    console.log(this.t("logs.checkingDashboardUpdate"));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    console.log(this.t("logs.lastUpdate", { lastUpdate: this.settings.lastDashboardUpdate, today: today }));

    if (today > this.settings.lastDashboardUpdate) {
      console.log(this.t("logs.updatingDashboard"));
      this.settings.lastDashboardUpdate = today;
      await this.saveData(this.settings);

      // Forzar actualización de todas las vistas
      this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
        if (leaf.view instanceof MarkdownView) {
          console.log(this.t("logs.updatingView"), leaf.view.file?.path);
          leaf.view.previewMode.rerender(true);
        }
      });
    }
  }

  async getDailyQuote() {
    console.log(this.t("logs.gettingDailyQuote"));
    const quotes = await this.loadQuotes();

    if (!quotes || quotes.length === 0) {
      console.warn(this.t("logs.noQuotesFoundWarning"));
      return this.t("dashboard.noQuotesFound");
    }

    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % quotes.length;

    console.log(this.t("logs.dayInfo", { dayOfYear: dayOfYear, index: index }));

    const { quote, source } = quotes[index];
    // Original line: const formattedQuote = `> [!quote] ${source}\n> ${quote}\n> — *${source}*`;
    // Modified line: Removed the duplicated source at the end.
    const formattedQuote = `> [!quote] ${source}\n> ${quote}`;

    console.log(this.t("logs.formattedQuote"), formattedQuote);
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
      console.error(this.t("logs.loadingQuotesError"), error);
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
    console.log(this.t("logs.unloaded"));
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
      .setName(this.plugin.t("settings.folder.name"))
      .setDesc(this.plugin.t("settings.folder.desc"))
      .addText((text) =>
        text
          .setPlaceholder(this.plugin.t("settings.folder.placeholder"))
          .setValue(this.plugin.settings.quotesFolder)
          .onChange(async (value) => {
            this.plugin.settings.quotesFolder = value;
            await this.plugin.saveData(this.plugin.settings);
          })
      );
  }
}

module.exports = QuotesPlugin;
