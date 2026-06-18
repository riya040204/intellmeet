import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../config";

interface SummaryData {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
}

export default function MeetingSummary() {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      toast.error("Please enter a meeting transcript");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/ai/summary`,
        { transcript },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSummaryData(res.data.data);
      toast.success("AI Summary generated!");
    } catch (err: any) {
      toast.error("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🤖 IntellMeet</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Dashboard
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🤖 AI Meeting Intelligence
        </h2>
        <p className="text-gray-500 mb-6">
          Paste your meeting transcript and get instant AI-powered insights
        </p>

        {/* Transcript Input */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Transcript
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none"
            placeholder="Paste your meeting transcript here...
Example: John: Let's review the project status. Sarah: I completed the frontend. John: Great, please deploy by Friday. Mike: I'll fix the login bug today..."
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Generating AI Summary...
              </>
            ) : (
              <>🤖 Generate AI Summary</>
            )}
          </button>
        </div>

        {/* AI Results */}
        {summaryData && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                📝 Meeting Summary
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {summaryData.summary}
              </p>
            </div>

            {/* Key Points */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                🎯 Key Points
              </h3>
              <ul className="space-y-2">
                {summaryData.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                ✅ Action Items
              </h3>
              {summaryData.actionItems.length === 0 ? (
                <p className="text-gray-500">No action items detected</p>
              ) : (
                <ul className="space-y-2">
                  {summaryData.actionItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg"
                    >
                      <input type="checkbox" className="mt-1" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Decisions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                🏛️ Decisions Made
              </h3>
              {summaryData.decisions.length === 0 ? (
                <p className="text-gray-500">No decisions detected</p>
              ) : (
                <ul className="space-y-2">
                  {summaryData.decisions.map((decision, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 p-3 bg-green-50 rounded-lg"
                    >
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-700">{decision}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Export Button */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const text = `
MEETING SUMMARY
===============
${summaryData.summary}

KEY POINTS
----------
${summaryData.keyPoints.map((p) => `• ${p}`).join("\n")}

ACTION ITEMS
------------
${summaryData.actionItems.map((a) => `☐ ${a}`).join("\n")}

DECISIONS
---------
${summaryData.decisions.map((d) => `✓ ${d}`).join("\n")}
                  `;
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "meeting-summary.txt";
                  a.click();
                  toast.success("Summary exported!");
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                📥 Export Summary
              </button>
              <button
                onClick={() => setSummaryData(null)}
                className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg font-medium"
              >
                🔄 New Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
