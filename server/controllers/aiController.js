const Meeting = require("../models/Meeting");

const generateSummary = async (req, res) => {
  try {
    const { meetingId, transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ message: "Transcript is required" });
    }

    // Use HuggingFace BART for summarization
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: transcript,
          parameters: { max_length: 150, min_length: 50 },
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      // Model loading - return mock response
      return res.json({
        message: "Summary generated successfully",
        data: {
          summary: extractSummary(transcript),
          keyPoints: extractKeyPoints(transcript),
          actionItems: extractActionItems(transcript),
          decisions: extractDecisions(transcript),
        },
      });
    }

    const summary = data[0]?.summary_text || extractSummary(transcript);

    // Save to meeting
    if (meetingId) {
      const actionItems = extractActionItems(transcript);
      await Meeting.findByIdAndUpdate(meetingId, {
        summary,
        actionItems: actionItems.map((item) => ({
          text: item,
          completed: false,
        })),
      });
    }

    res.json({
      message: "Summary generated successfully",
      data: {
        summary,
        keyPoints: extractKeyPoints(transcript),
        actionItems: extractActionItems(transcript),
        decisions: extractDecisions(transcript),
      },
    });
  } catch (error) {
    console.error("AI Error:", error);
    // Fallback to rule-based
    res.json({
      message: "Summary generated successfully",
      data: {
        summary: extractSummary(req.body.transcript),
        keyPoints: extractKeyPoints(req.body.transcript),
        actionItems: extractActionItems(req.body.transcript),
        decisions: extractDecisions(req.body.transcript),
      },
    });
  }
};

// Rule-based helpers
const extractSummary = (transcript) => {
  const sentences = transcript
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 20);
  return sentences.slice(0, 3).join(". ") + ".";
};

const extractKeyPoints = (transcript) => {
  const sentences = transcript
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 15);
  return sentences.slice(0, 5).map((s) => s.trim());
};

const extractActionItems = (transcript) => {
  const actionWords = [
    "will",
    "need to",
    "should",
    "must",
    "going to",
    "have to",
    "please",
  ];
  const sentences = transcript.split(/[.!?]+/);
  return sentences
    .filter((s) => actionWords.some((w) => s.toLowerCase().includes(w)))
    .map((s) => s.trim())
    .filter((s) => s.length > 10)
    .slice(0, 5);
};

const extractDecisions = (transcript) => {
  const decisionWords = [
    "decided",
    "agreed",
    "will use",
    "chosen",
    "approved",
    "confirmed",
  ];
  const sentences = transcript.split(/[.!?]+/);
  return sentences
    .filter((s) => decisionWords.some((w) => s.toLowerCase().includes(w)))
    .map((s) => s.trim())
    .filter((s) => s.length > 10)
    .slice(0, 3);
};

const generateActionItems = async (req, res) => {
  try {
    const { transcript } = req.body;
    const actionItems = extractActionItems(transcript);
    res.json({ actionItems });
  } catch (error) {
    res.status(500).json({ message: "Failed", error: error.message });
  }
};

module.exports = { generateSummary, generateActionItems };
