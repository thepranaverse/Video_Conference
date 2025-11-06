import React, { useEffect, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import server from "../env.js";
import { AuthContext } from "../contexts/AuthContext.jsx";

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const { addToUserHistory } = useContext(AuthContext);
  const navigate = useNavigate();
  var socketRef = useRef(); // The socket.io(individual user) connection
  let socketIdRef = useRef(); // Your unique socket ID
  let localVideoref = useRef(); //Reference to YOUR video element (the <video> tag showing you)
  const videoRef = useRef([]); //Array tracking all remote videos

  //Track if camera/mic permissions are granted
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);

  // Current on/off state of YOUR camera and mic
  let [video, setVideo] = useState([]);
  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState(); // Is screen sharing active?

  let [showModal, setModal] = useState(true); // Is chat window visible?

  let [screenAvailable, setScreenAvailable] = useState();

  // to handle messages
  let [messages, setMessages] = useState([]); // Full chat history
  let [message, setMessage] = useState(""); // Current text you're typing
  let [newMessages, setNewMessages] = useState(3); // Unread message count (starts at 3, probably for testing)

  // Lobby screen state - waiting for username before joining
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");

  let [videos, setVideos] = useState([]); //Array of all remote video streams from other participants Structure: [{socketId, stream, autoplay, playsinline}, ...]

  useEffect(() => {
    console.log("HELLO");
    getPermissions();
  }, []);
  // Purpose: Start screen sharing
  // It Requests screen capture permission & calls success handler func.
  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  // Purpose: Ask browser for camera/mic permissions and start showing your video preview
  const getPermissions = async () => {
    try {
      // Try to get video permission
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("Video permission granted");
      } else {
        setVideoAvailable(false);
        console.log("Video permission denied");
      }
      // Try to get audio permission
      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio permission denied");
      }
      // Check if screen sharing exists
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }
      // Get actual media stream and attach to video element
      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          // window.localStream is just a variable holding your local camera/mic stream, stored globally.
          window.localStream = userMediaStream; // Here, the code stores the stream globally in the browser window object.You can access it anywhere
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream; //This attaches the stream to a <video> element in your UI.
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (
      video !== undefined &&
      audio !== undefined &&
      window.localStream == null
    ) {
      getUserMedia();
      // console.log("Initial media stream setup.");
    }
  }, []);

  // Purpose: Bridge function called when user clicks "Connect"
  let getMedia = () => {
    // When called: After username is entered in lobby
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();

    // Enable tracks if stream already exists
    if (window.localStream) {
      const videoTrack = window.localStream.getVideoTracks()[0];
      const audioTrack = window.localStream.getAudioTracks()[0];
      if (videoTrack) videoTrack.enabled = videoAvailable;
      if (audioTrack) audioTrack.enabled = audioAvailable;
    }
  };

  // Purpose: Called after successfully getting camera/mic access
  let getUserMediaSuccess = (stream) => {
    // Stop old stream => Why: Prevents multiple active webcam sessions and ensures only one stream is active.
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }
    // Set new stream
    window.localStream = stream; //Stores the new stream globally
    localVideoref.current.srcObject = stream;
    // Send to all connections
    for (let id in connections) {
      if (id === socketIdRef.current) continue; // self user then continue

      connections[id].addTrack(window.localStream); //This loop goes through each peer (except yourself) and adds the new local stream to their connection.
      // Re-negotiate the connection..
      // Why: When you change your stream (e.g., switch camera/mic), both peers must renegotiate — this step triggers that.
      connections[id].createOffer().then((description) => {
        // console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            // Send sdp to the remote peer using your signaling server via...
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    // Handle if a track ends (like user revokes permission or unplug camera)
    // Why: Keeps the app stable and stops showing a broken feed.
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);
          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }
          // Replace with “black video + silence” (fallback stream)
          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;
          // Renegotiates again — so other peers see a black video tile instead of your frozen camera feed.
          //Why renegotiate?: When your media changes (camera on/off), you need to tell everyone about the new stream state
          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        })
    );
  };

  // purpose : handles starting or stopping your local camera/mic stream.
  let getUserMedia = () => {
    // Start media
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess) // function that Called after successfully getting camera/mic access
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      // Stop media
      try {
        let tracks = localVideoref.current.srcObject.getTracks(); // like tracks = [audio ,video etc]
        tracks.forEach((track) => track.stop()); // stops all tracks by loop them
      } catch (e) {
        console.log(e);
      }
    }
  };

  // Purpose: Handle successful screen capture
  // Similar to getUserMediaSuccess but: Uses screen stream instead of camera

  let getDislayMediaSuccess = (stream) => {
    // console.log("HERE");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }
    window.localStream = stream;
    localVideoref.current.srcObject = stream;
    // Send to all peers (same as getUserMediaSuccess)
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }
    // When screen share stops
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);
          // Go back to camera
          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia(); // Resume normal video
        })
    );
  };

  //Purpose: Receives WebRTC signaling messages from other peers
  // fromId → socket ID of the peer who sent the message & message=>JSON string containing either:an SDP, an ICE candidate
  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      // === HANDLE SDP ===
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              // Received an offer, create an answer
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }
      // === HANDLE ICE ===
      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  //  ----------------------------------- WEBRTC CONNECTION FUNCTIONS ------------------------------------
  // Purpose: Connect to signaling server and set up event listeners
  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      const roomPath = window.location.pathname
        .replace("/", "")
        .trim()
        .toLowerCase();
      socketRef.current.emit("join-call", roomPath);
      socketIdRef.current = socketRef.current.id; // store curr. sockets id in socketId arr.

      socketRef.current.on("chat-messages", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });
      // this user-joined event-handler is bit complex

      socketRef.current.on("user-joined", (id, clients) => {
        //id = the person who joined :: clients = array of ALL socket IDs in the room
        clients.forEach((socketListId) => {
          // You create a new RTCPeerConnection for each one.....So every pair of users has its own private WebRTC connection.
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );

          // Wait for their ice candidate (=== ICE CANDIDATE HANDLER ===)
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // Wait for their video stream( === STREAM HANDLER ===)
          connections[socketListId].onaddstream = (event) => {
            // console.log("BEFORE:", videoRef.current);
            // console.log("FINDING ID: ", socketListId);

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              // console.log("FOUND EXISTING");

              // Update the stream of the existing video
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              // Create a new video
              // console.log("CREATING NEW");
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  // -------------------------------------- BLACK-SILANCE ------------------------------------------
  //Purpose: Create a silent audio track
  // Why needed: When your mic is off, you still need an audio track in the connection (just disabled)
  let silence = () => {
    let ctx = new AudioContext(); //Creates Web Audio API context
    let oscillator = ctx.createOscillator(); // Creates oscillator (generates sound)
    let dst = oscillator.connect(ctx.createMediaStreamDestination()); //Connects to media stream destination(dst)
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  // Purpose: Create a black video frame
  // Why needed: When camera is off, send black frame instead of nothing
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      //Creates invisible canvas element
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height); // Fills it with black (default fillRect color)
    let stream = canvas.captureStream(); //Captures canvas as stream
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  // ---------------------------------------- CONTROL FUNCTIONS --------------------------------
  // Purpose: Toggle video on/off
  let handleVideo = () => {
    const newVideoState = !video;
    setVideo(newVideoState);

    if (window.localStream) {
      const videoTrack = window.localStream
        .getTracks()
        .find((track) => track.kind === "video");
      if (videoTrack) videoTrack.enabled = newVideoState;
    }
  };
  // Purpose: Toggle audio on/off
  let handleAudio = () => {
    const newAudioState = !audio;
    setAudio(newAudioState);

    if (window.localStream) {
      const audioTrack = window.localStream
        .getTracks()
        .find((track) => track.kind === "audio");
      if (audioTrack) audioTrack.enabled = newAudioState;
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);

  // Purpose: Toggle screen on/off
  let handleScreen = () => {
    setScreen(!screen);
  };
  // Purpose: Leave the call
  // Note: Doesn't explicitly close socket or peer connections (browser cleanup handles it)
  let handleEndCall = async () => {
    console.log("🔴 END CALL CLICKED");
    try {
      // Stop all tracks
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {
      console.error("Error stopping tracks:", e);
    }
    try {
      // Get meeting code from URL
      const meetingCode = window.location.pathname
        .replace("/", "")
        .trim()
        .toLowerCase();

      console.log("💾 Saving meeting code:", meetingCode);
      // Save to history
      await addToUserHistory(meetingCode);
      console.log("✅ Meeting saved to history!");
    } catch (error) {
      console.error("❌ Failed to save meeting history:", error);
    }
    // Navigate home
    navigate("/home");
  };

  // -------------------------------------- CHAT FUNCTIONS ----------------------------------
  // Purpose: Open chat panel and clear unread badge
  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };
  // Purpose: Update message text as user types
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  // Purpose: Add message to chat and update unread count
  const addMessage = (data, sender, socketIdSender) => {
    // console.log("💬 Message received from server:", {
    //   data,
    //   sender,
    //   socketIdSender,
    // });
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      // If they’re different → the message came from someone else.
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  // Purpose: Send your message via socket
  let sendMessage = () => {
    // console.log("Sending message:", message);
    // console.log("Socket:", socketRef.current);

    // Then send it to server
    socketRef.current.emit("chat-messages", message, username);
    setMessage(""); // clear input
  };

  // Purpose: Leave lobby and join call
  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    // Lobby Screen (askForUsername === true)
    <div>
      {askForUsername === true ? (
        // ---------------------------Lobby Screen (before connecting) -----------------------------
        <div className={styles["lobby-container"]}>
          <h2>Enter into Lobby </h2>
          <div className={styles["input-group"]}>
            <input
              type="text"
              id="outlined-basic"
              placeholder="Enter your userName"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              disabled={!username.trim()} // disable if empty
              onClick={connect}
            >
              Connect
            </button>
          </div>

          <div>
            <video ref={localVideoref} autoPlay muted></video>{" "}
            {/* Only the local video appears — no remote participants yet. */}
          </div>
        </div>
      ) : (
        // -------------------------------- Meeting Screen (When askForUsername === false)----------------------
        // Meeting Screen contains : Chat modal ,Local video ,All remote videos ,Call control buttons (video/audio/screen/chat/end)
        <div className={styles.meetVideoContainer}>
          {/* LEFT SIDE: VIDEO GRID + CONTROLS */}
          <div className={styles.videoArea}>
            <div className={styles.conferenceView}>
              {/* Local Video */}
              <video
                className={styles.meetUserVideo}
                ref={localVideoref}
                autoPlay
                muted
              ></video>

              {/* Remote Videos */}
              {videos.map((video) => (
                <video
                  key={video.socketId}
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              ))}
            </div>

            {/* BUTTONS */}
            <div className={styles.buttonContainers}>
              <IconButton onClick={handleVideo} style={{ color: "white" }}>
                {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>

              <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                <CallEndIcon />
              </IconButton>

              <IconButton onClick={handleAudio} style={{ color: "white" }}>
                {audio === true ? <MicIcon /> : <MicOffIcon />}
              </IconButton>

              {screenAvailable === true && (
                <IconButton onClick={handleScreen} style={{ color: "white" }}>
                  {screen === true ? (
                    <ScreenShareIcon />
                  ) : (
                    <StopScreenShareIcon />
                  )}
                </IconButton>
              )}

              <Badge badgeContent={newMessages} max={999} color="orange">
                <IconButton
                  onClick={() => setModal(!showModal)}
                  style={{ color: "white" }}
                >
                  <ChatIcon />
                </IconButton>
              </Badge>
            </div>
          </div>

          {/* RIGHT SIDE CHAT */}
          {showModal && (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>

                <div className={styles.chattingDisplay}>
                  {messages.length !== 0 ? (
                    messages.map((item, index) => (
                      <div style={{ marginBottom: "20px" }} key={index}>
                        <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter Your chat"
                  />
                  <button
                    // className={styles.sendBtn}
                    variant="contained"
                    onClick={sendMessage}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
