 const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const order = require("../controllers/order.controller");

router.post("/place", auth, order.placeFromCart);
router.get("/vendor/orders", auth, order.getVendorOrders);
router.get("/buyer/orders", auth, order.getBuyerOrders);
router.put("/:id/confirm", auth, order.confirmOrder);
router.put("/:id/reject", auth, order.rejectOrder);

module.exports = router;
