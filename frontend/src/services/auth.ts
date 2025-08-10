import axios from "axios";
import { LoginCredentials, LoginResponse, RegisterCredentials, RegisterResponse } from "../types/auth.js";

const API = axios.create({
  baseURL: "http://localhost:5004/api/auth",
  headers: {
    "Content-Type": "application/json",
  },
});
export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await API.post("/login", credentials); // ✅ CORRECT
  return response.data;
};

export const registerUser = async (
  credentials: RegisterCredentials
): Promise<RegisterResponse> => {
  const response = await API.post("/register", credentials);
  return response.data;
};
export default API;
