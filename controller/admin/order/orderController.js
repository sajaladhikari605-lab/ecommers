const Order = require("../../../models/orderModel")

 const getAllOrders = async (req, res) => {
 const userId = req.user._id;

    const orders = await Order.find().populate({
        path: "orderItems.productId",
        model: "Product",
    })
 if(!orders || orders.Length === 0){
    return res.status(404).json({message: "No orders found"}) 
 }
 return res.status(200).json({
     message: "Orders retrieved successfully", 
     data: orders });
 }





 const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

if (!orderId) {
    return res.status(400).json({ message: "Order id is required" });   
}
if(!orderStatus){
    return res.status(400).json({ message: "Order status is required" });
}
const existingOrder = await Order.findById(orderId);
if (!existingOrder) {
    return res.status(404).json({ message: "Order not found" });
}
if(!status || !["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)){
    return res.status(400).json({ message: "Invalid order status" });
}
await Order.findByIdAndUpdate(orderId, { status }, { new: true });
return res.status(200).json({ message: "Order status updated successfully" });
}
 module.exports = {
    getAllOrders,
    updateOrderStatus
 }