// middlewares/tenant.js
// Ensures tenant isolation: sets req.tenantFilter for controllers
function tenantFilter(req, res, next) {
  const user = req.user;
  if (!user) {
    req.tenantFilter = {};
    return next();
  }
  // super_admin can see all tenants; tenant_admin sees own tenant
  if (user.role === 'super_admin') {
    req.tenantFilter = {}; // no filtering
  } else {
    req.tenantFilter = { tenantId: user.tenantId };
  }
  next();
}

module.exports = { tenantFilter };
