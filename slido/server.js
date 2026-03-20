const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// In-memory store
const rooms = new Map();

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function createRoom(hostName) {
  const code = generateCode();
  const room = {
    code,
    hostName,
    hostSocketId: null,
    createdAt: Date.now(),
    questions: [],
    polls: [],
    wordClouds: [],
    participants: new Set(),
  };
  rooms.set(code, room);
  return room;
}

function roomState(room) {
  return {
    code: room.code,
    hostName: room.hostName,
    questions: room.questions,
    polls: room.polls,
    wordClouds: room.wordClouds,
    participantCount: room.participants.size,
  };
}

io.on("connection", (socket) => {
  let currentRoom = null;
  let isHost = false;
  let userName = null;

  // ── Room management ──────────────────────────────────

  socket.on("create-room", (data, cb) => {
    const room = createRoom(data.hostName);
    room.hostSocketId = socket.id;
    currentRoom = room.code;
    isHost = true;
    userName = data.hostName;
    socket.join(room.code);
    room.participants.add(socket.id);
    cb({ ok: true, room: roomState(room) });
  });

  socket.on("join-room", (data, cb) => {
    const room = rooms.get(data.code);
    if (!room) return cb({ ok: false, error: "Room not found" });
    currentRoom = data.code;
    isHost = false;
    userName = data.name || "Anonymous";
    socket.join(data.code);
    room.participants.add(socket.id);
    io.to(data.code).emit("participant-count", room.participants.size);
    cb({ ok: true, room: roomState(room) });
  });

  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.participants.delete(socket.id);
    io.to(currentRoom).emit("participant-count", room.participants.size);
    if (isHost && room.participants.size === 0) {
      rooms.delete(currentRoom);
    }
  });

  // ── Q&A ──────────────────────────────────────────────

  socket.on("submit-question", (data, cb) => {
    const room = rooms.get(currentRoom);
    if (!room) return cb?.({ ok: false });
    const q = {
      id: crypto.randomUUID(),
      text: data.text,
      author: userName,
      votes: 0,
      votedBy: [],
      answered: false,
      pinned: false,
      createdAt: Date.now(),
    };
    room.questions.push(q);
    io.to(currentRoom).emit("questions-updated", room.questions);
    cb?.({ ok: true });
  });

  socket.on("vote-question", (data) => {
    const room = rooms.get(currentRoom);
    if (!room) return;
    const q = room.questions.find((q) => q.id === data.id);
    if (!q) return;
    const idx = q.votedBy.indexOf(socket.id);
    if (idx === -1) {
      q.votedBy.push(socket.id);
      q.votes++;
    } else {
      q.votedBy.splice(idx, 1);
      q.votes--;
    }
    io.to(currentRoom).emit("questions-updated", room.questions);
  });

  socket.on("mark-answered", (data) => {
    const room = rooms.get(currentRoom);
    if (!room || !isHost) return;
    const q = room.questions.find((q) => q.id === data.id);
    if (q) q.answered = !q.answered;
    io.to(currentRoom).emit("questions-updated", room.questions);
  });

  socket.on("pin-question", (data) => {
    const room = rooms.get(currentRoom);
    if (!room || !isHost) return;
    room.questions.forEach((q) => (q.pinned = q.id === data.id ? !q.pinned : false));
    io.to(currentRoom).emit("questions-updated", room.questions);
  });

  socket.on("delete-question", (data) => {
    const room = rooms.get(currentRoom);
    if (!room || !isHost) return;
    room.questions = room.questions.filter((q) => q.id !== data.id);
    io.to(currentRoom).emit("questions-updated", room.questions);
  });

  // ── Polls ────────────────────────────────────────────

  socket.on("create-poll", (data, cb) => {
    const room = rooms.get(currentRoom);
    if (!room || !isHost) return cb?.({ ok: false });
    const poll = {
      id: crypto.randomUUID(),
      question: data.question,
      options: data.options.map((text) => ({ text, votes: 0, votedBy: [] })),
      active: true,
      showResults: false,
      multipleChoice: data.multipleChoice || false,
      createdAt: Date.now(),
    };
    // deactivate other polls
    room.polls.forEach((p) => (p.active = false));
    room.polls.push(poll);
    io.to(currentRoom).emit("polls-updated", room.polls);
    cb?.({ ok: true });
  });

  socket.on("vote-poll", (data) => {
    const room = rooms.get(currentRoom);
    if (!room) return;
    const poll = room.polls.find((p) => p.id === data.pollId);
    if (!poll || !poll.active) return;

    // Remove previous votes if single choice
    if (!poll.multipleChoice) {
      poll.options.forEach((opt) => {
        const idx = opt.votedBy.indexOf(socket.id);
        if (idx !== -1) {
          opt.votedBy.splice(idx, 1);
          opt.votes--;
        }
      });
    }

    const option = poll.options[data.optionIndex];
    if (!option) return;
    const idx = option.votedBy.indexOf(socket.id);
    if (idx === -1) {
      option.votedBy.push(socket.id);
      option.votes++;
    } else {
      option.votedBy.splice(idx, 1);
      option.votes--;
    }
    io.to(currentRoom).emit("polls-updated", room.polls);
  });

  socket.on("toggle-poll-results", (data) => {
    const room = rooms.get(currentRoom);
    if (!room || !isHost) return;
    const poll = room.polls.find((p) => p.id === data.pollId);
    if (poll) poll.showResults = !poll.showResults;
    io.to(currentRoom).emit("polls-updated", room.polls);
  });

  socket.on("close-poll", (data) => {
    const room = rooms.get(currentRoom);
    if (!room || !isHost) return;
    const poll = room.polls.find((p) => p.id === data.pollId);
    if (poll) {
      poll.active = false;
      poll.showResults = true;
    }
    io.to(currentRoom).emit("polls-updated", room.polls);
  });

  socket.on("delete-poll", (data) => {
    const room = rooms.get(currentRoom);
    if (!room || !isHost) return;
    room.polls = room.polls.filter((p) => p.id !== data.pollId);
    io.to(currentRoom).emit("polls-updated", room.polls);
  });

  // ── Word Clouds ──────────────────────────────────────

  socket.on("create-wordcloud", (data, cb) => {
    const room = rooms.get(currentRoom);
    if (!room || !isHost) return cb?.({ ok: false });
    const wc = {
      id: crypto.randomUUID(),
      prompt: data.prompt,
      active: true,
      entries: [],
      createdAt: Date.now(),
    };
    room.wordClouds.forEach((w) => (w.active = false));
    room.wordClouds.push(wc);
    io.to(currentRoom).emit("wordclouds-updated", room.wordClouds);
    cb?.({ ok: true });
  });

  socket.on("submit-word", (data) => {
    const room = rooms.get(currentRoom);
    if (!room) return;
    const wc = room.wordClouds.find((w) => w.id === data.wcId);
    if (!wc || !wc.active) return;
    // max 3 submissions per user per cloud
    const userEntries = wc.entries.filter((e) => e.socketId === socket.id);
    if (userEntries.length >= 3) return;
    const word = data.word.trim().substring(0, 40);
    if (!word) return;
    wc.entries.push({ word, socketId: socket.id });
    io.to(currentRoom).emit("wordclouds-updated", room.wordClouds);
  });

  socket.on("close-wordcloud", (data) => {
    const room = rooms.get(currentRoom);
    if (!room || !isHost) return;
    const wc = room.wordClouds.find((w) => w.id === data.wcId);
    if (wc) wc.active = false;
    io.to(currentRoom).emit("wordclouds-updated", room.wordClouds);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Slido clone running at http://localhost:${PORT}`);
});
