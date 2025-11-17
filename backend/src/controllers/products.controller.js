// src/controllers/products.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validationResult } = require('express-validator');
const csvStringify = require('csv-stringify/lib/sync');
const fs = require('fs');
const path = require('path');

async function listProducts(req, res) {
  try {
    const tenantId = req.user.tenantId || null; // payload must include tenantId in real impl
    const where = tenantId ? { where: { tenantId } } : {};
    const products = await prisma.product.findMany(Object.assign({}, where, { include: { attachments:true } }));
    return res.json({ success:true, data: products });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error: 'server_error' });
  }
}

async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id }, include: { attachments:true, stocks:true }});
    if (!product) return res.status(404).json({ success:false, error:'not_found' });
    return res.json({ success:true, data:product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false });
  }
}

async function createProduct(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
    const { sku, name, description, category, costPrice, salePrice, wholesalePrice, reorderLevel } = req.body;
    const tenantId = req.user.tenantId || req.body.tenantId || null;

    const product = await prisma.product.create({
      data: {
        sku, name, description, category,
        costPrice: costPrice || 0,
        salePrice: salePrice || 0,
        wholesalePrice: wholesalePrice || 0,
        reorderLevel: reorderLevel || 0,
        tenantId: tenantId
      }
    });
    return res.json({ success:true, data: product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body;
    const prod = await prisma.product.update({ where: { id }, data: payload });
    return res.json({ success:true, data: prod });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error: 'server_error' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    return res.json({ success:true, message: 'deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

async function uploadAttachment(req, res) {
  try {
    const { id } = req.params; // product id
    const file = req.file;
    if (!file) return res.status(400).json({ success:false, error:'no_file' });

    const url = `/uploads/${file.filename}`;
    const attachment = await prisma.attachment.create({
      data: {
        productId: id,
        filename: file.originalname,
        url,
        mimeType: file.mimetype,
        size: file.size
      }
    });

    // update product attachment count / optional
    return res.json({ success:true, data: attachment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

async function createStockMovement(req, res) {
  try {
    const { productId, warehouseId, type, qty, reference, reason } = req.body;
    // create movement
    const movement = await prisma.stockMovement.create({
      data: { productId, warehouseId, type, qty: Number(qty), reference, reason, createdBy: req.user.id }
    });

    // update stock qty in Stock record (simple logic)
    const stock = await prisma.stock.findFirst({ where: { productId, warehouseId }});
    let newQty = (stock?.qty || 0);
    if (type === 'IN') newQty = newQty + Number(qty);
    else if (type === 'OUT') newQty = Math.max(0, newQty - Number(qty));
    else if (type === 'ADJUSTMENT') newQty = Number(qty); // full override
    else if (type === 'TRANSFER') {
      // transfer logic should update source and destination separately (not implemented here)
    }

    if (stock) {
      await prisma.stock.update({ where: { id: stock.id }, data: { qty: newQty }});
    } else {
      await prisma.stock.create({ data: { productId, warehouseId, qty: newQty }});
    }

    // optional: update product.stockTotal (aggregate)
    const total = await prisma.stock.aggregate({ _sum: { qty: true }, where: { productId }});
    await prisma.product.update({ where: { id: productId }, data: { stockTotal: Number(total._sum.qty || 0) }});

    return res.json({ success:true, data: movement });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

async function getStockByProduct(req, res) {
  try {
    const { productId } = req.params;
    const stocks = await prisma.stock.findMany({ where: { productId }, include: { warehouse: true }});
    return res.json({ success:true, data: stocks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error: 'server_error' });
  }
}

async function exportProductsCsv(req, res) {
  try {
    const products = await prisma.product.findMany();
    const rows = products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category || '',
      price: p.salePrice?.toString() || '0',
      stock: p.stockTotal || 0
    }));
    const csv = csvStringify(rows, { header: true });
    res.setHeader('Content-disposition', 'attachment; filename=products.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

module.exports = {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  uploadAttachment, createStockMovement, getStockByProduct, exportProductsCsv
};
