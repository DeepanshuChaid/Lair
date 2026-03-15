const WebSocket = require("ws")

const ws = new WebSocket("wss://c3928af3-6033-44b9-8ba2-5c6f13fb9363-00-1nkw60jgj59p1.sisko.replit.dev/ws");

ws.on("open", () => {
  console.log("connected");
   ws.send(JSON.stringify("hello client"));
})

ws.on("message", (data) => {
  console.log("client:", data.toString());
})

ws.on("close", () => {
  console.log("connection closed");
})