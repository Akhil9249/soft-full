import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/user/UserNavBar';
import UserService from '../../../services/user-api-service/UserService';
import Tabs from "../../../components/button/Tabs";
import NotificationModal from "./NotificationModal";
import {
  FileText,
  Clock3,
  Megaphone,
  CalendarDays,
  Info,
  Search,
  SlidersHorizontal,
  Eye,
  MoreVertical,
  Bell,
  RefreshCw
} from "lucide-react";

import "./Notifications.css";

export const Notification = () => {
    const [activeTab, setActiveTab] = useState('notifications');
    const userService = UserService();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    // Filter/Search states
    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");

    // View details modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingNotification, setViewingNotification] = useState(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await userService.getMyNotificationsData(1, 100); // Fetch a larger chunk to allow correct local filtering
            if (res?.data) {
                setNotifications(res.data);
                setPagination(res.pagination);
            } else {
                setNotifications([]);
                setPagination(null);
            }
        } catch (err) {
            console.error('Failed to load notifications:', err);
            setError('Failed to load notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const handleNewFCMNotification = (e) => {
            console.log("New FCM notification event received on list page, refreshing:", e.detail);
            fetchNotifications();
        };

        window.addEventListener("new-fcm-notification", handleNewFCMNotification);

        // Polling fallback: pull new notifications automatically every 15 seconds
        const pollInterval = setInterval(() => {
            fetchNotifications();
        }, 15000);

        return () => {
            window.removeEventListener("new-fcm-notification", handleNewFCMNotification);
            clearInterval(pollInterval);
        };
    }, []);

    const handleViewNotification = async (notification) => {
        setViewingNotification(notification);
        setShowViewModal(true);
        if (!notification.isRead) {
            try {
                await userService.markNotificationAsRead(notification._id);
                // Dispatch event so that UserNavBar knows to update unread count
                window.dispatchEvent(new Event("notification-marked-read"));
                // Update local list state immediately without forcing full list reload
                setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
            } catch (err) {
                console.error("Failed to mark notification as read:", err);
            }
        }
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setViewingNotification(null);
    };

    const getMappedNotifications = () => {
        return notifications.map(notification => {
            let color = "orange";
            let icon = FileText;

            switch (notification.type) {
                case "Task Notification":
                    color = "orange";
                    icon = FileText;
                    break;
                case "Reminder":
                    color = "red";
                    icon = Clock3;
                    break;
                case "Announcement":
                    color = "green";
                    icon = Megaphone;
                    break;
                case "Weekly Schedule":
                    color = "blue";
                    icon = CalendarDays;
                    break;
                case "Common Notification":
                    color = "purple";
                    icon = Info;
                    break;
                default:
                    color = "orange";
                    icon = FileText;
            }

            // Format date and time
            let dateStr = "";
            let timeStr = "";
            if (notification.createdAt) {
                const d = new Date(notification.createdAt);
                dateStr = d.toLocaleDateString();
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            return {
                ...notification,
                id: notification._id,
                title: notification.title,
                description: notification.content,
                from: notification.branch?.branchName || "Admin",
                date: dateStr,
                time: timeStr,
                color,
                icon,
                unread: !notification.isRead,
            };
        });
    };

    const mapped = getMappedNotifications();

    // Calculate dynamic counts based on all loaded items
    const counts = {
        All: mapped.length,
        Task: mapped.filter(n => n.type.toLowerCase().includes("task")).length,
        Reminder: mapped.filter(n => n.type.toLowerCase().includes("reminder")).length,
        Announcement: mapped.filter(n => n.type.toLowerCase().includes("announcement")).length,
        Schedule: mapped.filter(n => n.type.toLowerCase().includes("schedule")).length,
        Common: mapped.filter(n => n.type.toLowerCase().includes("common")).length,
    };

    const filters = [
        { label: "All", count: counts.All },
        { label: "Task", count: counts.Task },
        { label: "Reminder", count: counts.Reminder },
        { label: "Announcement", count: counts.Announcement },
        { label: "Schedule", count: counts.Schedule },
        { label: "Common", count: counts.Common },
    ];

    const filteredNotifications = mapped.filter((notification) => {
        const matchesFilter =
            activeFilter === "All" ||
            notification.type
                .toLowerCase()
                .includes(activeFilter.toLowerCase());

        const matchesSearch =
            notification.title.toLowerCase().includes(search.toLowerCase()) ||
            notification.description
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            notification.type.toLowerCase().includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const paginatedNotifications = filteredNotifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const tabOptions = [
        { value: "notifications", label: "My Notifications" }
    ];
    const headData = "Notifications";

    return (
        <div className="notification-page">
            <Navbar headData={headData} activeTab={activeTab}>
                <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
            </Navbar>

            {/* Filter / Search Toolbar */}
            <div className="notification-toolbar">
                <div className="filter-list">
                    {filters.map((filter) => (
                        <button
                            key={filter.label}
                            className={`filter-btn ${
                                activeFilter === filter.label ? "active" : ""
                            }`}
                            onClick={() => { setActiveFilter(filter.label); setCurrentPage(1); }}
                        >
                            <span>{filter.label}</span>
                            <span className="filter-count">{filter.count}</span>
                        </button>
                    ))}
                </div>

                <div className="notification-search">
                    <Search size={17} />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                <button className="filter-settings" onClick={() => fetchNotifications(1)}>
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Notification List */}
            <div className="notification-list">
                {loading && notifications.length === 0 ? (
                    <div className="empty-notification">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#ff7518]" />
                        <span>Loading notifications...</span>
                    </div>
                ) : error ? (
                    <div className="empty-notification text-red-500">
                        <span>{error}</span>
                    </div>
                ) : paginatedNotifications.length === 0 ? (
                    <div className="empty-notification">
                        No notifications found
                    </div>
                ) : (
                    paginatedNotifications.map((notification) => {
                        const Icon = notification.icon;
                        return (
                            <div
                                className={`notification-card ${notification.color}`}
                                key={notification.id}
                                onClick={() => handleViewNotification(notification)}
                            >
                                {/* Unread dot */}
                                {notification.unread && (
                                    <span className="unread-dot"></span>
                                )}

                                {/* Icon */}
                                <div className="notification-icon">
                                    <Icon size={25} strokeWidth={2} />
                                </div>

                                {/* Content */}
                                <div className="notification-content">
                                    <div className={`notification-type ${notification.color}`}>
                                        {notification.type}
                                    </div>
                                    <h3>{notification.title}</h3>
                                    <p className="notification-description">
                                        {notification.description}
                                    </p>
                                    <p className="notification-from">
                                        From: <span>{notification.from}</span>
                                    </p>
                                </div>

                                {/* Date */}
                                <div className="notification-date">
                                    <div>
                                        <CalendarDays size={14} />
                                        <span>{notification.date}</span>
                                    </div>
                                    <span className="notification-time">
                                        {notification.time}
                                    </span>
                                </div>

                                {/* Action */}
                                <button 
                                    className="view-details"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewNotification(notification);
                                    }}
                                >
                                    <Eye size={15} />
                                    <span>View Details</span>
                                </button>

                                {/* More */}
                                <button className="more-btn" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            {totalPages > 1 && (
                <div className="notification-footer">
                    <span>
                        Showing {paginatedNotifications.length} of {filteredNotifications.length} notifications
                    </span>

                    <div className="pagination">
                        <button 
                            disabled={currentPage === 1 || loading}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            style={{ opacity: (currentPage === 1 || loading) ? 0.5 : 1 }}
                        >
                            ‹
                        </button>
                        <button className="current">{currentPage}</button>
                        <button 
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            style={{ opacity: (currentPage === totalPages || loading) ? 0.5 : 1 }}
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}

            <NotificationModal
                notification={viewingNotification}
                isOpen={showViewModal}
                onClose={closeViewModal}
            />
        </div>
    );
};
