const { getAllProducts, getSingleProduct, getAllOrders } = require('../../controller/global/globalController');
const checkRole = require('../../middleware/checkRole');
const isAuthenticated = require('../../middleware/isAuthenticated');
const catchAsync = require('../../services/catchAsync');

const router = require('express').Router();


// Restfulll API routes for product management
router.route("/products").get(catchAsync(getAllProducts))
router.route("/products/:id").get(catchAsync(getSingleProduct))
router.route("/orders").get(isAuthenticated, checkRole("seller", "customer"), catchAsync(getAllOrders))

module.exports = router