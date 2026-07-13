"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Eye, EyeOff, Lock, User, Mail, Phone, Shield, CheckCircle, XCircle, X } from "react-feather";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import {
  GET_ACTIVE_USER_INFO_QUERY,
  UPDATE_MY_PROFILE_MUTATION,
  CHANGE_PASSWORD_MUTATION,
} from "@/lib/graphql/mutations/auth";

const MyProfileForm = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { data, loading: profileLoading, refetch } = useQuery(GET_ACTIVE_USER_INFO_QUERY, { fetchPolicy: "network-only" });
  const user = data?.getActiveUserInfo?.data?.user;

  const [name, setName] = useState("");
  const [nameChanged, setNameChanged] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [updateMyProfile, { loading: nameLoading }] = useMutation(UPDATE_MY_PROFILE_MUTATION);
  const [changePassword, { loading: pwLoading }] = useMutation(CHANGE_PASSWORD_MUTATION);

  useEffect(() => {
    if (user?.name) { setName(user.name); setNameChanged(false); }
  }, [user?.name]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data: res } = await updateMyProfile({ variables: { userfullname: name.trim() } });
      if (res?.updateMyProfile?.success) {
        dispatch(showNotification({ message: "Profile updated", type: NOTIFICATION_TYPES.SUCCESS }));
        setNameChanged(false);
        refetch();
      } else {
        dispatch(showNotification({ message: res?.updateMyProfile?.error || "Failed to update", type: NOTIFICATION_TYPES.ERROR }));
      }
    } catch (err: any) {
      dispatch(showNotification({ message: err?.graphQLErrors?.[0]?.message || "An error occurred", type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (!currentPassword) { setPasswordError("Current password is required"); return; }
    if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match"); return; }
    try {
      // Note: changePassword mutation doesn't verify current password on backend currently
      // It uses the JWT-authenticated user — change this if current password check is added later
      const { data: res } = await changePassword({ variables: { newPassword } });
      if (res?.changePassword?.success) {
        dispatch(showNotification({ message: "Password changed successfully", type: NOTIFICATION_TYPES.SUCCESS }));
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        dispatch(showNotification({ message: res?.changePassword?.error || "Failed to change password", type: NOTIFICATION_TYPES.ERROR }));
      }
    } catch (err: any) {
      dispatch(showNotification({ message: err?.graphQLErrors?.[0]?.message || "An error occurred", type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const VerifiedBadge = ({ verified }: { verified: boolean }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: verified ? "#dcfce7" : "#fef2f2", color: verified ? "#16a34a" : "#dc2626" }}>
      {verified ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {verified ? "Verified" : "Not verified"}
    </span>
  );

  return (
    <div className="row g-3 mt-1">
      <div className="col-12" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h4 style={{ color: "#1e293b", fontWeight: 700, marginBottom: 4 }}>My Profile</h4>
          <p style={{ color: "#64748b", fontSize: 13 }}>Manage your personal information and account security.</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-sm btn-outline-secondary"
          style={{ display: "flex", alignItems: "center", gap: 4 }}
          title="Close"
        >
          <X size={14} /> Close
        </button>
      </div>

      {/* Profile info card */}
      <div className="col-lg-6">
        <div className="card" style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div className="card-body p-4">
            <h6 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>Profile Information</h6>

            {profileLoading ? (
              <div className="text-center py-3"><i className="fas fa-spinner fa-spin" style={{ color: "#3b82f6" }} /></div>
            ) : (
              <form onSubmit={handleSaveName}>
                {/* Name */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Full name</label>
                  <div className="input-group">
                    <span className="input-group-text"><User size={14} /></span>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setNameChanged(e.target.value !== (user?.name || "")); }}
                    />
                  </div>
                </div>

                {/* Email — read only */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Email address</label>
                  <div className="input-group">
                    <span className="input-group-text"><Mail size={14} /></span>
                    <input type="email" className="form-control" value={user?.email || ""} readOnly style={{ background: "#f8fafc" }} />
                    <span className="input-group-text" style={{ background: "#f8fafc" }}>
                      <VerifiedBadge verified={!!user?.emailverified} />
                    </span>
                  </div>
                </div>

                {/* Phone — read only */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Phone number</label>
                  <div className="input-group">
                    <span className="input-group-text"><Phone size={14} /></span>
                    <input type="text" className="form-control" value={user?.phone || ""} readOnly style={{ background: "#f8fafc" }} />
                    <span className="input-group-text" style={{ background: "#f8fafc" }}>
                      <VerifiedBadge verified={!!user?.otpverified} />
                    </span>
                  </div>
                </div>

                {/* Role — read only */}
                <div className="mb-4">
                  <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Role</label>
                  <div className="input-group">
                    <span className="input-group-text"><Shield size={14} /></span>
                    <input type="text" className="form-control" value={user?.role || ""} readOnly style={{ background: "#f8fafc" }} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-sm" disabled={nameLoading || !nameChanged}>
                  {nameLoading ? <><i className="fas fa-spinner fa-spin me-1" />Saving…</> : "Save Changes"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="col-lg-6">
        <div className="card" style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <div className="card-body p-4">
            <h6 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>Change Password</h6>
            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Current password</label>
                <div className="input-group">
                  <span className="input-group-text"><Lock size={14} /></span>
                  <input type={showCurrent ? "text" : "password"} className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                  <button type="button" className="input-group-text" style={{ background: "#fff", cursor: "pointer" }} onClick={() => setShowCurrent((v) => !v)}>
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>New password</label>
                <div className="input-group">
                  <span className="input-group-text"><Lock size={14} /></span>
                  <input type={showNew ? "text" : "password"} className="form-control" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }} placeholder="At least 8 characters" />
                  <button type="button" className="input-group-text" style={{ background: "#fff", cursor: "pointer" }} onClick={() => setShowNew((v) => !v)}>
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Confirm new password</label>
                <div className="input-group">
                  <span className="input-group-text"><Lock size={14} /></span>
                  <input type={showConfirm ? "text" : "password"} className="form-control" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }} placeholder="Repeat new password" />
                  <button type="button" className="input-group-text" style={{ background: "#fff", cursor: "pointer" }} onClick={() => setShowConfirm((v) => !v)}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {passwordError && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{passwordError}</div>}
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading}>
                {pwLoading ? <><i className="fas fa-spinner fa-spin me-1" />Saving…</> : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfileForm;
