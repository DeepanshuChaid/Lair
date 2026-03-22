import NewRoomButton from "../new-room-button/new-room-button"

export const Sidebar = () => {
    return (
        <aside className="text-white fixed x-[1] left-0 bg-blue-950 h-full w-[60px] flex p-3 flex-col gap-y-4">
            <NewRoomButton />
        </aside>
    )
}