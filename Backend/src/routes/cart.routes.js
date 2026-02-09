 const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const cart = require("../controllers/cart.controller");

router.post("/add", auth, cart.add);
router.get("/mine", auth, cart.mine);
router.delete("/:id", auth, cart.remove);

module.exports = router;
