const User = require('../models/User');
const Tenant = require('../models/Tenant');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {

    async register(req, res) {
        try {
            const { name, email, password, tenantId } = req.body;

            const hashed = await bcrypt.hash(password, 10);

            const user = await User.create({
                name,
                email,
                password: hashed,
                tenantId,
                role: tenantId ? "tenant_admin" : "super_admin"
            });

            res.json({ success: true, message: "User registered", data: user });

        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: "server_error" });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });

            if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });

            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).json({ success: false, error: "Invalid credentials" });

            const token = jwt.sign(
                {
                    id: user._id,
                    tenantId: user.tenantId,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: "8h" }
            );

            res.json({
                success: true,
                data: {
                    user,
                    token
                }
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: "server_error" });
        }
    }
};
