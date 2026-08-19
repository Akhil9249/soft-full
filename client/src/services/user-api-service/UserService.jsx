import React from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const UserService = () => {
    const axiosPrivate = useAxiosPrivate();



    // ======================================== interns attendance management ========================================
    const getMyAttendanceData = async (params = {}) => {
        const response = await axiosPrivate.get("/api/interns-attendance/my-attendance", { params });
        return response;
    };

    // ======================================== task submission management ========================================
    const postTaskSubmissionData = async (data) => {
        const response = await axiosPrivate.post("/api/task-submissions", data);
        return response;
    };

    const getMySubmissionsData = async (queryParams = '') => {
        const url = queryParams ? `/api/task-submissions/my-submissions?${queryParams}` : "/api/task-submissions/my-submissions";
        const response = await axiosPrivate.get(url);
        return response.data;
    };

    const downloadSubmissionAttachment = async (submissionId, index = 0) => {
        const response = await axiosPrivate.get(`/api/task-submissions/${submissionId}/download?index=${index}`, {
            responseType: 'blob'
        });
        return response;
    };

    const getMyTasksData = async (queryParams = '') => {
        const url = queryParams ? `/api/tasks/my-tasks?${queryParams}` : "/api/tasks/my-tasks";
        const response = await axiosPrivate.get(url);
        return response.data;
    };

    // ======================================== material management ========================================
    const getMyMaterialsData = async (paramsString = '') => {
        const response = await axiosPrivate.get(`/api/materials/my-materials?${paramsString}`);
        return response.data;
    };

    const downloadMaterialAttachment = async (materialId) => {
        const response = await axiosPrivate.get(`/api/materials/${materialId}/download`, {
            responseType: 'blob'
        });
        return response;
    };

    // ======================================== leave request management ========================================
    const getMyLeaveRequests = async (queryParams = '') => {
        const url = queryParams ? `/api/leave-requests/my?${queryParams}` : "/api/leave-requests/my";
        const response = await axiosPrivate.get(url);
        return response.data;
    };

    const postLeaveRequest = async (data) => {
        const response = await axiosPrivate.post("/api/leave-requests", data);
        return response.data;
    };

    // ======================================== notification management ========================================
    const getMyNotificationsData = async (page = 1, limit = 10) => {
        const response = await axiosPrivate.get(`/api/notifications/intern?page=${page}&limit=${limit}`);
        return response.data;
    };

    const markNotificationAsRead = async (id) => {
        const response = await axiosPrivate.post(`/api/notifications/intern/${id}/read`);
        return response.data;
    };

    const getUnreadNotificationsCount = async () => {
        const response = await axiosPrivate.get("/api/notifications/intern/unread-count");
        return response.data;
    };

    return { 
        getMyAttendanceData,
        postTaskSubmissionData,
        getMySubmissionsData,
        downloadSubmissionAttachment,
        getMyTasksData,
        getMyMaterialsData,
        downloadMaterialAttachment,
        getMyLeaveRequests,
        postLeaveRequest,
        getMyNotificationsData,
        markNotificationAsRead,
        getUnreadNotificationsCount
    };
};

export default UserService;
