"use client";

import React, { useState } from "react";
import { UsersListType } from "@/types/user";
import Link from "next/link";
import { Edit, UserCheck, UserX, Trash2 } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import api from "@/lib/axios";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";

interface UserActionsProps {
  data: UsersListType;
  onRefresh: () => void;
}

const UserActions: React.FC<UserActionsProps> = ({ data, onRefresh }) => {
  const { basePath } = useDefaultRoute();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);

  const isDeleted = !!data.deletedat;
  const isEnabled = data.isenabled === 1;

  const handleToggleStatus = async () => {
    if (isDeleted) return;
    setBusy(true);
    try {
      const res = await api.put("/store/user/toggle-status", { userid: data.userid });
      if (res.data?.success) {
        dispatch(showNotification({
          message: isEnabled ? "User disabled" : "User enabled",
          type: NOTIFICATION_TYPES.SUCCESS,
        }));
        onRefresh();
      } else {
        throw new Error(res.data?.error || "Failed to update status");
      }
    } catch (err: any) {
      dispatch(showNotification({ message: err.message, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleted) return;
    if (!window.confirm(`Remove ${data.userfullname}? They will be logged out and cannot log back in. This action keeps their history.`)) return;
    setBusy(true);
    try {
      const res = await api.put("/store/user/soft-delete", { userid: data.userid });
      if (res.data?.success) {
        dispatch(showNotification({ message: "User removed", type: NOTIFICATION_TYPES.SUCCESS }));
        onRefresh();
      } else {
        throw new Error(res.data?.error || "Failed to delete user");
      }
    } catch (err: any) {
      dispatch(showNotification({ message: err.message, type: NOTIFICATION_TYPES.ERROR }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {!isDeleted && (
        <Link
          className="btn btn-sm btn-outline-secondary p-1"
          href={`${basePath}/users/${data.id}`}
          title="Edit"
        >
          <Edit size={14} />
        </Link>
      )}
      <button
        type="button"
        className={`btn btn-sm p-1 ${isDeleted ? "btn-outline-secondary disabled" : isEnabled ? "btn-outline-warning" : "btn-outline-success"}`}
        onClick={handleToggleStatus}
        disabled={busy || isDeleted}
        title={isEnabled ? "Disable user" : "Enable user"}
      >
        {isEnabled ? <UserX size={14} /> : <UserCheck size={14} />}
      </button>
      <button
        type="button"
        className={`btn btn-sm p-1 ${isDeleted ? "btn-outline-secondary disabled" : "btn-outline-danger"}`}
        onClick={handleDelete}
        disabled={busy || isDeleted}
        title={isDeleted ? "Already removed" : "Remove user (soft delete)"}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

export default UserActions;
