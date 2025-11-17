const jwt = require('jsonwebtoken');

module.exports.verifyToken = (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header) return res.status(401).json({ success: false, error: "missing_token" });

        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: "invalid_token" });
    }
};
