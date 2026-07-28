"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { Plus, Mail } from "react-feather";
import api from "@/lib/axios";
import { handleTryCatch } from "@/lib/utils/errorFormatter";

type CampaignRow = {
  campaignid: number;
  subject: string;
  createddate: string;
  totalrecipients: number;
  totalsent: number;
  totalfailed: number;
};

const SentCampaignsListComponent = () => {
  const { storePrefix, storeId, outletId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);
  const basePath = `/${storePrefix}/${storeId}/${outletId}`;

  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perpage = 25;

  useEffect(() => {
    if (!parsedStoreId || !parsedOutletId) return;
    const fetchList = async () => {
      setLoading(true);
      const result = await handleTryCatch(async () => {
        const { data } = await api.get("/store/marketing/campaigns", {
          params: { storeid: parsedStoreId, outletid: parsedOutletId, page, perpage },
        });
        return data;
      });
      if (!result.error) {
        setRows(result.data?.data ?? []);
        setTotal(result.data?.total ?? 0);
      }
      setLoading(false);
    };
    fetchList();
  }, [parsedStoreId, parsedOutletId, page]);

  const totalPages = Math.max(1, Math.ceil(total / perpage));

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <Mail size={16} />
          <span className="fw-semibold">Sent Campaigns</span>
        </div>
        <Link href={`${basePath}/customers/emails/new`} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
          <Plus size={14} />
          New Campaign
        </Link>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-4"><div className="spinner-border spinner-border-sm" /></div>
        ) : rows.length === 0 ? (
          <div className="text-muted text-center py-4">No campaigns sent yet.</div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Recipients</th>
                    <th>Sent</th>
                    <th>Failed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.campaignid}>
                      <td>{dayjs(r.createddate).format("MMM D, YYYY h:mm A")}</td>
                      <td>{r.subject}</td>
                      <td>{r.totalrecipients}</td>
                      <td className="text-success">{r.totalsent}</td>
                      <td className={r.totalfailed > 0 ? "text-danger" : ""}>{r.totalfailed}</td>
                      <td>
                        <Link href={`${basePath}/customers/emails/${r.campaignid}/view`} className="btn btn-outline-secondary btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                <span className="small text-muted align-self-center">Page {page} of {totalPages}</span>
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SentCampaignsListComponent;
