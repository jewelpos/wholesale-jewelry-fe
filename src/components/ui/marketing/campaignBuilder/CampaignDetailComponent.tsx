"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { ArrowLeft } from "react-feather";
import api from "@/lib/axios";
import { handleTryCatch } from "@/lib/utils/errorFormatter";

type CampaignItemSnapshot = { itemcode: string; itemdescription: string; itemsellprice: number; itemimagepath: string | null };

type Campaign = {
  campaignid: number;
  subject: string;
  introtext: string | null;
  items: CampaignItemSnapshot[];
  createddate: string;
  totalrecipients: number;
  totalsent: number;
  totalfailed: number;
};

type Recipient = {
  id: number;
  customerid: number;
  email: string;
  status: "sent" | "failed" | "skipped_no_consent";
  errormessage: string | null;
  senddate: string;
  custcompanyname: string | null;
};

const statusBadge = (status: Recipient["status"]) => {
  if (status === "sent") return <span className="badge bg-success-subtle text-success">Sent</span>;
  if (status === "failed") return <span className="badge bg-danger-subtle text-danger">Failed</span>;
  return <span className="badge bg-secondary-subtle text-secondary">Skipped</span>;
};

const CampaignDetailComponent = () => {
  const { storePrefix, storeId, outletId, campaignId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const basePath = `/${storePrefix}/${storeId}/${outletId}`;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parsedStoreId || !campaignId) return;
    const fetchDetail = async () => {
      setLoading(true);
      const result = await handleTryCatch(async () => {
        const { data } = await api.get(`/store/marketing/campaigns/${campaignId}`, {
          params: { storeid: parsedStoreId },
        });
        return data;
      });
      if (!result.error) {
        setCampaign(result.data?.campaign ?? null);
        setRecipients(result.data?.recipients ?? []);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [parsedStoreId, campaignId]);

  if (loading) return <div className="text-center py-4"><div className="spinner-border spinner-border-sm" /></div>;
  if (!campaign) return <div className="text-muted text-center py-4">Campaign not found.</div>;

  return (
    <div className="d-flex flex-column gap-3">
      <Link href={`${basePath}/customers/emails`} className="d-flex align-items-center gap-1 text-decoration-none small">
        <ArrowLeft size={14} /> Back to Sent Campaigns
      </Link>

      <div className="card">
        <div className="card-header">
          <span className="fw-semibold">{campaign.subject}</span>
          <span className="text-muted small ms-2">{dayjs(campaign.createddate).format("MMM D, YYYY h:mm A")}</span>
        </div>
        <div className="card-body">
          {campaign.introtext && <p className="text-muted">{campaign.introtext}</p>}
          <div className="d-flex flex-wrap gap-3 mb-3">
            <span className="small">Recipients: <strong>{campaign.totalrecipients}</strong></span>
            <span className="small text-success">Sent: <strong>{campaign.totalsent}</strong></span>
            <span className="small text-danger">Failed: <strong>{campaign.totalfailed}</strong></span>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {campaign.items.map((item) => (
              <div key={item.itemcode} className="border rounded p-2" style={{ width: 150 }}>
                {item.itemimagepath && (
                  <img src={item.itemimagepath} alt={item.itemdescription} width={130} height={130} style={{ objectFit: "cover", borderRadius: 4 }} />
                )}
                <div className="small fw-semibold mt-1">{item.itemdescription}</div>
                <div className="small text-muted">{item.itemcode}</div>
                <div className="small fw-bold">${Number(item.itemsellprice ?? 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header fw-semibold">Recipients</div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.id}>
                    <td>{r.custcompanyname ?? r.customerid}</td>
                    <td>{r.email}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td>{dayjs(r.senddate).format("MMM D, YYYY h:mm A")}</td>
                    <td className="text-danger small">{r.errormessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailComponent;
