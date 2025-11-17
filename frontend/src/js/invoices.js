// frontend/src/js/invoices.js
// Functions to manage invoices UI
async function moduleInit_invoices() {
  const tbody = document.getElementById('invoicesTbody');
  const btnNewInvoice = document.getElementById('btnNewInvoice');
  const btnNewPos = document.getElementById('btnNewPos');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const searchInput = document.getElementById('invoiceSearch');
  const filterStatus = document.getElementById('filterStatus');
  const invoiceModal = document.getElementById('invoiceModal');

  async function loadInvoices() {
    try {
      const q = [];
      if (filterStatus.value) q.push(`status=${encodeURIComponent(filterStatus.value)}`);
      const url = '/api/v1/erp/sales/invoices' + (q.length ? `?${q.join('&')}` : '');
      const res = await API.get(url);
      const invoices = res.data || res;
      renderTable(invoices);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar faturas. Ver console.');
    }
  }

  function renderTable(invoices) {
    tbody.innerHTML = invoices
      .filter(inv => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) return true;
        return (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
               (inv.customer && inv.customer.name && inv.customer.name.toLowerCase().includes(q)) ||
               (inv.items && inv.items.some(it => (it.sku || '').toLowerCase().includes(q) || (it.name || '').toLowerCase().includes(q)));
      })
      .map(inv => `
        <tr>
          <td style="white-space:nowrap">${inv.invoiceNumber}</td>
          <td>${inv.customer?.name || '-'}</td>
          <td>${new Date(inv.createdAt).toLocaleDateString()}</td>
          <td style="text-align:right">${formatMoney(Number(inv.total || 0))}</td>
          <td>${inv.status}</td>
          <td style="white-space:nowrap">
            <button class="btn ghost small" onclick="viewInvoice('${inv._id}')"><i class="fa fa-eye"></i></button>
            <button class="btn ghost small" onclick="printInvoice('${inv._id}')"><i class="fa fa-print"></i></button>
            <button class="btn ghost small" onclick="downloadInvoicePdf('${inv._id}')"><i class="fa fa-file-pdf"></i></button>
            <button class="btn ghost small" onclick="payInvoiceUi('${inv._id}')"><i class="fa fa-credit-card"></i></button>
          </td>
        </tr>
      `).join('');
  }

  // Global functions accessible from UI buttons
  window.viewInvoice = async function(id) {
    try {
      const res = await API.get(`/sales/invoices/${id}`);
      const inv = res.data;
      showModalInvoice(inv);
    } catch (err) {
      console.error(err); alert('Erro ao obter fatura');
    }
  };

  window.printInvoice = function(id) {
    window.open(`/api/v1/erp/sales/export/invoices/${id}/html`, '_blank');
  };

  window.downloadInvoicePdf = function(id) {
    window.open(`/api/v1/erp/sales/export/invoices/${id}/pdf`, '_blank');
  };

  window.payInvoiceUi = function(id) {
    showModal(`
      <div class="card" style="width:520px;max-width:92%;">
        <h3>Registar Pagamento</h3>
        <div style="display:grid;gap:8px">
          <select id="payMethod"><option value="cash">Dinheiro</option><option value="card">Cartão</option><option value="transfer">Transferência</option><option value="mpesa">M-Pesa</option></select>
          <input id="payAmount" type="number" placeholder="Montante" />
          <input id="payReference" placeholder="Referência (opcional)" />
          <div style="display:flex;justify-content:flex-end;gap:8px">
            <button onclick="closeModal()" class="btn ghost">Cancelar</button>
            <button id="doPayBtn" class="btn">Confirmar</button>
          </div>
        </div>
      </div>
    `);
    document.getElementById('doPayBtn').addEventListener('click', async () => {
      const method = document.getElementById('payMethod').value;
      const amount = Number(document.getElementById('payAmount').value || 0);
      const reference = document.getElementById('payReference').value || null;
      try {
        const token = sessionStorage.getItem('gn_token');
        const res = await fetch(`/api/v1/erp/sales/invoices/${id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization': token? 'Bearer '+token : '' },
          body: JSON.stringify({ method, reference, amount })
        });
        if (!res.ok) throw new Error('payment failed');
        await loadInvoices();
        closeModal();
        alert('Pagamento registado');
      } catch (err) {
        console.error(err); alert('Erro ao registar pagamento');
      }
    });
  };

  function showModal(html) {
    invoiceModal.classList.remove('hidden');
    invoiceModal.innerHTML = html;
  }
  window.closeModal = function() { invoiceModal.classList.add('hidden'); invoiceModal.innerHTML = ''; }

  function showModalInvoice(inv) {
    const itemsHtml = (inv.items || []).map(it => `<tr><td>${it.sku || ''}</td><td>${it.name || ''}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${it.unitPrice}</td><td style="text-align:right">${it.total}</td></tr>`).join('');
    showModal(`
      <div class="card" style="width:900px;max-width:96%;">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><h3>${inv.invoiceNumber}</h3><div>${inv.customer?.name || ''}</div></div>
          <div style="text-align:right">
            <div>${new Date(inv.createdAt).toLocaleString()}</div>
            <div><strong>${inv.status}</strong></div>
          </div>
        </div>
        <table style="width:100%;margin-top:12px">
          <thead><tr><th>SKU</th><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="display:flex;justify-content:flex-end;margin-top:12px">
          <div style="width:320px">
            <div style="display:flex;justify-content:space-between"><div>Subtotal</div><div>${inv.subtotal}</div></div>
            <div style="display:flex;justify-content:space-between"><div>Tax</div><div>${inv.totalTax}</div></div>
            <div style="display:flex;justify-content:space-between;font-weight:800"><div>Total</div><div>${inv.total}</div></div>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:12px;gap:8px">
          <button onclick="closeModal()" class="btn ghost">Fechar</button>
          <button class="btn" onclick="downloadInvoicePdf('${inv._id}')">Baixar PDF</button>
        </div>
      </div>
    `);
  }

  // New invoice modal
  btnNewInvoice.addEventListener('click', () => {
    showModal(`
      <div class="card" style="width:900px;max-width:96%;">
        <h3>Nova Fatura</h3>
        <div style="display:grid;grid-template-columns:1fr 300px;gap:12px">
          <div>
            <input id="custName" placeholder="Nome do cliente" />
            <input id="custEmail" placeholder="Email" />
            <div id="itemsEditor">
              <div style="display:flex;gap:8px;margin-top:8px">
                <input id="it_sku" placeholder="SKU" />
                <input id="it_name" placeholder="Nome do item" />
                <input id="it_qty" type="number" placeholder="Qtd" value="1" style="width:80px" />
                <input id="it_price" type="number" placeholder="Preço unit" style="width:120px" />
                <button id="addLineBtn" class="btn ghost">Adicionar</button>
              </div>
              <table id="editorTable" style="width:100%;margin-top:8px"><thead><tr><th>SKU</th><th>Nome</th><th>Qtd</th><th>Unit</th><th></th></tr></thead><tbody></tbody></table>
            </div>
          </div>
          <div>
            <div style="background:#fbfdff;padding:12px;border-radius:8px">
              <div>Subtotal: <strong id="ed_sub">0</strong></div>
              <div>Tax: <strong id="ed_tax">0</strong></div>
              <div>Total: <strong id="ed_total">0</strong></div>
            </div>
            <div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px">
              <button onclick="closeModal()" class="btn ghost">Cancelar</button>
              <button id="createInvoiceBtn" class="btn">Criar Fatura</button>
            </div>
          </div>
        </div>
      </div>
    `);

    const editorTable = document.querySelector('#editorTable tbody');
    const addLineBtn = document.getElementById('addLineBtn');

    const lines = [];
    function refreshEditor() {
      editorTable.innerHTML = lines.map((l, i) => `<tr><td>${l.sku}</td><td>${l.name}</td><td style="text-align:center">${l.qty}</td><td style="text-align:right">${l.unit}</td><td><button class="btn ghost small" onclick="editorRemove(${i})">Rem</button></td></tr>`).join('');
      const subtotal = lines.reduce((s, l) => s + (Number(l.unit) * Number(l.qty)), 0);
      document.getElementById('ed_sub').innerText = formatMoney(subtotal);
      document.getElementById('ed_total').innerText = formatMoney(subtotal); // no tax in editor default
    }
    window.editorRemove = (i) => { lines.splice(i,1); refreshEditor(); };

    addLineBtn.addEventListener('click', () => {
      const sku = document.getElementById('it_sku').value || '';
      const name = document.getElementById('it_name').value || '';
      const qty = Number(document.getElementById('it_qty').value || 1);
      const unit = Number(document.getElementById('it_price').value || 0);
      lines.push({ sku, name, qty, unit });
      document.getElementById('it_sku').value = '';
      document.getElementById('it_name').value = '';
      document.getElementById('it_qty').value = 1;
      document.getElementById('it_price').value = '';
      refreshEditor();
    });

    document.getElementById('createInvoiceBtn').addEventListener('click', async () => {
      const custName = document.getElementById('custName').value || 'Cliente';
      if (!lines.length) return alert('Adicionar pelo menos uma linha');
      const items = lines.map(l => ({ sku: l.sku, name: l.name, qty: l.qty, unitPrice: l.unit }));
      try {
        const token = sessionStorage.getItem('gn_token');
        const res = await fetch('/api/v1/erp/sales/invoices', {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization': token? 'Bearer '+token : '' },
          body: JSON.stringify({ customer: { name: custName }, items })
        });
        if (!res.ok) throw new Error('create invoice failed');
        await loadInvoices();
        closeModal();
        alert('Fatura criada');
      } catch (err) {
        console.error(err); alert('Erro ao criar fatura');
      }
    });

  });

  // POS quick sale
  btnNewPos.addEventListener('click', () => {
    showModal(`
      <div class="card" style="width:520px;max-width:92%;">
        <h3>POS Rápida</h3>
        <input id="pos_sku" placeholder="SKU ou nome" />
        <input id="pos_qty" type="number" placeholder="Quantidade" value="1" />
        <input id="pos_price" type="number" placeholder="Preço unit" />
        <select id="pos_payment"><option value="cash">Dinheiro</option><option value="card">Cartão</option></select>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
          <button onclick="closeModal()" class="btn ghost">Cancelar</button>
          <button id="posCreateBtn" class="btn">Vender</button>
        </div>
      </div>
    `);
    document.getElementById('posCreateBtn').addEventListener('click', async () => {
      const sku = document.getElementById('pos_sku').value;
      const qty = Number(document.getElementById('pos_qty').value || 1);
      const unit = Number(document.getElementById('pos_price').value || 0);
      const paymentMethod = document.getElementById('pos_payment').value;
      try {
        const token = sessionStorage.getItem('gn_token');
        const res = await fetch('/api/v1/erp/sales/pos', {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization': token? 'Bearer '+token : '' },
          body: JSON.stringify({ items: [{ sku, name: sku, qty, unitPrice: unit }], amountPaid: unit * qty, paymentMethod })
        });
        if (!res.ok) throw new Error('pos failed');
        await loadInvoices();
        closeModal();
        alert('Venda registada');
      } catch (err) {
        console.error(err); alert('Erro ao registar venda');
      }
    });
  });

  btnExportCsv.addEventListener('click', () => {
    window.open('/api/v1/erp/sales/export/invoices/csv', '_blank');
  });

  document.getElementById('btnSearchInv').addEventListener('click', loadInvoices);
  searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') loadInvoices() });
  filterStatus.addEventListener('change', loadInvoices);

  await loadInvoices();
}

// helper format
function formatMoney(v){ return new Intl.NumberFormat('pt-PT',{ style:'decimal', minimumFractionDigits:0 }).format(v) + ' MZN'; }
