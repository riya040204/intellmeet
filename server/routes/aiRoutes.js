const express = require("express");
const router = express.Router();
const {
  generateSummary,
  generateActionItems,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/summary", generateSummary);
router.post("/action-items", generateActionItems);

module.exports = router;
