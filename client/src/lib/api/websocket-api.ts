import API from "../axios";

export const connectSocket = async (roomId: string): Promise<any> => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL;

  try {
    const res = await API.get(`api/ws/verify/${roomId}`);
    const { ticket } = res.data;

    if (!ticket) throw new Error("No ticket received");

    const socket = new WebSocket(`${backendUrl}/api/ws/${roomId}?ticket=${ticket}`);
    return { socket, error: null };
  } catch (err: any) {
    // This catches 401, 500, and network errors
    return { 
        socket: null, 
        error: err.response?.data?.message || err.message || "Connection failed" 
    };
  }
};  

