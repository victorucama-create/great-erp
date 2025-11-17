// backend/src/controllers/sales.controller.js
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const Counter = require('../models/Counter');
const { applyTenant } = require('../utils/tenantUtil');
const PDFDocument = require('pdfkit');
const stream = require('stream');

// Helper: get next sequence for a given key, atomic
async function nextSequence(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

// Generate invoice number using atomic counter per tenant per year
async function generateInvoiceNumberAtomic(tenantId) {
  const year = new Date().getFullYear();
  const tenantSuffix = tenantId ? String(tenantId).slice(-6) : 'GEN';
  const key = `invoice_${year}_${tenantId ? tenantId.toString() : 'general'}`;
  const seq = await nextSequence(key);
  const seqStr = String(seq).padStart(6, '0');
  return `INV-${year}-${tenantSuffix}-${seqStr}`;
}

// Convert Decimal128 fields to string for JSON responses
function sanitizeInvoice(inv) {
  if (!inv) return inv;
  const o = JSON.parse(JSON.stringify(inv)); // basic deep copy
  if (o.items && Array.isArray(o.items)) {
    o.items = o.items.map(it => ({
      ...it,
      unitPrice: it.unitPrice ? it.unitPrice.toString() : '0',
      discount: it.discount ? it.discount.toString() : '0',
      total: it.total ? it.total.toString() : '0'
    }));
  }
  o.subtotal = o.subtotal ? o.subtotal.toString() : '0';
  o.totalTax = o.totalTax ? o.totalTax.toString() : '0';
  o.totalDiscount = o.totalDiscount ? o.totalDiscount.toString() : '0';
  o.total = o.total ? o.total.toString() : '0';
  if (o.payments) o.payments = o.payments.map(p => ({ ...p, amount: p.amount ? p.amount.toString() : '0' }));
  return o;
}

// Create invoice (detailed) — uses atomic invoice numbers
async function createInvoice(req, res) {
  try {
    const tenantId = req.user.role === 'super_admin' && req.body.tenantId ? req.body.tenantId : req.user.tenantId;
    if (!tenantId) return res.status(400).json({ success:false, error: 'tenant_missing' });

    const payload = req.body;
    const items = payload.items || [];
    if (!items.length) return res.status(400).json({ success:false, error: 'items_required' });

    let subtotal = 0, totalTax = 0, totalDiscount = 0;
    const builtItems = [];

    for (const it of items) {
      let product = null;
      if (it.productId) product = await Product.findById(it.productId).lean();
      const unitPrice = it.unitPrice != null ? Number(it.unitPrice) : (product ? Number(product.salePrice.toString()) : 0);
      const qty = Number(it.qty || 1);
      const discount = Number(it.discount || 0);
      const taxRate = Number(it.taxRate || 0);
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
    const invoiceNumber = await generateInvoiceNumberAtomic(tenantId);

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

    // If invoice status is pending/paid decrement stock
    if (['pending','paid'].includes(inv.status)) {
      for (const line of inv.items) {
        if (!line.productId) continue;
        const warehouseId = payload.warehouseId || null;
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

        let stock = await Stock.findOne({ productId: line.productId, warehouseId });
        let newQty = (stock?.qty || 0) - Number(line.qty);
        if (newQty < 0) newQty = 0;
        if (stock) {
          stock.qty = newQty;
          await stock.save();
        } else {
          await Stock.create({ productId: line.productId, warehouseId, qty: 0 });
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

// POS quick sale (immediate payment) — reuses createInvoice and marks paid
async function createPosSale(req, res) {
  try {
    const payload = req.body;
    payload.status = 'paid';
    payload.payments = payload.payments || [{
      method: payload.paymentMethod || 'cash',
      reference: payload.paymentReference || null,
      amount: payload.amountPaid || null,
      currency: payload.currency || 'MZN',
      paidAt: new Date(),
      receivedBy: req.user.id
    }];

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
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(1000).lean();
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

// Export single invoice as HTML (printable) — unchanged
async function exportInvoiceHtml(req, res) {
  try {
    const id = req.params.id;
    const inv = await Invoice.findById(id).populate('attachments').lean();
    if (!inv) return res.status(404).send('Invoice not found');

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

// New: Export invoice as PDF using PDFKit (Minimalista Premium)
/**
 * GET /api/v1/erp/sales/export/invoices/:id/pdf
 */
async function exportInvoicePdf(req, res) {
  try {
    const id = req.params.id;
    const inv = await Invoice.findById(id).populate('attachments').lean();
    if (!inv) return res.status(404).send('Invoice not found');

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-disposition', `attachment; filename=${inv.invoiceNumber}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfData);
    });

    // Header — Minimalista Premium
    doc.image('','', { width: 0 }); // keep placeholder if you want to image logo via path
    doc.fillColor('#0B74E6').fontSize(20).text('Great Nexus', { continued: true }).fillColor('#000').fontSize(10);
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#333').text(`Invoice: ${inv.invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(inv.createdAt).toLocaleString()}`, { align: 'right' });
    doc.moveDown();

    // Customer
    doc.fontSize(12).fillColor('#000').text('Bill To:', { underline: true });
    doc.fontSize(10).fillColor('#333').text(inv.customer?.name || '');
    if (inv.customer?.email) doc.text(inv.customer.email);
    if (inv.customer?.phone) doc.text(inv.customer.phone);
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y + 10;
    doc.fontSize(10).fillColor('#fff');
    // header background
    doc.rect(40, tableTop - 4, 515, 20).fill('#0B74E6');
    doc.fillColor('#fff').text('SKU', 50, tableTop, { width: 100 });
    doc.text('Item', 110, tableTop, { width: 220 });
    doc.text('Qty', 340, tableTop, { width: 50, align: 'center' });
    doc.text('Unit', 395, tableTop, { width: 70, align: 'right' });
    doc.text('Total', 475, tableTop, { width: 80, align: 'right' });
    doc.moveDown(1.8);

    // Items
    doc.fillColor('#222');
    for (const it of inv.items) {
      const y = doc.y;
      doc.fontSize(10).text(it.sku || '', 50, y, { width: 100 });
      doc.text(it.name || '', 110, y, { width: 220 });
      doc.text(String(it.qty || 0), 340, y, { width: 50, align: 'center' });
      doc.text(it.unitPrice ? it.unitPrice.toString() : '0', 395, y, { width: 70, align: 'right' });
      doc.text(it.total ? it.total.toString() : '0', 475, y, { width: 80, align: 'right' });
      doc.moveDown();
    }

    // Totals
    doc.moveDown(1);
    const rightX = 475;
    doc.fontSize(10).text('Subtotal', 395, doc.y, { width: 70, align: 'right' });
    doc.text(inv.subtotal ? inv.subtotal.toString() : '0', rightX, doc.y, { width: 80, align: 'right' });
    doc.moveDown(0.5);
    doc.text('Tax', 395, doc.y, { width: 70, align: 'right' });
    doc.text(inv.totalTax ? inv.totalTax.toString() : '0', rightX, doc.y, { width: 80, align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#000').text('Total', 395, doc.y, { width: 70, align: 'right' });
    doc.text(inv.total ? inv.total.toString() : '0', rightX, doc.y, { width: 80, align: 'right' });

    // Notes & footer
    doc.moveDown(2);
    if (inv.notes) {
      doc.fontSize(10).fillColor('#333').text('Notes', { underline: true });
      doc.fontSize(9).fillColor('#222').text(inv.notes);
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#666').text('Great Nexus — Ecossistema Empresarial Inteligente', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('exportInvoicePdf err:', err);
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
  exportInvoiceHtml,
  exportInvoicePdf
};
