// controllers/products.controller.js
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const Attachment = require('../models/Attachment');
const { applyTenant } = require('../utils/tenantUtil');

async function listProducts(req, res) {
  try {
    const filter = applyTenant({}, req.tenantFilter);
    const products = await Product.find(filter).populate('attachments').lean();
    return res.json({ success:true, data: products });
  } catch (err) {
    console.error(err); return res.status(500).json({ success:false, error:'server_error'});
  }
}

async function getProduct(req, res) {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate('attachments').lean();
    if (!product) return res.status(404).json({ success:false, error:'not_found' });
    return res.json({ success:true, data: product });
  } catch (err) { console.error(err); return res.status(500).json({ success:false }); }
}

async function createProduct(req, res) {
  try {
    const payload = req.body;
    payload.tenantId = req.user.role === 'super_admin' ? payload.tenantId : req.user.tenantId;
    const p = await Product.create(payload);
    return res.json({ success:true, data: p });
  } catch (err) { console.error(err); return res.status(500).json({ success:false, error:'server_error' }); }
}

async function updateProduct(req, res) {
  try {
    const id = req.params.id;
    const payload = req.body;
    const p = await Product.findByIdAndUpdate(id, payload, { new: true });
    return res.json({ success:true, data: p });
  } catch (err) { console.error(err); return res.status(500).json({ success:false }); }
}

async function deleteProduct(req, res) {
  try {
    const id = req.params.id;
    await Product.findByIdAndDelete(id);
    return res.json({ success:true, message:'deleted' });
  } catch (err) { console.error(err); return res.status(500).json({ success:false }); }
}

async function uploadAttachment(req, res) {
  try {
    const id = req.params.id; // product id
    const file = req.file;
    if (!file) return res.status(400).json({ success:false, error:'no_file' });

    const at = await Attachment.create({
      tenantId: req.user.tenantId,
      refType: 'product',
      refId: id,
      filename: file.originalname,
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size
    });

    await Product.findByIdAndUpdate(id, { $push: { attachments: at._id }});
    return res.json({ success:true, data: at });
  } catch (err) { console.error(err); return res.status(500).json({ success:false }); }
}

async function createStockMovement(req, res) {
  try {
    const { productId, warehouseId, type, qty, reference, reason } = req.body;
    const movement = await StockMovement.create({ productId, warehouseId, type, qty, reference, reason, createdBy: req.user.id, tenantId: req.user.tenantId });
    // update stock
    let stock = await Stock.findOne({ productId, warehouseId });
    let newQty = (stock?.qty || 0);
    if (type === 'IN') newQty += Number(qty);
    else if (type === 'OUT') newQty = Math.max(0, newQty - Number(qty));
    else if (type === 'ADJUSTMENT') newQty = Number(qty);

    if (stock) stock.qty = newQty, await stock.save();
    else stock = await Stock.create({ productId, warehouseId, qty: newQty });

    // update product stockTotal
    const aggregated = await Stock.aggregate([
      { $match: { productId: stock.productId } },
      { $group: { _id: '$productId', sumQty: { $sum: '$qty' } } }
    ]);
    const total = aggregated[0] ? aggregated[0].sumQty : 0;
    await Product.findByIdAndUpdate(productId, { stockTotal: total });

    return res.json({ success:true, data: movement });
  } catch (err) { console.error(err); return res.status(500).json({ success:false }); }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, uploadAttachment, createStockMovement };
