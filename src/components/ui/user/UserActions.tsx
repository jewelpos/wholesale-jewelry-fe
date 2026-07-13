"use client";

import React, { useState } from "react";
import { UsersListType } from "@/types/user";
import Link from "next/link";
import { Edit, UserCheck, UserX, Trash2, MessageSquare, Mail } from "react-feather";
import useDefaultRoute from "@/hooks/useDefaultRoute";
import api from "@/lib/axios";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { useMutation } from "@apollo/client";
import { RESEND_USER_VERIFICATION_OTP_MUTATION, RESEND_USER_VERIFICATION_EMAIL_MUTATION } from "@/lib/graphql/mutations/user";

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
  const smsUnverified = !data.otpverified;
  const emailUnverified = !data.emailverified;

  const [resendOTP, { loading: otpLoading }] = useMutation(RESEND_USER_VERIFICATION_OTP_MUTATION);
  const [resendEmail, { loading: emailLoading }] = useMutation(RESEND_USER_VERIFICATION_EMAIL_MUTATION);

  const handleResendOTP = async () => {
    try {
      const { data: res } = await resendOTP({ variables: { userid: data.userid } });
      if (res?.resendUserVerificationOTP?.success) {
        dispatch(showNotification({ message: "SMS verification sent", type: NOTIFICATION_TYPES.SUCCESS }));
      } else {
        dispatch(showNotification({ message: res?.resendUserVerificationOTP?.error || "Failed to send SMS", type: NOTIFICATION_TYPES.ERROR }));
      }
    } catch (err: any) {
      dispatch(showNotification({ message: err?.graphQLErrors?.[0]?.message || "Failed to send SMS", type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const handleResendEmail = async () => {
    try {
      const { data: res } = await resendEmail({ variables: { userid: data.userid } });
      if (res?.resendUserVerificationEmail?.success) {
        dispatch(showNotification({ message: "Verification email sent", type: NOTIFICATION_TYPES.SUCCESS }));
      } else {
        dispatch(showNotification({ message: res?.resendUserVerificationEmail?.error || "Failed to send email", type: NOTIFICATION_TYPES.ERROR }));
      }
    } catch (err: any) {
      dispatch(showNotification({ message: err?.graphQLErrors?.[0]?.message || "Failed to send email", type: NOTIFICATION_TYPES.ERROR }));
    }
  };

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
      {!isDeleted && smsUnverified && (
        <button
          type="button"
          className="btn btn-sm btn-outline-warning p-1"
          onClick={handleResendOTP}
          disabled={otpLoading}
          title="Resend SMS verification"
        >
          <MessageSquare size={14} />
        </button>
      )}
      {!isDeleted && emailUnverified && (
        <button
          type="button"
          className="btn btn-sm btn-outline-info p-1"
          onClick={handleResendEmail}
          disabled={emailLoading}
          title="Resend email verification"
        >
          <Mail size={14} />
        </button>
      )}
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
