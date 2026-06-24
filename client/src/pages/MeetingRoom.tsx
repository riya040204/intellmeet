import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    { socketId: string; stream: MediaStream }[]
  >([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState<
    { userName: string; message: string; timestamp: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});

  useEffect(() => {
    startMeeting();
    return () => cleanup();
  }, []);

  const startMeeting = async () => {
    try {
      // Get camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect to socket
      socketRef.current = io("http://localhost:5000");

      socketRef.current.emit("join-room", {
        roomId: id,
        userId: user.id,
        userName: user.name,
      });

      // When existing users are in room
      socketRef.current.on("existing-users", (users: any[]) => {
        users.forEach((u) => createOffer(u.socketId));
      });

      // When new user joins
      socketRef.current.on("user-joined", (_: any) => {
        toast.success("Someone joined the meeting!");
      });

      // WebRTC signaling
      socketRef.current.on("offer", async ({ offer, from }: any) => {
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit("answer", { answer, to: from });
      });

      socketRef.current.on("answer", async ({ answer, from }: any) => {
        await peersRef.current[from]?.setRemoteDescription(answer);
      });

      socketRef.current.on(
        "ice-candidate",
        async ({ candidate, from }: any) => {
          await peersRef.current[from]?.addIceCandidate(candidate);
        },
      );

      // Chat messages
      socketRef.current.on("chat-message", (msg: any) => {
        setMessages((prev) => [...prev, msg]);
      });

      // User left
      socketRef.current.on("user-left", ({ socketId }: any) => {
        setRemoteStreams((prev) => prev.filter((s) => s.socketId !== socketId));
        peersRef.current[socketId]?.close();
        delete peersRef.current[socketId];
        toast.error("Someone left the meeting");
      });
    } catch (err) {
      toast.error("Could not access camera/microphone");
      console.error(err);
    }
  };

  const createPeerConnection = (socketId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        {
          urls: "turn:numb.viagenie.ca",
          username: "webrtc@live.com",
          credential: "muazkh",
        },
        {
          urls: "turn:192.158.29.39:3478?transport=udp",
          credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          username: "28224511:1379330808",
        },
      ],
    });

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("ice-candidate", {
          candidate: e.candidate,
          to: socketId,
        });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStreams((prev) => {
        const exists = prev.find((s) => s.socketId === socketId);
        if (exists) return prev;
        return [...prev, { socketId, stream: e.streams[0] }];
      });
    };

    peersRef.current[socketId] = pc;
    return pc;
  };

  const createOffer = async (socketId: string) => {
    const pc = createPeerConnection(socketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("offer", { offer, to: socketId });
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.emit("leave-room", { roomId: id });
    socketRef.current?.disconnect();
    Object.values(peersRef.current).forEach((pc) => pc.close());
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!isVideoOff);
    }
  };
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = screenStream;

        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });

        // Show screen in local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);

        // When user stops sharing from browser UI
        videoTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        toast.error("Could not share screen");
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    // Restore camera
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender && videoTrack) sender.replaceTrack(videoTrack);
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsScreenSharing(false);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socketRef.current?.emit("chat-message", {
      roomId: id,
      message: newMessage,
      userName: user.name,
    });
    setMessages((prev) => [
      ...prev,
      {
        userName: user.name,
        message: newMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewMessage("");
  };

  const leaveMeeting = () => {
    cleanup();
    navigate("/dashboard");
    toast.success("Left the meeting");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-3 flex justify-between items-center">
        <h1 className="text-white font-bold text-lg">🤖 IntellMeet</h1>
        <span className="text-gray-400 text-sm">Room: {id?.slice(-6)}</span>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 flex gap-4">
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                You ({user.name})
              </div>
            </div>

            {/* Remote Videos */}
            {remoteStreams.map(({ socketId, stream }) => (
              <RemoteVideo key={socketId} stream={stream} />
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 rounded-xl flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Meeting Chat</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                <div key={i}>
                  <span className="text-blue-400 text-xs font-medium">
                    {msg.userName}
                  </span>
                  <p className="text-white text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
            <div className="p-4 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`px-6 py-3 rounded-full font-medium ${isMuted ? "bg-red-600 text-white" : "bg-gray-600 text-white hover:bg-gray-500"}`}
        >
          {isMuted ? "🔇 Unmute" : "🎤 Mute"}
        </button>
        <button
          onClick={toggleVideo}
          className={`px-6 py-3 rounded-full font-medium ${isVideoOff ? "bg-red-600 text-white" : "bg-gray-600 text-white hover:bg-gray-500"}`}
        >
          {isVideoOff ? "📷 Start Video" : "📹 Stop Video"}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`px-6 py-3 rounded-full font-medium ${
            isScreenSharing
              ? "bg-green-600 text-white"
              : "bg-gray-600 text-white hover:bg-gray-500"
          }`}
        >
          {isScreenSharing ? "🖥️ Stop Share" : "🖥️ Share Screen"}
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-full font-medium"
        >
          💬 Chat
        </button>
        <button
          onClick={leaveMeeting}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium"
        >
          📴 Leave
        </button>
      </div>
    </div>
  );
}

// Remote video component
function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}
