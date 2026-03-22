"use client";

import UserButton from "../user-button/user-button";

export default function Navbar() {
    return (
        <div className="flex items-center gap-x-4 p-5 bg-green-500">
            <div className="hidden lg:flex lg:flex-1">
                <div className="bg-amber-200 w-full h-8" >
                    Search
                </div>
            </div>

            <UserButton />
        </div>
    )
}