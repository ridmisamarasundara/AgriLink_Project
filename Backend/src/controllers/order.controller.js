 const Order = require("../models/Order");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const mongoose = require("mongoose");

exports.placeFromCart = async (req, res) => {
  try {
    const buyerId = req.userId;
    const { cartItemIds } = req.body;

    if (!buyerId) return res.status(401).json({ message: "Unauthorized (missing userId)" });

    if (!cartItemIds || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
      return res.status(400).json({ message: "cartItemIds array is required" });
    }

    const cartItems = await CartItem.find({
      _id: { $in: cartItemIds },
      buyer: buyerId,
    }).populate("product");

    if (cartItems.length === 0) return res.status(404).json({ message: "No cart items found" });

    let total = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      const product = cartItem.product;
      if (!product) continue;

      const quantity = Number(cartItem.quantity || 1);
      const price = Number(product.price || 0);

      total += price * quantity;

      orderItems.push({
        product: product._id,
        vendor: product.vendor,    
        name: product.name,
        image: product.imageUrl || "",
        quantity,
        price,
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ message: "No valid items to order" });
    }

    const order = await Order.create({
      buyer: buyerId,
      items: orderItems,
      total,
      status: "PLACED",
    });

    await CartItem.deleteMany({ _id: { $in: cartItemIds }, buyer: buyerId });

    return res.status(201).json({
      message: "Order placed successfully",
      order: {
        id: order._id.toString(),
        total: order.total,
        status: order.status,
        itemCount: order.items.length,
        createdAt: order.createdAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

exports.getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.userId;
    if (!vendorId) return res.status(401).json({ message: "Unauthorized (missing userId)" });

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

    const orders = await Order.find({ "items.vendor": vendorObjectId })
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });

    const vendorOrders = orders.map((order) => {
      const vendorItems = (order.items || []).filter(
        (item) => String(item.vendor) === String(vendorId)
      );

      const vendorTotal = vendorItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      );

      return {
        id: order._id.toString(),
        buyer: order.buyer
          ? { id: order.buyer._id.toString(), name: order.buyer.name, email: order.buyer.email }
          : { id: "", name: "Unknown", email: "" },
        items: vendorItems.map((item) => ({
          productId: item.product?.toString(),
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        })),
        total: vendorTotal,
        status: String(order.status || "").toUpperCase(),
        createdAt: order.createdAt,
      };
    });

    return res.json({ orders: vendorOrders });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { id } = req.params;

    if (!vendorId) return res.status(401).json({ message: "Unauthorized (missing userId)" });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid order ID format" });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (String(order.status).toUpperCase() !== "PLACED") {
      return res.status(400).json({ message: `Order already ${String(order.status).toLowerCase()}` });
    }

    const vendorItems = (order.items || []).filter(
      (item) => String(item.vendor) === String(vendorId)
    );

    if (vendorItems.length === 0) return res.status(403).json({ message: "Not your order" });

    const updates = [];

    for (const item of vendorItems) {
      const qty = Number(item.quantity || 0);
      if (!item.product || qty <= 0) {
        updates.push({ productName: item.name, success: false, reason: "Invalid product/qty" });
        continue;
      }

      const updated = await Product.findOneAndUpdate(
        { _id: item.product, vendor: vendorId, quantity: { $gte: qty } },
        { $inc: { quantity: -qty } },
        { new: true }
      );

      if (!updated) {
        const p = await Product.findById(item.product);
        const reason = !p
          ? "Product not found"
          : String(p.vendor) !== String(vendorId)
          ? "Product does not belong to this vendor"
          : `Insufficient stock (have ${p.quantity}, need ${qty})`;

        updates.push({ productName: item.name, success: false, reason });
      } else {
        updates.push({ productName: item.name, success: true, orderedQuantity: qty, newQuantity: updated.quantity });
      }
    }

    const successCount = updates.filter((u) => u.success).length;
    if (successCount === 0) {
      return res.status(400).json({ message: "Could not confirm. No quantities updated.", updates });
    }

    order.status = "CONFIRMED";
    await order.save();

    return res.json({
      message: "Order confirmed successfully",
      order: { id: order._id.toString(), status: order.status },
      updates,
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

exports.rejectOrder = async (req, res) => {
  try {
    const vendorId = req.userId;
    const { id } = req.params;

    if (!vendorId) return res.status(401).json({ message: "Unauthorized (missing userId)" });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid order ID format" });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (String(order.status).toUpperCase() !== "PLACED") {
      return res.status(400).json({ message: `Order already ${String(order.status).toLowerCase()}` });
    }

    const hasVendorItems = (order.items || []).some(
      (item) => String(item.vendor) === String(vendorId)
    );

    if (!hasVendorItems) return res.status(403).json({ message: "Not your order" });

    order.status = "REJECTED";
    await order.save();

    return res.json({
      message: "Order rejected",
      order: { id: order._id.toString(), status: order.status },
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

exports.getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.userId;
    if (!buyerId) return res.status(401).json({ message: "Unauthorized (missing userId)" });

    const orders = await Order.find({ buyer: buyerId })
      .sort({ createdAt: -1 });

    const buyerOrders = orders.map((order) => {
      const total = (order.items || []).reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      );

      return {
        id: order._id.toString(),
        buyerId: order.buyer?.toString(),
        items: (order.items || []).map((item) => ({
          productId: item.product?.toString(),
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        })),
        total: total,
        status: String(order.status || "").toUpperCase(),
        createdAt: order.createdAt,
      };
    });

    return res.json({ orders: buyerOrders, total: buyerOrders.length, hasMore: false });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};
