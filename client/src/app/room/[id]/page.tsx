// app/room/[id]/page.tsx

"use client";

import React, { use } from "react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

function Board({ boardId }: { boardId: string }) {
  // Pass the boardId down to a store/websocket integration later

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-neutral-100 touch-none"
      data-board-id={boardId}
    >
      <Tldraw persistenceKey={`board-${boardId}`} />
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Board boardId={id} />;
}