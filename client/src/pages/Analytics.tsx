import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

interface Meeting {
  _id: string;
  title: string;
  status: string;
  duration: number;
  scheduledAt: string;
  participants: any[];
}

export default function Analytics() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetings(res.data.meetings);
    } finally {
      setLoading(false);
    }
  };

  const totalMeetings = meetings.length;
  const completed = meetings.filter((m) => m.status === "completed").length;
  const scheduled = meetings.filter((m) => m.status === "scheduled").length;
  const totalMinutes = meetings.reduce((acc, m) => acc + m.duration, 0);
  const avgDuration =
    totalMeetings > 0 ? Math.round(totalMinutes / totalMeetings) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🤖 IntellMeet</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Dashboard
        </button>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📊 Analytics & Insights
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">{totalMeetings}</p>
            <p className="text-gray-500 text-sm mt-1">Total Meetings</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{scheduled}</p>
            <p className="text-gray-500 text-sm mt-1">Upcoming</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">{completed}</p>
            <p className="text-gray-500 text-sm mt-1">Completed</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-orange-600">{avgDuration}</p>
            <p className="text-gray-500 text-sm mt-1">Avg Duration (mins)</p>
          </div>
        </div>

        {/* Meeting History Table */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Meeting History
          </h3>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : meetings.length === 0 ? (
            <p className="text-gray-500">No meetings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600">Title</th>
                    <th className="text-left py-3 px-4 text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-gray-600">
                      Duration
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600">
                      Participants
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr
                      key={meeting._id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {meeting.title}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(meeting.scheduledAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {meeting.duration} mins
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {meeting.participants?.length || 1}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            meeting.status === "scheduled"
                              ? "bg-green-100 text-green-700"
                              : meeting.status === "completed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {meeting.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Productivity Tips */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-3">
            💡 Productivity Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="font-medium">Total Time in Meetings</p>
              <p className="text-2xl font-bold mt-1">{totalMinutes} mins</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="font-medium">Meetings This Week</p>
              <p className="text-2xl font-bold mt-1">
                {
                  meetings.filter((m) => {
                    const meetingDate = new Date(m.scheduledAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return meetingDate > weekAgo;
                  }).length
                }
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="font-medium">Completion Rate</p>
              <p className="text-2xl font-bold mt-1">
                {totalMeetings > 0
                  ? Math.round((completed / totalMeetings) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
