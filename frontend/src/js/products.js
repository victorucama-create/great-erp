// products.js - front module
function moduleInit_products(){
  // elements
  const tbody = document.getElementById('productsTbody');
  const search = document.getElementById('productSearch');
  const btnAdd = document.getElementById('btnAddProduct');
  const btnExport = document.getElementById('btnExportProducts');
  const modal = document.getElementById('productModal');

  // load products
  async function loadProducts(q='') {
    try {
      const res = await API.get('/erp/products');
      const products = res.data || res;
      renderTable(products.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())));
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar produtos (ver console)');
    }
  }

  function renderTable(products) {
    tbody.innerHTML = products.map(p => `
      <tr>
        <td style="padding:8px">${p.sku}</td>
        <td style="padding:8px">${p.name}</td>
        <td style="padding:8px">${p.category || ''}</td>
        <td style="padding:8px">${formatMoney(p.salePrice || 0)}</td>
        <td style="padding:8px">${p.stockTotal || 0}</td>
        <td style="padding:8px">
          <button class="btn ghost small" data-id="${p.id}" onclick="editProduct('${p.id}')">Editar</button>
          <button class="btn ghost small" data-id="${p.id}" onclick="attachFile('${p.id}')">Anexar</button>
        </td>
      </tr>
    `).join('');
  }

  // global helpers exposed for inline handlers
  window.editProduct = async function(id) {
    // fetch product
    try {
      const res = await API.get(`/erp/products/${id}`);
      const p = res.data;
      showProductModal(p);
    } catch (err) { console.error(err); alert('Erro'); }
  };

  window.attachFile = function(productId){
    showModal(`<div class="card">
      <h3>Anexar ficheiro</h3>
      <input type="file" id="fileAttach" />
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
        <button onclick="closeModal()" class="btn ghost">Cancelar</button>
        <button id="doAttach" class="btn">Enviar</button>
      </div>
    </div>`);
    document.getElementById('doAttach').addEventListener('click', async () => {
      const f = document.getElementById('fileAttach').files[0];
      if (!f) return alert('Selecione um ficheiro');
      const fd = new FormData(); fd.append('file', f);
      try {
        const token = sessionStorage.getItem('gn_token');
        const res = await fetch(`/api/v1/erp/products/${productId}/attachments`, {
          method:'POST', headers: { 'Authorization': token ? 'Bearer '+token : '' }, body: fd
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        alert('Ficheiro carregado');
        closeModal();
      } catch (err) {
        console.error(err); alert('Erro ao enviar ficheiro');
      }
    });
  };

  function showProductModal(product = null) {
    const id = product?.id || '';
    showModal(`<div class="card">
      <h3>${product ? 'Editar Produto' : 'Novo Produto'}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <input id="m_sku" placeholder="SKU" value="${product?.sku || ''}" />
        <input id="m_name" placeholder="Nome" value="${product?.name || ''}" />
        <input id="m_category" placeholder="Categoria" value="${product?.category || ''}" />
        <input id="m_salePrice" placeholder="Preço venda" type="number" value="${product?.salePrice || 0}" />
        <input id="m_costPrice" placeholder="Preço custo" type="number" value="${product?.costPrice || 0}" />
        <input id="m_reorder" placeholder="Reorder level" type="number" value="${product?.reorderLevel || 0}" />
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
        <button onclick="closeModal()" class="btn ghost">Cancelar</button>
        <button id="saveProductBtn" class="btn">${product ? 'Guardar' : 'Criar'}</button>
      </div>
    </div>`);
    document.getElementById('saveProductBtn').addEventListener('click', async () => {
      const body = {
        sku: document.getElementById('m_sku').value,
        name: document.getElementById('m_name').value,
        category: document.getElementById('m_category').value,
        salePrice: Number(document.getElementById('m_salePrice').value || 0),
        costPrice: Number(document.getElementById('m_costPrice').value || 0),
        reorderLevel: Number(document.getElementById('m_reorder').value || 0)
      };
      try {
        const token = sessionStorage.getItem('gn_token');
        const url = id ? `/api/v1/erp/products/${id}` : '/api/v1/erp/products';
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type':'application/json', 'Authorization': token? 'Bearer '+token:'' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('save failed');
        closeModal();
        await loadProducts(search.value);
      } catch (err) { console.error(err); alert('Erro ao salvar'); }
    });
  }

  // modal helpers (reuse from app if exists)
  function showModal(html) {
    modal.classList.remove('hidden');
    modal.innerHTML = html;
  }
  window.closeModal = function() { modal.classList.add('hidden'); modal.innerHTML = ''; }

  // search
  search.addEventListener('input', (e) => loadProducts(e.target.value));

  btnAdd.addEventListener('click', () => showProductModal());
  btnExport.addEventListener('click', () => window.open('/api/v1/erp/products-export/csv'));

  // initial load
  loadProducts();
}
