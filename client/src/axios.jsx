import axios from "axios";

// const apiUrl = import.meta.env.VITE_BACKEND_URL;
const apiUrl = "http://localhost:3000"


export const BASE_URL = apiUrl;
export const MEDIA_URL = "";


export const axiosPrivate = axios.create({
  baseURL: BASE_URL
});