const express = require("express");
const router = express.Router();
const {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
} = require("../controllers/meetingController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

router.post("/", createMeeting);
router.get("/", getMeetings);
router.get("/:id", getMeeting);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);
router.post("/join", joinMeeting);

module.exports = router;
