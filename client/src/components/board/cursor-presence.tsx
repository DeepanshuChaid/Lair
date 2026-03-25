"use client";

import { memo } from 'react';
import Cursor from './cursor';
import { useAuth } from '@/providers/auth-provider';

interface CursorPresenceProps {
    cursors: Record<string, {x: number, y: number, name: string}>;
}

export const CursorPresence = memo(({ cursors }: CursorPresenceProps) => {
    const {user} = useAuth();

    return (
        <>
            {Object.entries(cursors).map(([userId, position]) => {
                if (userId === user?.id) return;
                return (
                <Cursor 
                    key={userId}
                    connectionId={userId}
                    x={position.x}
                    y={position.y}
                    name={`${position.name || "AMIE"}`} // Or get actual name from a members list
                />
            )}
        )}
        </>
    );
});

CursorPresence.displayName = "CursorPresence";

// const otherCursor = [
//  userId: {x: number, y: number}       
// ]