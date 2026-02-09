 const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const chat = require("../controllers/chat.controller");

// open in cart chat
router.post("/open-by-product", auth, chat.openByProduct);

//chat icon
router.get("/threads/mine", auth, chat.myThreads);

// msg
router.get("/threads/:id/messages", auth, chat.threadMessages);

// send msg
router.post("/threads/:id/messages", auth, chat.sendToThread);

// mark seen
router.post("/threads/:id/seen", auth, chat.markSeen);

module.exports = router;
