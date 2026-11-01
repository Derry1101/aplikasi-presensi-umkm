export function roleMiddleware(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Silakan login terlebih dahulu"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Kamu tidak memiliki akses"
            });
        }

        next();
    };
}