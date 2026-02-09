const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: null },
    description: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    type: { type: String, default: "" },
    discount: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    vendorName: { type: String, default: "" },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

productSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    category: this.category,
    price: this.price,
    oldPrice: this.oldPrice,
    description: this.description,
    quantity: this.quantity,
    type: this.type,
    discount: this.discount,
    image: this.imageUrl,
    vendor: this.vendorName,
    vendorId: this.vendor?.toString(),
  };
};

module.exports = mongoose.model("Product", productSchema);
