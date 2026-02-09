 const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "ChatThread", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

chatMessageSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    threadId: this.thread.toString(), 
    text: this.text,
    createdAt: this.createdAt,
  };
};

module.exports =
  mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
