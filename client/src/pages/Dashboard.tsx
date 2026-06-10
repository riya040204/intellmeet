import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

interface Meeting {
  _id: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingCode: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/meetings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetings(res.data.meetings);
    } catch (err) {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out!");
    navigate("/login");
  };

  const upcoming = meetings.filter((m) => m.status === "scheduled").length;
  const completed = meetings.filter((m) => m.status === "completed").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🤖 IntellMeet</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">👋 Hello, {user.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 text-sm">Total Meetings</h3>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {meetings.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 text-sm">Upcoming</h3>
            <p className="text-3xl font-bold text-green-600 mt-1">{upcoming}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 text-sm">Completed</h3>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              {completed}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/new-meeting")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              + New Meeting
            </button>
            <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium">
              Join Meeting{" "}
              <button
                onClick={() => navigate("/summary")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                🤖 AI Summary
              </button>
            </button>
          </div>
        </div>

        {/* Meetings List */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Your Meetings
          </h3>
          {loading ? (
            <p className="text-gray-500">Loading meetings...</p>
          ) : meetings.length === 0 ? (
            <p className="text-gray-500">
              No meetings yet. Create your first meeting!
            </p>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div
                  key={meeting._id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {meeting.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(meeting.scheduledAt).toLocaleString()} •{" "}
                      {meeting.duration} mins
                    </p>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      Code: {meeting.meetingCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        meeting.status === "scheduled"
                          ? "bg-green-100 text-green-600"
                          : meeting.status === "completed"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {meeting.status}
                    </span>
                    <button
                      onClick={() => navigate(`/meeting/${meeting._id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
