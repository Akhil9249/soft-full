import React from "react";
import {
  X,
  FileText,
  Clock3,
  Megaphone,
  CalendarDays,
  Info,
  User,
  Building2,
  Calendar,
} from "lucide-react";

import "./NotificationModal.css";

const typeConfig = {
  "TASK NOTIFICATION": {
    icon: FileText,
    color: "orange",
    label: "Task Notification",
  },
  "REMINDER": {
    icon: Clock3,
    color: "red",
    label: "Reminder",
  },
  "ANNOUNCEMENT": {
    icon: Megaphone,
    color: "green",
    label: "Announcement",
  },
  "WEEKLY SCHEDULE": {
    icon: CalendarDays,
    color: "blue",
    label: "Weekly Schedule",
  },
  "COMMON NOTIFICATION": {
    icon: Info,
    color: "purple",
    label: "Common Notification",
  },
};

const NotificationModal = ({
  notification,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !notification) return null;

  const lookupKey = (notification.type || "").toUpperCase();
  const config = typeConfig[lookupKey] || typeConfig["COMMON NOTIFICATION"];
  const Icon = config.icon;

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div
        className="notification-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div className="notification-modal-header">

          <div className={`modal-type-icon ${config.color}`}>
            <Icon size={25} strokeWidth={2} />
          </div>

          <div className="modal-header-content">
            <div className={`modal-type ${config.color}`}>
              {config.label}
            </div>

            <h2>{notification.title}</h2>

            <div className="modal-sender">
              <User size={14} />
              <span>
                From <strong>{notification.from}</strong>
              </span>
            </div>
          </div>

          <button
            className="modal-close-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={21} />
          </button>

        </div>

        {/* ================= BODY ================= */}
        <div className="notification-modal-body">

          {/* Message */}
          <section className="modal-section">

            <div className="modal-section-title">
              <span className="section-line"></span>
              <h3>Message</h3>
            </div>

            <div className="message-box">
              <p>
                {notification.description}
              </p>
            </div>

          </section>

          {/* Information */}
          <section className="modal-section">

            <div className="modal-section-title">
              <span className="section-line"></span>
              <h3>Notification Information</h3>
            </div>

            <div className="notification-info-grid">

              {/* Published Date */}
              <div className="info-card">

                <div className="info-icon orange">
                  <Calendar size={18} />
                </div>

                <div>
                  <span className="info-label">
                    Date Published
                  </span>

                  <p>
                    {notification.date}
                  </p>

                  {notification.time && (
                    <small>
                      {notification.time}
                    </small>
                  )}
                </div>

              </div>

              {/* Branch */}
              <div className="info-card">

                <div className="info-icon blue">
                  <Building2 size={18} />
                </div>

                <div>
                  <span className="info-label">
                    Branch
                  </span>

                  <p>
                    {notification.branch?.branchName || notification.branch || "calicut"}
                  </p>
                </div>

              </div>

              {/* Sender */}
              <div className="info-card">

                <div className="info-icon purple">
                  <User size={18} />
                </div>

                <div>
                  <span className="info-label">
                    Sender
                  </span>

                  <p>
                    {notification.from}
                  </p>
                </div>

              </div>

              {/* Category */}
              <div className="info-card">

                <div className={`info-icon ${config.color}`}>
                  <Icon size={18} />
                </div>

                <div>
                  <span className="info-label">
                    Category
                  </span>

                  <p>
                    {config.label}
                  </p>
                </div>

              </div>

            </div>

          </section>

        </div>

        {/* ================= FOOTER ================= */}
        <div className="notification-modal-footer">

          <button
            className="modal-close-button"
            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>
    </div>
  );
};

export default NotificationModal;
