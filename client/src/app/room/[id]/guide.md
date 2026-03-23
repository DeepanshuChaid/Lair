To store the Tldraw canvas in your database, you have to extract the "state" from Tldraw and send it to your Go backend. 

There are **two main ways** to do this depending on your goals:

### Approach 1: The "Save Button" Way (Snapshot)
If you just want to save the board periodically or when someone hits a "Save" button, you can grab the entire board state as a JSON file.

```tsx
<Tldraw 
  onMount={(editor) => {
    // 1. Get the current state as a JSON object
    const snapshot = editor.store.getSnapshot();
    
    // 2. Send it to your Go backend
    fetch(`/api/room/${boardId}/save`, {
       method: "POST",
       body: JSON.stringify(snapshot)
    });

    // 3. Later, when loading the room, you can inject the data back:
    // editor.store.loadSnapshot(savedSnapshotFromDB)
  }} 
/>
```
* **Pros:** Very easy to do. Stores nicely in a Postgres `JSONB` column or MongoDB.
* **Cons:** Not real-time collaborative. 


### Approach 2: The Real-Time Collaborative Way (WebSockets)
Since you already have a Go WebSocket server running, you can listen to **every single change** a user makes (drawing a line, moving a shape) and broadcast it to everyone else in the room, while also saving it to your DB!

```tsx
<Tldraw 
  onMount={(editor) => {
    // Listen to every change on the canvas
    editor.store.listen((update) => {
      // 'update' contains exactly what shapes were added, updated, or removed
      
      // 1. Send this tiny update over your WebSocket
      myWebSocket.send(JSON.stringify({
         type: "CANVAS_UPDATE",
         room: boardId,
         data: update.changes
      }));
    }, { source: 'user', scope: 'document' }); 
    // ^ This ensures we only broadcast changes this specific user made
  }} 
/>
```
On your Go server, you can receive these `CANVAS_UPDATE` WebSocket messages, append them to a database log (or update a JSON document), and immediately broadcast the update to the other users in the room. 

When another user receives the WebSocket message on the frontend, you just apply it:
```tsx
// When receiving a message from Go WebSocket:
editor.store.mergeRemoteChanges(() => {
   editor.store.applyDiff(message.data);
});
```

### Next Steps
Since you have a real-time "Lair", **Approach 2** is the industry standard. Tldraw's local data store was practically built for this exact architecture! 

Would you like me to help you write the React hook to connect Tldraw's `editor.store` directly into your existing Go WebSockets?