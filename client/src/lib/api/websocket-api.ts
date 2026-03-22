import API from "../axios";

export const connectSocket = async (roomId: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL;

  // 1. Fetch the short-lived ticket from your Gin middleware
  const res = await API.get(`api/ws/verify/${roomId}`);
  const { ticket } = res.data;

  if (!ticket) {
    throw new Error("Failed to retrieve connection ticket");
  }

  // 2. Initialize the WebSocket with the ticket in the query string
  const socket = new WebSocket(`${backendUrl}/api/ws/${roomId}?ticket=${ticket}`);

  return {socket};
};

