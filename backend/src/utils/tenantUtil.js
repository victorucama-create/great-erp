// utils/tenantUtil.js
// helper to merge tenant filter into queries
function applyTenant(query = {}, tenantFilter = {}) {
  if (!tenantFilter || Object.keys(tenantFilter).length === 0) return query;
  return { ...query, ...tenantFilter };
}

module.exports = { applyTenant };
