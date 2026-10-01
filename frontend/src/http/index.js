import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || (
    "http://localhost:3000/api/"
);

const API = axios.create({
    baseURL: API_BASE_URL,
    headers:{
        "Content-Type": "application/json",
        Accept: "application/json"
    }
})

const APIAuth = axios.create({
    baseURL: API_BASE_URL,
    headers:{
        "Content-Type": "application/json",
        Accept: "application/json"
    }
})

APIAuth.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    } else {
        delete config.headers.Authorization
    }

    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"]
    }

    return config
})

export {API, APIAuth};