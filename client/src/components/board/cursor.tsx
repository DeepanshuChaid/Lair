"use client";

import { memo } from "react";

interface CursorProps {
    id: String, 
    name: string
}

const Cursor = memo(({id, name}: CursorProps) => {
    

    return (
        <>
            Hellow
        </>
    )
})

Cursor.displayName = "Cursor";

export default Cursor