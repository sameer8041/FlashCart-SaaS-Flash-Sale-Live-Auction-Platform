// src/server/socket.ts
import { Server } from "socket.io";
import IORedis from "ioredis";

// Setup Socket Server on port 3001
const io = new Server(3001, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

// Redis Subscriber Jo worker ke messages sunega
const redisSub = new IORedis(process.env.REDIS_URL as string);

redisSub.subscribe("live-inventory", (err, count) => {
    if (err) console.error("Failed to subscribe: %s", err.message);
    else console.log(`[Socket] Subscribed to live-inventory channel.`);
});

// jab Worker publish karega, toh yahan message aayega
redisSub.on("message", (channel, message) => {
    if (channel === "live-inventory") {
        const data = JSON.parse(message);
        console.log(`📡 Broadcasting stock update for ${data.productId}`);

        //  Sabhi connected Next.js clients ko update bhej do!
        io.emit("stock-updated", data);
    }
});

io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);
    socket.on("disconnect", () => console.log("❌ Client disconnected"));
});

console.log("🚀 WebSocket Server running on ws://localhost:3001");