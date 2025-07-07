import axios from "axios";
import { LoginCredentials, LoginResponse } from "../types/auth";

const API = axios.create({
  baseURL: "http://localhost:5050/api/auth",
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await API.post("/login", credentials);
  return response.data;
};
