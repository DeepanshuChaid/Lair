"use client";

import { memo } from 'react';
import Cursor from './cursor';

interface CursorPresenceProps {
    cursors: Record<string, {x: number, y: number}>;
}

export const CursorPresence = memo(({ cursors }: CursorPresenceProps) => {
    return (
        <>
            {Object.entries(cursors).map(([userId, position]) => (
                <Cursor 
                    key={userId}
                    connectionId={userId}
                    x={position.x}
                    y={position.y}
                    name={`User ${userId.slice(0, 4)}`} // Or get actual name from a members list
                />
            ))}
        </>
    );
});

CursorPresence.displayName = "CursorPresence";