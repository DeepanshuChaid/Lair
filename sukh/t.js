const WebSocket = require("ws")

// change this if your URL is different
const ws = new WebSocket("wss://c3928af3-6033-44b9-8ba2-5c6f13fb9363-00-1nkw60jgj59p1.sisko.replit.dev/ws")

ws.on("open", () => {
  console.log("Connected to server")

  // send a message every 3 seconds
  setInterval(() => {
    const msg = "Hello from Node " + Date.now()
    console.log("Sending:", msg)

    ws.send(msg)
  }, 3000)
})

ws.on("message", (data) => {
  console.log("Received:", data.toString())
})

ws.on("close", () => {
  console.log("Disconnected")
})

ws.on("error", (err) => {
  console.log("Error:", err)
})