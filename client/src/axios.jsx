import axios from "axios";

const apiUrl = import.meta.env.VITE_BACKEND_URL;


export const BASE_URL = apiUrl;
export const MEDIA_URL = "";

export default axios.create({
  baseURL: BASE_URL,
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  // headers: {
  //   "Content-Type": "application/json",
  // },
  //   headers: {
  //     "Content-Type": "multipart/form-data",
  // },
});