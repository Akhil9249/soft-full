import React from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const UserService = () => {

    const axiosPrivate = useAxiosPrivate()

    // ======================================== branch management ========================================

    const getBranchesData = async () => {
        const response = await axiosPrivate.get("/api/branches");
        return response.data;
    };

    const postBranchesData = async (data) => {
        const response = await axiosPrivate.post("/api/branches", data);
        return response.data;
    };

    const putBranchesData = async (branchId, data) => {
        const response = await axiosPrivate.put(`/api/branches/${branchId}`, data);
        return response.data;
    };

    const deleteBranchesData = async (branchId) => {
        const response = await axiosPrivate.delete(`/api/branches/${branchId}`);
        return response.data;
    };


    return { 

        getBranchesData,
        postBranchesData
       
    };
};

export default UserService;
