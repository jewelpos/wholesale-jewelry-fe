"use client";

import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import { hideNotification } from "@/lib/store/slice/notificationSlice";
import React, { useEffect } from "react";
import { Toast } from "react-bootstrap";

const Notification = () => {
  const dispatch = useAppDispatch();
  const { show, message, type, duration } = useAppSelector(
    (state) => state.notification
  );

  useEffect(() => {
    let timer: any;
    if (show) {
      timer = setTimeout(() => {
        dispatch(hideNotification());
      }, duration);
    }
    return () => clearTimeout(timer);
  }, [show, duration, dispatch]);

  if (!show) return null;

  const getToastClass = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return "bg-success text-fixed-white";
      case NOTIFICATION_TYPES.ERROR:
        return "bg-danger text-fixed-white";
      case NOTIFICATION_TYPES.WARNING:
        return "bg-warning text-fixed-dark";
      default:
        return "bg-info text-fixed-white";
    }
  };

  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3">
      <Toast
        show={show}
        onClose={() => dispatch(hideNotification())}
        id="solidPrimaryToast"
        className={`colored-toast ${getToastClass()}`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <Toast.Header closeButton className={getToastClass()}>
          <strong className="me-auto">{message}</strong>
        </Toast.Header>
      </Toast>
    </div>
  );
};

export default Notification;
