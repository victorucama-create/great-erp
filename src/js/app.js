// app.js - skeleton app loader
(async function(){
  const content = document.getElementById("gnContent");
  const menuItems = document.querySelectorAll(".gn-item");
  const yearEl = document.getElementById("gnYear");
  yearEl.innerText = new Date().getFullYear();

  // i18n minimal (pt/en)
  const translations = {
    pt: {},
    en: {}
  };
  const langSelect = document.getElementById("gnLang");
  langSelect.value = localStorage.getItem("gn_lang") || "pt";
  langSelect.addEventListener("change", (e) => {
    localStorage.setItem("gn_lang", e.target.value);
    // Programador: aplicar traduções no UI
  });

  // load module (fetch html from modules/)
  async function loadModule(name){
    content.innerHTML = '<div class="gn-loading-card card"><div class="spinner"></div><p>Carregando...</p></div>';
    try {
      const resp = await fetch(`modules/${name}.html`);
      if (!resp.ok) throw new Error("Módulo não encontrado");
      const html = await resp.text();
      content.innerHTML = html;
      // call module init if exists e.g., window.moduleInit_dashboard()
      const fn = window["moduleInit_" + name];
      if (typeof fn === "function") fn();
    } catch (err) {
      content.innerHTML = `<div class="card"><h3>Erro ao carregar módulo</h3><pre>${err.message}</pre></div>`;
    }
  }

  // menu events
  menuItems.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      menuItems.forEach(x => x.classList.remove("active"));
      a.classList.add("active");
      const module = a.getAttribute("data-module");
      loadModule(module);
    });
  });

  // logout
  document.getElementById("gnLogout").addEventListener("click", () => {
    sessionStorage.removeItem("gn_token");
    alert("Logout (demo) — implementar fluxo real no backend");
    // programador: redirecionar para /login
  });

  // initial module
  await loadModule("dashboard");
  // fetch kpis initial (demo)
  document.getElementById("kpi-sales-today").innerText = "—";
  document.getElementById("kpi-cash").innerText = "—";
})();
