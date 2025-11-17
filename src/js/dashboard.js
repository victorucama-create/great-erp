// dashboard.js - inicialização do módulo dashboard
function moduleInit_dashboard(){
  // Setup demo charts (Chart.js already loaded? include Chart.js if needed in index.html)
  (async function init(){
    // Attempt to fetch real data from API (fallback to demo arrays)
    let sales7 = [12000, 18500, 14000, 19500, 22000, 16000, 21000];
    let labels7 = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

    // Kpis demo - in production call API.get('/erp/dashboard/kpis')
    document.getElementById("dashSalesMonth").innerText = formatMoney(245700);
    document.getElementById("dashCash").innerText = formatMoney(75400);
    document.getElementById("dashMola").innerText = formatMoney(125200);
    document.getElementById("dashB2B").innerText = "12";

    // render charts using Chart.js - ensure Chart.js is loaded in index.html
    try {
      const ctx1 = document.getElementById("chartSales7").getContext("2d");
      new Chart(ctx1, {
        type: 'line',
        data: { labels: labels7, datasets: [{ label: 'Vendas', data: sales7, borderColor: '#0b74e6', backgroundColor: 'rgba(11,116,230,0.08)', tension:0.3 }] },
        options: { plugins:{legend:{display:false}}, scales:{y:{ticks:{callback: v => 'MZN ' + v}}} }
      });
    } catch(e){ console.warn('chart error',e) }

    // recent activities (demo)
    const recent = [
      "05/11/2025 — Fatura INV-2025-1001 paga",
      "03/11/2025 — Nova empresa cadastrada (Empresa X)",
      "02/11/2025 — Pedido B2B #B2B-23 finalizado",
    ];
    const container = document.getElementById("dashRecent");
    if (container) container.innerHTML = recent.map(r => `<li>${r}</li>`).join("");

    // alerts (demo)
    const alerts = [
      { level:'critical', text:'Stock baixo: Produto PRD-002 (10 unidades)' },
      { level:'warning', text:'Assinatura expira em 5 dias: Tenant Acme' }
    ];
    const acont = document.getElementById("dashAlerts");
    if (acont) acont.innerHTML = alerts.map(a => `<li><strong>${a.level.toUpperCase()}</strong> — ${a.text}</li>`).join("");

    // bind actions
    const btnNewSale = document.getElementById("btnNewSale");
    if (btnNewSale) btnNewSale.addEventListener("click", ()=> {
      alert("Abrir modal Nova Venda (implementar)");
    });
    const btnExport = document.getElementById("btnExportPdf");
    if (btnExport) btnExport.addEventListener("click", ()=> window.print());
  })();
}

function formatMoney(v){ return new Intl.NumberFormat('pt-PT',{ style:'decimal', minimumFractionDigits:0 }).format(v) + ' MZN'; }
