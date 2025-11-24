// Sistema de Gestão de Estoque - Tema
// Controle de modo escuro/claro

class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem("theme") || "light";
    this.init();
  }

  init() {
    this.setTheme(this.theme);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme());
    }

    // Escutar mudanças no sistema
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          this.setTheme(e.matches ? "dark" : "light");
        }
      });
  }

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
    this.setTheme(this.theme);
    localStorage.setItem("theme", this.theme);
  }

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);

    const themeIcon = document.querySelector(".theme-icon");
    if (themeIcon) {
      themeIcon.textContent = theme === "light" ? "🌙" : "☀️";
    }

    // Atualizar meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme === "light" ? "#ffffff" : "#0f172a";
    }
  }

  getCurrentTheme() {
    return this.theme;
  }
}

// Inicializar o gerenciador de tema quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  window.themeManager = new ThemeManager();
});

// Exportar para uso global
window.ThemeManager = ThemeManager;
