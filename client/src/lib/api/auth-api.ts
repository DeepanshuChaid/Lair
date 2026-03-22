import api from "../axios";

// REGISTER
export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  return await api.post("/auth/register", data, {
    withCredentials: true,
  });
};

// LOGIN
export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  return await api.post("/auth/login", data, {
    withCredentials: true,
  });
};

// GET USER (protected)
export const getUser = async () => {
  return await api.get("/api/user", {
    withCredentials: true,
  });
};

// GOOGLE LOGIN
export const googleLogin = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`;
};

// UPLOAD PROFILE PIC
export const uploadProfilePic = async (file: File) => {
  const formData = new FormData();
  formData.append("profile_picture", file);

  return await api.post("/api/add/profile-picture", formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};