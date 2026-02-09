 const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1 },
  },
  { timestamps: true }
);

cartItemSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    quantity: this.quantity,
    product: this.product
      ? {
          id: this.product._id.toString(),
          name: this.product.name,
          price: this.product.price,
          description: this.product.description,
          image: this.product.imageUrl,
          vendor: this.product.vendorName,

           
          vendorId: this.product.vendor ? this.product.vendor.toString() : null,

          category: this.product.category,
          type: this.product.type,
          discount: this.product.discount,
        }
      : null,
  };
};

module.exports = mongoose.model("CartItem", cartItemSchema);
