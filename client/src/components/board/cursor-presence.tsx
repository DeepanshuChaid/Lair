"use client";

import {memo} from 'react';
import Cursor from './cursor';


export const CursorPresence = memo(() => {
    return (
        <>
            <Cursor id="1" name="John Doe" />
        </>
    )
})

CursorPresence.displayName = "CursorPresence";