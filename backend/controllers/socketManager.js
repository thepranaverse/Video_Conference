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

  io.on("connection", (socket) => {
    // console.log(" User connected:", socket.id);

    socket.on("join-call", (path) => {
      // console.log("\n=== JOIN-CALL DEBUG ===");
      // console.log("User joining:", socket.id);
      // console.log("Room:", path);
      // console.log("Room before join:", connections[path] || "empty");

      if (connections[path] === undefined) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // console.log("Room after join:", connections[path]);
      // console.log("========================\n");

      // Tell each EXISTING user about the NEW user
      for (let a = 0; a < connections[path].length; a++) {
        const existingUserId = connections[path][a];

        if (existingUserId !== socket.id) {
          // Tell existing users: "Hey, socket.id just joined!"
          io.to(existingUserId).emit(
            "user-joined",
            socket.id,
            [socket.id] // Only send the NEW user's ID
          );
          // console.log(`Told ${existingUserId} about new user ${socket.id}`);
        }
      }

      // Tell the NEW user about all EXISTING users
      const existingUsers = connections[path].filter((id) => id !== socket.id);
      if (existingUsers.length > 0) {
        io.to(socket.id).emit(
          "user-joined",
          socket.id,
          existingUsers // Send list of existing users (without self)
        );
        // console.log(
        //   `Told ${socket.id} about existing users:`,
        //   existingUsers
        // );
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

    socket.on("signal", (toId, message) => {
      // console.log(`Relaying signal from ${socket.id} to ${toId}`);
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-messages", (data, sender) => {
      let matchingRoom = "";
      let found = false;

      for (let roomKey in connections) {
        if (connections[roomKey].includes(socket.id)) {
          matchingRoom = roomKey;
          found = true;
          break;
        }
      }

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }
        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });
        console.log(" Message in", matchingRoom, ":", sender, data);

        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-messages", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      var diffTime = Math.abs(new Date() - timeOnline[socket.id]);
      console.log(` User ${socket.id} disconnected after ${diffTime}ms`);

      for (const [roomKey, userIds] of Object.entries(connections)) {
        if (userIds.includes(socket.id)) {
          for (let i = 0; i < connections[roomKey].length; i++) {
            io.to(connections[roomKey][i]).emit("user-left", socket.id);
          }

          const index = connections[roomKey].indexOf(socket.id);
          connections[roomKey].splice(index, 1);

          if (connections[roomKey].length === 0) {
            delete connections[roomKey];
          }

          delete timeOnline[socket.id];
          break;
        }
      }
    });
  });

  return io;
};
