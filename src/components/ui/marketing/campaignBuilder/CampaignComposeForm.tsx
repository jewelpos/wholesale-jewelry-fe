"use client";

import React, { useEffect, useState } from "react";
import { Send } from "react-feather";
import api from "@/lib/axios";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { CampaignItem } from "./CampaignProductPicker";
import { CampaignCustomer } from "./CampaignCustomerPicker";

interface Props {
  storeid: number;
  outletid: number;
  selectedItems: CampaignItem[];
  selectedCustomers: CampaignCustomer[];
  onSent: () => void;
}

type Quota = { emaillimit: number | null; email_sent: number; remaining: number | null };

const CampaignComposeForm = ({ storeid, outletid, selectedItems, selectedCustomers, onSent }: Props) => {
  const dispatch = useAppDispatch();
  const [subject, setSubject] = useState("");
  const [introtext, setIntrotext] = useState("");
  const [quota, setQuota] = useState<Quota | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; skippedNoConsent: number[] } | null>(null);

  const consented = selectedCustomers.filter((c) => c.marketingoptin);
  const notConsented = selectedCustomers.filter((c) => !c.marketingoptin);

  useEffect(() => {
    if (!storeid || !outletid || selectedCustomers.length === 0) {
      setQuota(null);
      return;
    }
    const fetchQuota = async () => {
      const result = await handleTryCatch(async () => {
        const { data } = await api.post("/store/marketing/campaign/candidates", {
          storeid,
          outletid,
          customerids: selectedCustomers.map((c) => c.customerid),
        });
        return data?.quota as Quota;
      });
      if (!result.error) setQuota(result.data ?? null);
    };
    fetchQuota();
  }, [storeid, outletid, selectedCustomers]);

  const overLimit = quota?.remaining !== null && quota?.remaining !== undefined && consented.length > quota.remaining;
  const canSend = subject.trim() && selectedItems.length > 0 && consented.length > 0 && !overLimit && !sending;

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    const sendResult = await handleTryCatch(async () => {
      const { data } = await api.post("/store/marketing/campaign/send", {
        storeid,
        outletid,
        itemcodes: selectedItems.map((i) => i.itemcode),
        customerids: selectedCustomers.map((c) => c.customerid),
        subject,
        introtext,
      });
      return data;
    });
    setSending(false);

    if (sendResult.error) {
      dispatch(showNotification({ message: sendResult.error, type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    setResult({
      sent: sendResult.data.sent,
      failed: sendResult.data.failed,
      skippedNoConsent: sendResult.data.skippedNoConsent ?? [],
    });
    dispatch(showNotification({
      message: `Campaign sent: ${sendResult.data.sent} sent, ${sendResult.data.failed} failed.`,
      type: NOTIFICATION_TYPES.SUCCESS,
    }));
    onSent();
  };

  return (
    <div>
      <div className="mb-3">
        <label className="form-label">Subject</label>
        <input className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Check out our new arrivals!" />
      </div>
      <div className="mb-3">
        <label className="form-label">Intro Message</label>
        <textarea className="form-control" rows={3} value={introtext} onChange={(e) => setIntrotext(e.target.value)} placeholder="A short note to include above the product list..." />
      </div>

      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        <span className="small text-muted">{selectedItems.length} product(s) selected</span>
        <span className="small text-muted">{selectedCustomers.length} customer(s) selected ({consented.length} subscribed)</span>
        {quota && (
          <span className={`small fw-semibold ${overLimit ? "text-danger" : "text-muted"}`}>
            {quota.emaillimit === null ? "Unlimited email quota" : `${quota.remaining} of ${quota.emaillimit} emails remaining this month`}
          </span>
        )}
      </div>

      {notConsented.length > 0 && (
        <div className="alert alert-warning py-2 small">
          {notConsented.length} selected customer(s) are not subscribed and will be skipped.
        </div>
      )}
      {overLimit && (
        <div className="alert alert-danger py-2 small">
          This would exceed your remaining email quota for this month ({quota?.remaining} remaining). Deselect some customers before sending.
        </div>
      )}
      {result && (
        <div className="alert alert-info py-2 small">
          Sent: {result.sent}, Failed: {result.failed}
          {result.skippedNoConsent.length > 0 && `, Skipped (not subscribed): ${result.skippedNoConsent.length}`}
        </div>
      )}

      <button type="button" className="btn btn-primary d-flex align-items-center gap-2" disabled={!canSend} onClick={handleSend}>
        <Send size={14} />
        {sending ? "Sending..." : "Send Campaign"}
      </button>
    </div>
  );
};

export default CampaignComposeForm;
