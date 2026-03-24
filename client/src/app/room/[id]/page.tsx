// app/room/[id]/page.tsx

"use client";

import React, { use } from "react";
import { Tldraw, TldrawUiMenuItem, DefaultToolbar, TldrawUiButton, TldrawUiIcon } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import Link from "next/link";

// 1. Create a custom Overlay component for the Logo and Home button
const CustomHeader = () => {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex items-center gap-4 pointer-events-auto">
      <Link href="/">
        <button className="flex items-center justify-center w-10 h-10 bg-white border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors">
             {/* Home Icon */}
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
             </svg>
        </button>
      </Link>
      
      <div className="px-3 py-1 bg-white border border-neutral-200 rounded-lg shadow-sm flex items-center">
        <span className="font-bold tracking-tighter text-black">DEEPANSHU CHAID</span>
      </div>
    </div>
  );
};

function Board({ boardId }: { boardId: string }) {
  return (
    <div
      className="fixed inset-0 overflow-hidden bg-neutral-100 touch-none"
      data-board-id={boardId}
    >
      <Tldraw
        persistenceKey={`board-${boardId}`}
        // 2. Inject the component here
        components={{
          SharePanel: CustomHeader,
        }}
        onMount={(editor) => {
          editor.store.listen((update) => {
            // This is where your WebSocket sync logic will eventually go
            console.log(update.changes);
          });
        }}
      />
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Board boardId={id} />;
}