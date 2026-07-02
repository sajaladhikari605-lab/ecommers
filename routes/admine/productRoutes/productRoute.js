const { createProduct, getAllProducts, getSingleProduct, updateSingleProduct, deleteSingleProduct } = require('../../../controller/admine/product/productController')
const checkRole = require('../../../middleware/checkRole');
const isAuthenticated = require('../../../middleware/isAuthenticated');
const { multer, storage } = require('../../../middleware/multerController');
const router = require('express').Router();
const upload = multer({ storage: storage });

// restful api routes for product manGEMENT
router.route("/create").post(isAuthenticated, checkRole("seller"), upload.single("productImage"), createProduct)
router.route("/products").get(getAllProducts)
router.route("/product/:id").get(getSingleProduct).patch(updateSingleProduct).delete(deleteSingleProduct)

module.exports = router