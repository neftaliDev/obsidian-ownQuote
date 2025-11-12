"use strict";

const { Plugin, PluginSettingTab, Setting, MarkdownView, MarkdownRenderer, moment, setIcon } = require("obsidian");

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
    currentDailyQuote: null, // Almacenará { quote: string, source: string }
    currentQuoteDate: null, // Almacenará la fecha en formato YYYY-MM-DD
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

    // --- Inyección de estilos CSS para el botón de refresco ---
    const styleEl = document.createElement("style");
    styleEl.id = "quotes-plugin-styles";
    styleEl.innerHTML = `
      .quotes-plugin-container .callout { position: relative; }
      .quotes-plugin-refresh-btn { position: absolute; bottom: 6px; right: 8px; cursor: pointer; color: var(--text-muted); opacity: 0.6; transition: opacity 0.2s ease-in-out; }
      .quotes-plugin-refresh-btn:hover { color: var(--text-normal); opacity: 1; }
      .quotes-plugin-refresh-btn svg { width: 14px; height: 14px; }
    `;
    document.head.appendChild(styleEl);
    this.register(() => styleEl.remove());
    // --- Fin de inyección de estilos ---

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
    el.empty();
    // Usamos el elemento 'el' como el contenedor principal para asegurar que los estilos de Obsidian se apliquen correctamente.
    el.addClass("quotes-plugin-container");

    const renderNewQuote = async (quoteGetter) => {
      el.empty(); // Limpiar el contenedor antes de renderizar de nuevo.
      try {
        const quote = await quoteGetter();
        await MarkdownRenderer.renderMarkdown(quote, el, ctx.sourcePath, this);

        // Una vez que el callout está renderizado, añadimos el botón de refresco dentro de él.
        const calloutEl = el.querySelector(".callout");
        if (calloutEl) {
          const refreshBtn = calloutEl.createDiv({ cls: "quotes-plugin-refresh-btn" });
          setIcon(refreshBtn, "refresh-cw");
          refreshBtn.setAttribute("aria-label", this.t("dashboard.refreshTooltip"));
          this.registerDomEvent(refreshBtn, "click", (e) => {
            e.stopPropagation(); // Evitar que el clic se propague a otros elementos.
            this.handleRefresh(el, ctx);
          });
        }
      } catch (error) {
        console.error(this.t("logs.renderError"), error);
        el.setText(this.t("dashboard.noQuotesFound"));
      }
    };

    // Render inicial con la cita del día (que ahora persiste)
    await renderNewQuote(() => this.getCurrentQuote());
  }

  /**
   * Esta función ya no es necesaria para el dashboard, pero la mantenemos
   * por si se usa en otro lugar o para futuras funcionalidades.
   * El dashboard ahora se actualiza dinámicamente.
   * La lógica de actualización diaria se maneja en `getCurrentQuote`.
   */
  async handleRefresh(el, ctx) {
    // Al refrescar, obtenemos una nueva cita aleatoria y la establecemos como la actual
    const newQuote = await this.getRandomQuote(true); // true para forzar una nueva cita
    this.settings.currentDailyQuote = newQuote;
    this.settings.currentQuoteDate = moment().format("YYYY-MM-DD");
    await this.saveData(this.settings);

    // Volvemos a renderizar el bloque completo
    this.renderDashboardQuote(el, ctx);
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

  async getCurrentQuote() {
    const todayStr = moment().format("YYYY-MM-DD");

    // Si la fecha guardada no es hoy, o no hay cita guardada, obtenemos una nueva.
    if (this.settings.currentQuoteDate !== todayStr || !this.settings.currentDailyQuote) {
      console.log(this.t("logs.newDayOrNoQuote"));
      const dailyQuote = await this.getDailyQuote(); // Obtiene la cita determinista para el día
      this.settings.currentDailyQuote = dailyQuote;
      this.settings.currentQuoteDate = todayStr;
      await this.saveData(this.settings);
    }

    const { quote, source } = this.settings.currentDailyQuote;

    if (!quote || !source) {
      return this.t("dashboard.noQuotesFound");
    }

    const formattedQuote = `> [!quote] ${source}\n> ${quote}`;
    console.log(this.t("logs.formattedQuote"), formattedQuote);
    return formattedQuote;
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
    // Devolvemos el objeto para poder guardarlo en settings
    return { quote, source };
  }

  async getRandomQuote(forceNew = false) {
    console.log(this.t("logs.gettingRandomQuote"));
    const quotes = await this.loadQuotes();

    if (!quotes || quotes.length === 0) {
      console.warn(this.t("logs.noQuotesFoundWarning"));
      return { quote: this.t("dashboard.noQuotesFound"), source: "Error" };
    }

    let index = Math.floor(Math.random() * quotes.length);

    // Si se fuerza una nueva y es la misma que la actual, intenta buscar otra
    if (forceNew && this.settings.currentDailyQuote && quotes.length > 1) {
      const currentText = this.settings.currentDailyQuote.quote;
      while (quotes[index].quote === currentText) {
        index = Math.floor(Math.random() * quotes.length);
      }
    }

    console.log(this.t("logs.randomInfo", { index: index }));

    const { quote, source } = quotes[index];
    const formattedQuote = `> [!quote] ${source}\n> ${quote}`;

    console.log(this.t("logs.formattedQuote"), formattedQuote);
    return { quote, source };
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
      // Usamos la cita actual del dashboard, no la determinista del día
      const quoteText = await this.getCurrentQuote();
      if (quoteText !== this.t("dashboard.noQuotesFound")) activeView.editor.replaceSelection(quoteText);
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
