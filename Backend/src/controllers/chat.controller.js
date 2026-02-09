 const ChatThread = require("../models/ChatThread");
const ChatMessage = require("../models/ChatMessage");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// open cart page
exports.openByProduct = async (req, res) => {
  try {
    const me = req.userId;
    const { productId, buyerId } = req.body;

    if (!productId) return res.status(400).json({ message: "productId is required" });
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const product = await Product.findById(productId).select("vendor name imageUrl");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const vendorId = product.vendor;
    if (!vendorId) return res.status(400).json({ message: "Vendor missing for product" });

    let threadBuyer = me;
    if (buyerId) {
      if (!mongoose.Types.ObjectId.isValid(buyerId)) {
        return res.status(400).json({ message: "Invalid buyerId" });
      }

      if (String(me) !== String(vendorId)) {
        return res.status(403).json({ message: "Only the vendor can open a thread for a specific buyer" });
      }

      threadBuyer = buyerId;
    }

    let thread = await ChatThread.findOne({ product: productId, buyer: threadBuyer, vendor: vendorId });

    if (!thread) {
      thread = await ChatThread.create({
        product: productId,
        buyer: threadBuyer,
        vendor: vendorId,
        lastMessageText: "",
        lastMessageSenderId: null,
        lastMessageAt: null,
        lastSeen: {},
      });
    }

    return res.json({
      thread: {
        id: thread._id.toString(),
        product: { id: product._id.toString(), name: product.name, image: product.imageUrl || "" },
        buyerId: thread.buyer.toString(),
        vendorId: thread.vendor.toString(),
        lastMessageText: thread.lastMessageText || "",
        lastMessageAt: thread.lastMessageAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

exports.myThreads = async (req, res) => {
  try {
    const me = req.userId;

    const threads = await ChatThread.find({ $or: [{ buyer: me }, { vendor: me }] })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate("buyer", "name profileImage")
      .populate("vendor", "name profileImage")
      .populate("product", "name imageUrl");

    const safe = threads.map((t) => {
      const isBuyer = String(t.buyer?._id) === String(me);
      const other = isBuyer ? t.vendor : t.buyer;

      const myLastSeen = t.lastSeen?.get(String(me));
      const lastMsgAt = t.lastMessageAt ? new Date(t.lastMessageAt) : null;

      const unread =
        t.lastMessageSenderId &&
        String(t.lastMessageSenderId) !== String(me) &&
        lastMsgAt &&
        (!myLastSeen || new Date(myLastSeen) < lastMsgAt);

      return {
        id: t._id.toString(),
        otherUser: other
          ? { id: other._id.toString(), name: other.name, image: other.profileImage || "" }
          : { id: "", name: "User", image: "" },
        product: t.product
          ? { id: t.product._id.toString(), name: t.product.name, image: t.product.imageUrl || "" }
          : { id: "", name: "" },
        lastMessageText: t.lastMessageText || "",
        lastMessageAt: t.lastMessageAt,
        unread: !!unread,
      };
    });

    return res.json({ threads: safe });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

// Thread messages
exports.threadMessages = async (req, res) => {
  try {
    const me = req.userId;
    const threadId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return res.status(400).json({ message: "Invalid thread id" });
    }

    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    const allowed = String(thread.buyer) === String(me) || String(thread.vendor) === String(me);
    if (!allowed) return res.status(403).json({ message: "Not allowed" });

    const messages = await ChatMessage.find({ thread: threadId }).sort({ createdAt: 1 });

    return res.json({
      messages: messages.map((m) => ({
        id: m._id.toString(),
        text: m.text,
        senderId: m.sender.toString(),
        createdAt: m.createdAt,
      })),
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

// Send message
exports.sendToThread = async (req, res) => {
  try {
    const me = req.userId; 
    const threadId = req.params.id;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return res.status(400).json({ message: "Invalid thread id" });
    }

    if (!text?.trim()) return res.status(400).json({ message: "text required" });

    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    const allowed = String(thread.buyer) === String(me) || String(thread.vendor) === String(me);
    if (!allowed) return res.status(403).json({ message: "Not allowed" });

    const msg = await ChatMessage.create({
      thread: threadId,
      sender: me,
      text: text.trim(),
    });

    thread.lastMessageText = msg.text;
    thread.lastMessageSenderId = me;
    thread.lastMessageAt = new Date();

    if (!thread.lastSeen) thread.lastSeen = new Map();
    thread.lastSeen.set(String(me), new Date());

    await thread.save();

    return res.status(201).json({
      message: "Sent",
      msg: {
        id: msg._id.toString(),
        text: msg.text,
        senderId: msg.sender.toString(),
        createdAt: msg.createdAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

// Mark seen
exports.markSeen = async (req, res) => {
  try {
    const me = req.userId;
    const threadId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return res.status(400).json({ message: "Invalid thread id" });
    }

    const thread = await ChatThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    const allowed = String(thread.buyer) === String(me) || String(thread.vendor) === String(me);
    if (!allowed) return res.status(403).json({ message: "Not allowed" });

    if (!thread.lastSeen) thread.lastSeen = new Map();
    thread.lastSeen.set(String(me), new Date());
    await thread.save();

    return res.json({ message: "Seen updated" });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};
