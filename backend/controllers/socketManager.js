import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["*"],
    },
    transports: ["polling", "websocket"],
    allowEIO3: true,
  });
  // Listens for new client connections
  io.on("connection", (socket) => {
    console.log("connected", socket.id);
    //  Event Listeners Inside Connection
    // Event1 : Listens for when a user joins a video call  eg.path=meeting-123
    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        // Initialize the room if it doesn't exist
        connections[path] = []; //eg.  connections = {"meeting-123": []};..New room created
      }

      // Add the new user to the room
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Notify ALL existing participants
      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          // tells user[a] the given info
          "user-joined",
          socket.id, // Who joined
          connections[path] // Full participant list
        );
      }
      // Send chat history to the new user
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; a++) {
          io.to(socket.id).emit(
            "chat-messages",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"]
          );
        }
      }
    });

    // Event2: Handles WebRTC signaling for video/audio connections
    // User A(socket.id) sends a signal -> Server receives (relaying the message)-> User B(`toId`) receives the signal
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message); // The message contains WebRTC signaling data
    });

    // Event3:  Handles incoming chat messages
    socket.on("chat-messages", (data, sender) => {
      // Find which room the sender is in
      let matchingRoom = "";
      let found = false;

      for (let roomKey in connections) {
        if (connections[roomKey].includes(socket.id)) {
          matchingRoom = roomKey;
          found = true;
          break;
        }
      }
      // If user is in a room, save the message
      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }
        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });
        console.log("messages", matchingRoom, ":", sender, data);
        //  Broadcast message to everyone in the room
        connections[matchingRoom].forEach((elem) => {
          console.log("ROOM DEBUG:", connections);
          io.to(elem).emit("chat-messages", data, sender, socket.id); // ..also includes sender So that sender also sees their own message in the chat
        });
      }
    });

    // Event4 :  Automatically fires when a user loses connection
    socket.on("disconnect", () => {
      // Calculate time online (optional - currently unused)
      var diffTime = Math.abs(new Date() - timeOnline[socket.id]);
      console.log(`User ${socket.id} was online for ${diffTime}ms`);

      // Find which room the user was in
      for (const [roomKey, userIds] of Object.entries(connections)) {
        if (userIds.includes(socket.id)) {
          // Notify all remaining users in the room
          for (let i = 0; i < connections[roomKey].length; i++) {
            io.to(connections[roomKey][i]).emit("user-left", socket.id);
          }

          // Remove user from the room
          const index = connections[roomKey].indexOf(socket.id);
          connections[roomKey].splice(index, 1);

          // Delete room if empty
          if (connections[roomKey].length === 0) {
            delete connections[roomKey];
          }

          // Clean up time tracking
          delete timeOnline[socket.id];

          break; // Exit loop once found (user can only be in one room)
        }
      }
    });
  });

  return io;
};
