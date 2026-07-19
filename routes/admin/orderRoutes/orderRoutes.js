const {getAllOrders,updateOrderStatus} = require("../../../controller/admin/order/orderController");
const checkRole = require("../.../../../../middleware/checkRole");
const isAuthenticated = require("../../../middleware/isAuthenticated");
const catchAsync = require("../../../services/catchAsync");

const router = require("express").Router();

// Restful API routes for order management
router.route("/orders").get(isAuthenticated, checkRole("admin"), catchAsync(getAllOrders));
router.route("/orders/:orderId/status").put(isAuthenticated, checkRole("admin"), catchAsync(updateOrderStatus));
module.exports = router;