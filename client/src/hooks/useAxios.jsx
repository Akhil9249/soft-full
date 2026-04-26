import React, { useEffect } from 'react'
import useAuth from './useAuth'
import axios from '../axios'
// import axios from 'axios'

const useAxios = () => {
    const { auth, setAuth } = useAuth()
    useEffect(()=>{
        axios.interceptors.request.use(
            config => {
                return config;
            },
            error => {
                return Promise.reject(error)
            }
        );

        axios.interceptors.response.use(
            response => {
                return response
            },
            error => {
                // const prevRequest = error?.config;
                // if (error?.response?.status === 403 && !prevRequest?.sent) {
                //     prevRequest.sent = true;
                //     return axios(prevRequest);
                // }
                // if (error?.response?.status === 401) {
                //     Swal.fire("Unauthorized", "Please verify the credentials", "error")
                // }
                // if (error?.response?.status === 404 && error.response.config.method === "post") {
                //     console.log()
                //     Swal.fire("404", "Page not found", "error")
                // }
                return Promise.reject(error)
            }
        );

    },[auth])
  return axios
}

export default useAxios
