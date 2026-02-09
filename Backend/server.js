 const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const productRoutes = require("./src/routes/product.routes");
const cartRoutes = require("./src/routes/cart.routes");
const chatRoutes = require("./src/routes/chat.routes");
const orderRoutes = require("./src/routes/order.routes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Error ", err.message);
    process.exit(1);
  });

app.get("/", (req, res) => res.send("AgriLink API running "));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));

// after 2 days as Surplus
const Product = require("./src/models/Product");
const markOldProductsSurplus = async () => {
  try {
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); 
    const res = await Product.updateMany(
      { type: { $ne: "Surplus" }, createdAt: { $lte: cutoff } },
      { $set: { type: "Surplus" } }
    );
    if (res.modifiedCount && res.modifiedCount > 0) {
      console.log(`Marked ${res.modifiedCount} product(s) as Surplus`);
    }
  } catch (e) {
    console.error("Error marking old products as Surplus:", e.message);
  }
};

// Run every 24 hours
markOldProductsSurplus().catch(() => {});
setInterval(() => {
  markOldProductsSurplus().catch(() => {});
}, 24 * 60 * 60 * 1000);
