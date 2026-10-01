const Order = require("../../../../models/orderModel");
const Product = require("../../../../models/productModule");
const User = require("../../../../models/UserModel");

const createOrder = async (req, res) => {
    const userId = req.user._id;
    const { orderItems, totalAmount, shippingAddress, paymentDetails } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0 || totalAmount == null || !shippingAddress || !paymentDetails) {
        return res.status(400).json({ message: "Order items, total amount, shipping address and payment details are required" });
    }

    const existingProducts = await Product.find({ _id: { $in: orderItems.map(item => item.productId) } });

    if (existingProducts.length !== orderItems.length) {
        return res.status(400).json({ message: "One or more products in the order do not exist" });
    }

    const order = await Order.create({
        userId,
        orderItems,
        totalAmount,
        shippingAddress,
        paymentDetails
    })

    await User.findByIdAndUpdate(userId, { $set: { cart: [] } });

    return res.status(201).json({ message: "Order created successfully", data: order });
}

const getMyOrders = async (req, res) => {
    const userId = req.user._id;
    const myOrders = await Order.find({ userId }).populate({
        path: "orderItems.productId",
        model: "Product"
    });
    return res.status(200).json({
        message: "Orders retrieved successfully",
        data: myOrders
    });
}
const updateMyOrder = async (req, res)=> {
    const userId = req.user._id;
    const { orderId } = req.params;
    const { shippingAddress, orderItems } = req.body;
    if(!orderId){
        return res.status(400).json({
            message: "Order id is required"
        })
    }
    if(!shippingAddress || !Array.isArray(orderItems) || orderItems.length === 0){
        return res.status(400).json({
            message: " (shippingAddress or orderItems) is required to update"
        })
    }   
    const existingOrder = await Order.findById(orderId);
    if(!existingOrder){
        return res.status(404).json({
            message: "Order not found"
        })
    }
    if(existingOrder.userId.toString() !== userId.toString()){
        return res.status(403).json({
            message: "You are not authorized to update this order"
        })
    }
    if(existingOrder.orderStatus !== "Pending"){
    return res.status(400).json({
        message: "Only pending orders can be updated"})    
    }
    await Order.findByIdAndUpdate(orderId, { shippingAddress, orderItems }, { new: true });
    return res.status(200).json({
        message: "Order updated successfully"
    })
}

const deleteMyOrder = async (req,res )=>{
    const userId = req.user._id;
    const { orderId } = req.params;
    if(!orderId){
        return res.status(400).json({
            message:"order id is required"
        })
    }
   const existingOrder = await Order.findById(orderId);
   if(!existingOrder){
    return res.status(404).json({message: "Order not found"})
   }
   if(existingOrder.userId.toString() !== userId.toString()){
        return res.status(403).json({
            message: "You are not authorized to delete this order"
        })
    }
    if(existingOrder.orderStatus !== "Pending"){
        return res.status(400).json({
            message: "Only pending orders can be deleted"
        })
    }
    await Order.findByIdAndDelete(orderId);
    return res.status(200).json({
        message: "Order deleted successfully"
    })
}



module.exports = { 
    createOrder, 
    getMyOrders,
     updateMyOrder,
     deleteMyOrder
    }