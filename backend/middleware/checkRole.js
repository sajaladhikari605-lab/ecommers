const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        const storedRole = req.user?.userRole;
        const userRole = storedRole === "seller" ? "admin" : storedRole === "customer" ? "student" : storedRole;
        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Access denied, insufficient permissions"
            })
        }
        req.userRole = userRole
        next()
    }
}
module.exports = checkRole
