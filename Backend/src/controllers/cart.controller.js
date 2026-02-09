 const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const mongoose = require("mongoose");

exports.add = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const qty = Math.max(1, Number(quantity || 1));

    const existing = await CartItem.findOne({ buyer: buyerId, product: productId });
    if (existing) {
      existing.quantity += qty;
      await existing.save();

      await existing.populate("product");
      return res.json({ message: "Cart updated", item: existing.toSafeJSON() });
    }

    const item = await CartItem.create({ buyer: buyerId, product: productId, quantity: qty });
    await item.populate("product");

    return res.status(201).json({ message: "Added to cart", item: item.toSafeJSON() });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

exports.mine = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const items = await CartItem.find({ buyer: buyerId })
      .populate("product")
      .sort({ createdAt: -1 });

    return res.json({ items: items.map((i) => i.toSafeJSON()) });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid cart item id" });
    }

    const item = await CartItem.findOneAndDelete({ _id: id, buyer: buyerId });
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    return res.json({ message: "Removed", id });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};
