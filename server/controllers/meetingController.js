const Meeting = require("../models/Meeting");

// CREATE MEETING
const createMeeting = async (req, res) => {
  try {
    const { title, description, scheduledAt, duration } = req.body;

    const meeting = new Meeting({
      title,
      description,
      scheduledAt,
      duration,
      host: req.user._id,
      participants: [{ user: req.user._id }],
    });

    await meeting.save();

    res.status(201).json({
      message: "Meeting created successfully",
      meeting,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL MEETINGS FOR USER
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ host: req.user._id }, { "participants.user": req.user._id }],
    })
      .populate("host", "name email")
      .sort({ scheduledAt: -1 });

    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET SINGLE MEETING
const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("host", "name email")
      .populate("participants.user", "name email");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({ meeting });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE MEETING STATUS
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({ message: "Meeting updated", meeting });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE MEETING
const deleteMeeting = async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// JOIN MEETING BY CODE
const joinMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.body;

    const meeting = await Meeting.findOne({ meetingCode });
    if (!meeting) {
      return res.status(404).json({ message: "Invalid meeting code" });
    }

    // Add participant if not already joined
    const alreadyJoined = meeting.participants.some(
      (p) => p.user.toString() === req.user._id.toString(),
    );

    if (!alreadyJoined) {
      meeting.participants.push({ user: req.user._id });
      await meeting.save();
    }

    res.json({ message: "Joined meeting successfully", meeting });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
};
