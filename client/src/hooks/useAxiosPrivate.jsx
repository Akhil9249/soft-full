import { useEffect } from "react";
// import Swal from "sweetalert2";
import useAuth from "./useAuth";
import { axiosPrivate } from "../axios";
import { genericError } from "../utils/genericError"; 


const useAxiosPrivate = () => {
    const { auth, setAuth } = useAuth();

    useEffect(() => {
        axiosPrivate.interceptors.request.use(
            config => {
                if (config.data instanceof FormData) {
                    config.headers["Content-Type"] = "multipart/form-data";
                  } else {
                    config.headers["Content-Type"] = "application/json";
                  }

                if (!config.headers['Authorization']) {
                    // config.headers['Authorization'] = Token ${auth?.accessToken};
                    config.headers['Authorization'] = auth?.accessToken;
                    // config.headers['Authorization'] = localStorage.getItem("accessToken");
                }

                // const token = localStorage.getItem("accessToken");

                // if (token) {
                //     request.withCredentials = true;
                //     request.headers.Authorization = token;
                // }

                return config;
            },
            error => {
                return Promise.reject(error)
            }
        );

        axiosPrivate.interceptors.response.use(
            response => {
                return response
            },
           async error => {

            genericError(error)

                // const prevRequest = error?.config;
                // if (error?.response?.status === 403 && !prevRequest?.sent) {
                //     prevRequest.sent = true;
                //     return axiosPrivate(prevRequest);
                // }
                // if (error?.response?.status === 401) {
                //     Swal.fire("Unauthorized", "Please verify the credentials", "error")
                // }
                // if (error?.response?.status === 404 && error.response.config.method === "post") {
                //     console.log()
                //     Swal.fire("404", "Page not found", "error")
                // }

                // if (error.response.status === 401) {
                //     const response = await axiosInstance("/refresh-token");
                //     logcalStorage.setItem("accessToken", response.data.accessToken);
                //     // window.location.reload();
                //     // localStorage.clear()
                //     // window.location.href = "/"
                // }

                return Promise.reject(error)
            }
        );
    }, [auth])

    return axiosPrivate
}

export default useAxiosPrivate;