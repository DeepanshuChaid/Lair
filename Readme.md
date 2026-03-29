# Lair 🖌️

A high-performance, real-time collaborative whiteboard built with **Go** and **Next.js**. Lair focuses on low-latency state distribution and efficient data persistence through intelligent batched synchronization.

---

## 🚀 System Architecture

Lair is designed to handle high-frequency user input without choking the server or the database. It splits the workload into two distinct layers:

### 1. The Real-Time Engine (Go + Gin + WebSockets)
The backend acts as a high-speed "Hub" to ensure every user sees what others are drawing in real-time.
* **Concurrent Broadcasting:** Leverages Go’s `goroutines` and `channels` to pipe mouse coordinates across all connected clients instantly.
* **Presence Tracking:** Manages active cursor states using a lightweight `{id: {x, y}}` payload, keeping the network overhead minimal.
* **Stability:** Implemented custom **Ping/Pong** heartbeat logic to maintain persistent connections and prevent silent timeouts.

### 2. The Persistence Strategy (Write-Behind)
Instead of saving to a database 60 times a second (which would crash most systems), Lair uses a sophisticated **Debounced Batching** approach:
* **Debounced API:** Frontend edits are captured and held locally until the user stops drawing.
* **Batch Sync:** Once debounced, the system sends a single "Batch Update" or "Batch Delete" payload to the Gin server.
* **Optimization:** This reduces database write operations by over **90%**, ensuring the app stays snappy even with multiple users.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Golang, Gin Gonic, WebSockets |
| **Frontend** | Next.js, TypeScript, Tailwind CSS |
| **Drawing Logic** | Pure Svg (No Lib) |
| **State Management** | React Hooks + Batching Logic |

---

## 🧠 Engineering Highlights

* **Architectural Choice:** Opted for **Golang/Gin** over Node.js for superior concurrency handling and a stricter type system.
* **Bandwidth Efficiency:** Designed a custom JSON protocol for cursor movements to minimize the bytes sent per frame.
* **Layer Synchronization:** Developed logic to handle "Layer Updated" and "Layer Deleted" events as batched arrays rather than individual requests.

---

## 🏗 Getting Started

### Backend (Go)
```bash
cd server
go run cmd/main.go

### Frontend (Nextjs)
```bash
cd client
npm run dev