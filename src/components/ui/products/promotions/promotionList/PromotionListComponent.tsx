"use client";

import React, { useCallback, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLazyQuery } from "@apollo/client";
import { AgGridReact } from "ag-grid-react";
import { PlusCircle } from "lucide-react";
import { GET_PROMOTION_LIST_QUERY } from "@/lib/graphql/query/promotions";
import { getPromotionColumnDefs } from "./ColumnDef";
import PromotionActions from "./PromotionActions";

const PromotionListComponent = () => {
  const { storeId: storeIdParam, outletId } = useParams();
  const router = useRouter();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<any[]>([]);

  const [getPromotions, { loading }] = useLazyQuery(GET_PROMOTION_LIST_QUERY, {
    fetchPolicy: "network-only",
    onCompleted: (data) => setRowData(data?.getPromotionList ?? []),
  });

  const loadData = useCallback(() => {
    if (parsedStoreId) getPromotions({ variables: { storeid: parsedStoreId } });
  }, [parsedStoreId, getPromotions]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const colDefs = getPromotionColumnDefs();

  return (
    <div style={{ padding: "4px 0 32px" }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="add-item d-flex justify-content-between align-items-center w-100">
          <div className="page-title">
            <h4>Promotions</h4>
            <h6>Manage date-range discount campaigns by item or category</h6>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => router.push(`/jw/${storeIdParam}/${outletId}/products/promotions/new`)}
          >
            <PlusCircle size={14} style={{ marginRight: 5 }} />
            New Promotion
          </button>
        </div>
      </div>

      <div className="card mt-3" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <div className="card-body p-0">
          <div className="ag-theme-quartz" style={{ height: 480, width: "100%" }}>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={colDefs}
              rowHeight={32}
              headerHeight={36}
              defaultColDef={{ resizable: true, sortable: true, filter: false }}
              components={{ promotionActionsRenderer: (p: any) => <PromotionActions data={p.data} onRefresh={loadData} /> }}
              overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading...</span>' : undefined}
              suppressCellFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionListComponent;
