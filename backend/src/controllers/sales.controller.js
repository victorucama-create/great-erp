// backend/src/controllers/sales.controller.js
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const { applyTenant } = require('../utils/tenantUtil');

// Helper: generate invoice number (basic). Improve for concurrency in production (use counters collection).
async function generateInvoiceNumber(tenantId) {
  // Format: INV-{YYYY}-{tenantShort}-{seq}
  const year = new Date().getFullYear();
  // Count invoices for year for this tenant to build a sequence
  const count = await Invoice.countDocuments({ tenantId, createdAt: { $gte: new Date(year + '-01-01') }});
  const seq = (count + 1).toString().padStart(5, '0');
  const tenantSuffix = (tenantId ? String(tenantId).slice(-4) : 'GEN');
  return `INV-${year}-${tenantSuffix}-${seq}`;
}

// Convert Decimal128 fields to string/number for JSON responses
function sanitizeInvoice(inv) {
  if (!inv) return inv;
  const o = JSON.parse(JSON.stringify(inv)); // lean-ish copy
  // Convert Decimal128 strings if present
  if (o.items && Array.isArray(o.items)) {
    o.items = o.items.map(it => {
      return {
        ...it,
        unitPrice: it.unitPrice ? it.unitPrice.toString() : '0',
        discount: it.discount ? it.discount.toString() : '0',
        total: it.total ? it.total.toString() : '0'
      };
    });
  }
  o.subtotal = o.subtotal ? o.subtotal.toString() : '0';
  o.totalTax = o.totalTax ? o.totalTax.toString() : '0';
  o.totalDiscount = o.totalDiscount ? o.totalDiscount.toString() : '0';
  o.total = o.total ? o.total.toString() : '0';
  if (o.payments) o.payments = o.payments.map(p => ({ ...p, amount: p.amount ? p.amount.toString() : '0' }));
  return o;
}

// Create invoice (detailed)
async function createInvoice(req, res) {
  try {
    const tenantId = req.user.role === 'super_admin' && req.body.tenantId ? req.body.tenantId : req.user.tenantId;
    if (!tenantId) return res.status(400).json({ success:false, error: 'tenant_missing' });

    const payload = req.body;
    const items = payload.items || [];
    if (!items.length) return res.status(400).json({ success:false, error: 'items_required' });

    // Build items with product info if productId provided
    let subtotal = 0, totalTax = 0, totalDiscount = 0;
    const builtItems = [];
    for (const it of items) {
      let product = null;
      if (it.productId) product = await Product.findById(it.productId).lean();
      const unitPrice = it.unitPrice != null ? Number(it.unitPrice) : (product ? Number(product.salePrice.toString()) : 0);
      const qty = Number(it.qty || 1);
      const discount = Number(it.discount || 0); // absolute discount per line
      const taxRate = Number(it.taxRate || 0); // %
      const lineNet = (unitPrice * qty) - discount;
      const tax = (lineNet * (taxRate/100));
      const lineTotal = lineNet + tax;

      subtotal += (unitPrice * qty);
      totalDiscount += discount;
      totalTax += tax;

      builtItems.push({
        productId: product?._id : (it.productId || null),
        sku: product? product.sku : (it.sku || ''),
        name: product ? product.name : (it.name || ''),
        qty: qty,
        unitPrice: mongoose.Types.Decimal128.fromString(String(unitPrice)),
        discount: mongoose.Types.Decimal128.fromString(String(discount)),
        taxRate: taxRate,
        total: mongoose.Types.Decimal128.fromString(String(lineTotal))
      });
    }

    const total = subtotal - totalDiscount + totalTax;
    const invoiceNumber = await generateInvoiceNumber(tenantId);

    const inv = await Invoice.create({
      tenantId,
      invoiceNumber,
      customer: payload.customer || {},
      items: builtItems,
      subtotal: mongoose.Types.Decimal128.fromString(String(subtotal)),
      totalTax: mongoose.Types.Decimal128.fromString(String(totalTax)),
      totalDiscount: mongoose.Types.Decimal128.fromString(String(totalDiscount)),
      total: mongoose.Types.Decimal128.fromString(String(total)),
      currency: payload.currency || 'MZN',
      status: payload.status || 'pending',
      notes: payload.notes || '',
      meta: payload.meta || {},
      createdBy: req.user.id
    });

    // If status is pending/paid, adjust stock (for sales we decrement stock)
    if (['pending','paid'].includes(inv.status)) {
      for (const line of inv.items) {
        if (!line.productId) continue;
        // create stock movement OUT
        const warehouseId = payload.warehouseId || null; // optional
        await StockMovement.create({
          productId: line.productId,
          warehouseId,
          type: 'OUT',
          qty: Number(line.qty),
          reference: inv._id.toString(),
          reason: 'Sale created',
          createdBy: req.user.id,
          tenantId: tenantId
        });

        // update stock qty
        let stock = await Stock.findOne({ productId: line.productId, warehouseId });
        let newQty = (stock?.qty || 0) - Number(line.qty);
        if (newQty < 0) newQty = 0;
        if (stock) {
          stock.qty = newQty;
          await stock.save();
        } else {
          await Stock.create({ productId: line.productId, warehouseId, qty: Math.max(0, -Number(line.qty)) * 0 }); // leave 0 if none
        }

        // recompute product stockTotal
        const agg = await Stock.aggregate([
          { $match: { productId: mongoose.Types.ObjectId(line.productId) } },
          { $group: { _id: '$productId', sumQty: { $sum: '$qty' } } }
        ]);
        const totalStock = agg[0] ? agg[0].sumQty : 0;
        await Product.findByIdAndUpdate(line.productId, { stockTotal: totalStock });
      }
    }

    return res.json({ success:true, data: sanitizeInvoice(inv) });
  } catch (err) {
    console.error('createInvoice error:', err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

// POS quick sale (creates invoice + immediate payment + reduces stock)
async function createPosSale(req, res) {
  try {
    const payload = req.body;
    payload.status = 'paid';
    // set payment immediately
    payload.payments = payload.payments || [{
      method: payload.paymentMethod || 'cash',
      reference: payload.paymentReference || null,
      amount: payload.amountPaid || null,
      currency: payload.currency || 'MZN',
      paidAt: new Date(),
      receivedBy: req.user.id
    }];

    // forward to createInvoice (but ensure tenantId present)
    req.body = payload;
    return await createInvoice(req, res);
  } catch (err) {
    console.error('createPosSale error:', err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

async function listInvoices(req, res) {
  try {
    const filter = applyTenant({}, req.tenantFilter);
    // optional date range, status filter
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    // sanitize decimals
    const sanitized = invoices.map(inv => sanitizeInvoice(inv));
    return res.json({ success:true, data: sanitized });
  } catch (err) {
    console.error('listInvoices err:', err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

async function getInvoice(req, res) {
  try {
    const id = req.params.id;
    const inv = await Invoice.findById(id).populate('attachments').lean();
    if (!inv) return res.status(404).json({ success:false, error:'not_found' });
    return res.json({ success:true, data: sanitizeInvoice(inv) });
  } catch (err) {
    console.error('getInvoice err:', err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

// Register a payment for invoice
async function payInvoice(req, res) {
  try {
    const id = req.params.id;
    const { method, reference, amount, currency } = req.body;
    const inv = await Invoice.findById(id);
    if (!inv) return res.status(404).json({ success:false, error:'not_found' });

    const amt = mongoose.Types.Decimal128.fromString(String(amount || 0));
    const payment = {
      method: method || 'unknown',
      reference: reference || null,
      amount: amt,
      currency: currency || inv.currency,
      paidAt: new Date(),
      receivedBy: req.user.id
    };
    inv.payments = inv.payments || [];
    inv.payments.push(payment);

    // compute totalPaid
    const totalPaid = inv.payments.reduce((acc, p) => acc + Number(p.amount.toString()), 0);
    const invoiceTotal = Number(inv.total.toString());
    if (totalPaid >= invoiceTotal) inv.status = 'paid';
    else if (totalPaid > 0) inv.status = 'pending';

    await inv.save();

    return res.json({ success:true, data: sanitizeInvoice(inv) });
  } catch (err) {
    console.error('payInvoice err:', err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

// Cancel invoice
async function cancelInvoice(req, res) {
  try {
    const id = req.params.id;
    const inv = await Invoice.findById(id);
    if (!inv) return res.status(404).json({ success:false, error:'not_found' });
    inv.status = 'cancelled';
    await inv.save();
    return res.json({ success:true, data: sanitizeInvoice(inv) });
  } catch (err) {
    console.error('cancelInvoice err:', err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

// Export invoices CSV
async function exportInvoicesCsv(req, res) {
  try {
    const filter = applyTenant({}, req.tenantFilter);
    const invoices = await Invoice.find(filter).lean();
    // Build CSV rows
    const rows = invoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      createdAt: inv.createdAt.toISOString(),
      customer: inv.customer?.name || '',
      total: inv.total ? inv.total.toString() : '0',
      status: inv.status
    }));
    const header = Object.keys(rows[0] || {});
    const csv = [header.join(',')]
      .concat(rows.map(r => header.map(h => `"${(r[h] || '').toString().replace(/"/g,'""')}"`).join(',')))
      .join('\n');

    res.setHeader('Content-disposition', 'attachment; filename=invoices.csv');
    res.set('Content-Type', 'text/csv');
    return res.status(200).send(csv);
  } catch (err) {
    console.error('exportInvoicesCsv err:', err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

// Export single invoice as HTML (printable)
async function exportInvoiceHtml(req, res) {
  try {
    const id = req.params.id;
    const inv = await Invoice.findById(id).populate('attachments').lean();
    if (!inv) return res.status(404).send('Invoice not found');

    // Build a simple HTML invoice
    const itemsHtml = (inv.items || []).map(it => `
      <tr>
        <td>${it.sku || ''}</td>
        <td>${it.name || ''}</td>
        <td style="text-align:center">${it.qty}</td>
        <td style="text-align:right">${it.unitPrice ? it.unitPrice.toString() : '0'}</td>
        <td style="text-align:right">${it.total ? it.total.toString() : '0'}</td>
      </tr>
    `).join('');

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${inv.invoiceNumber}</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;color:#222;padding:20px}
          .header{display:flex;justify-content:space-between;align-items:center}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          th,td{padding:8px;border-bottom:1px solid #eee}
          .right{text-align:right}
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2>Great Nexus</h2>
            <div>Invoice: ${inv.invoiceNumber}</div>
            <div>Date: ${new Date(inv.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <strong>Customer</strong><br/>
            ${inv.customer?.name || ''}<br/>
            ${inv.customer?.email || ''}<br/>
            ${inv.customer?.phone || ''}
          </div>
        </div>

        <table>
          <thead>
            <tr><th>SKU</th><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Line Total</th></tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top:12px;display:flex;justify-content:flex-end">
          <table style="width:320px">
            <tr><td>Subtotal</td><td class="right">${inv.subtotal ? inv.subtotal.toString() : '0'}</td></tr>
            <tr><td>Tax</td><td class="right">${inv.totalTax ? inv.totalTax.toString() : '0'}</td></tr>
            <tr><td><strong>Total</strong></td><td class="right"><strong>${inv.total ? inv.total.toString() : '0'}</strong></td></tr>
            <tr><td>Status</td><td class="right">${inv.status}</td></tr>
          </table>
        </div>

        <div style="margin-top:24px">
          <strong>Notes</strong>
          <div>${inv.notes || ''}</div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-disposition', `attachment; filename=${inv.invoiceNumber}.html`);
    res.set('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    console.error('exportInvoiceHtml err:', err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

module.exports = {
  createInvoice,
  createPosSale,
  listInvoices,
  getInvoice,
  payInvoice,
  cancelInvoice,
  exportInvoicesCsv,
  exportInvoiceHtml
};
