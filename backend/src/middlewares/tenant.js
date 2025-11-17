module.exports.tenantFilter = (req, res, next) => {
    if (req.user.role === "super_admin") {
        req.tenantFilter = {};
    } else {
        req.tenantFilter = { tenantId: req.user.tenantId };
    }
    next();
};
