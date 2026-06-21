import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../config";

export default function JoinMeeting() {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/meetings/join`,
        { meetingCode: joinCode.toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Joined successfully!");
      navigate(`/meeting/${res.data.meeting._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid meeting code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          🔗 Join Meeting
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Enter the meeting code shared by the host
        </p>
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="OXII09"
            maxLength={6}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
          >
            {loading ? "Joining..." : "🚀 Join Meeting"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full border border-gray-300 text-gray-600 py-3 rounded-lg"
          >
            ← Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
