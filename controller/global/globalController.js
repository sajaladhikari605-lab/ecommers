const Product = require("../../models/productModule");

// Get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const filter = search
      ? {
          $or: [
            { productName: { $regex: search, $options: "i" } },
            { productDescription: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// Get single product
exports.getSingleProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Get all orders
exports.getAllOrders = async (req, res, next) => {
  try {
    // TODO: Implement logic to fetch all orders from database
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: []
    });
  } catch (error) {
    next(error);
  }
};
