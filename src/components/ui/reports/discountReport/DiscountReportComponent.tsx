"use client";

import React, { useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useLazyQuery } from "@apollo/client";
import { ColDef } from "ag-grid-community";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import "ag-grid-enterprise";

import { GET_DISCOUNT_REPORT_QUERY } from "@/lib/graphql/query/discountReport";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { formatCurrency } from "@/lib/utils/currencyFormat";

const { RangePicker } = DatePicker;

const SOURCE_LABELS: Record<string, string> = {
  item: 'Item',
  bulk: 'Bulk',
  promotion: 'Promo',
  manual: 'Manual',
};
const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  item: { bg: '#eff6ff', color: '#1e40af' },
  bulk: { bg: '#dcfce7', color: '#166534' },
  promotion: { bg: '#ede9fe', color: '#6d28d9' },
  manual: { bg: '#fef3c7', color: '#92400e' },
};

const columnDefs: ColDef[] = [
  { field: 'invoicedate', headerName: 'Date', width: 110, sort: 'desc' },
  { field: 'invoicenumber', headerName: 'Invoice #', width: 110 },
  { field: 'custcompanyname', headerName: 'Customer', flex: 1, minWidth: 130 },
  { field: 'itemcode', headerName: 'Item Code', width: 110 },
  { field: 'itemdescription', headerName: 'Description', flex: 1, minWidth: 150 },
  {
    field: 'discountsource', headerName: 'Source', width: 100,
    cellRenderer: ({ value }: { value: string }) => {
      const c = SOURCE_COLORS[value] ?? { bg: '#f3f4f6', color: '#374151' };
      return (
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: c.bg, color: c.color, fontWeight: 600 }}>
          {SOURCE_LABELS[value] ?? value}
        </span>
      );
    },
  },
  { field: 'promotionname', headerName: 'Promo Name', width: 140 },
  { field: 'discountpercent', headerName: 'Disc %', width: 90, valueFormatter: ({ value }) => value != null ? `${Number(value).toFixed(2)}%` : '' },
  { field: 'discountamount', headerName: 'Disc Amt', width: 110, valueFormatter: ({ value }) => formatCurrency(Number(value || 0)), type: 'numericColumn' },
  { field: 'netamount', headerName: 'Net Amt', width: 110, valueFormatter: ({ value }) => formatCurrency(Number(value || 0)), type: 'numericColumn' },
  { field: 'warehousename', headerName: 'Warehouse', width: 120 },
];

const DiscountReportComponent = () => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact>(null);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs(),
  ]);

  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [getDiscountReport, { loading }] = useLazyQuery(GET_DISCOUNT_REPORT_QUERY, { fetchPolicy: 'network-only' });

  const handleSearch = async () => {
    if (!dateRange[0] || !dateRange[1]) {
      dispatch(showNotification({ message: 'Select a date range', type: NOTIFICATION_TYPES.ERROR }));
      return;
    }
    const fromdate = dateRange[0].format('YYYY-MM-DD');
    const todate = dateRange[1].format('YYYY-MM-DD');
    const { data } = await getDiscountReport({ variables: { storeid: parsedStoreId, fromdate, todate } });
    const report = data?.getDiscountReport;
    setRows(report?.lines ?? []);
    setSummary(report?.summary ?? []);
    setHasLoaded(true);
  };

  const handleExport = () => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `discount_report_${dayjs().format('YYYYMMDD')}.csv` });
  };

  const totalDiscount = summary.reduce((acc, s) => acc + Number(s.totaldiscountamount ?? 0), 0);

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-title">
          <h4>Discount Report</h4>
          <h6>Discount breakdown by source — item, bulk, promo, manual</h6>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-auto">
              <label className="form-label small text-muted mb-1">Date Range</label>
              <RangePicker
                value={dateRange as any}
                onChange={(v) => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
                format="MMM D, YYYY"
                allowClear={false}
              />
            </div>
            <div className="col-auto">
              <button className="btn btn-submit" onClick={handleSearch} disabled={loading}>
                {loading ? 'Loading…' : 'Run Report'}
              </button>
            </div>
            {hasLoaded && rows.length > 0 && (
              <div className="col-auto">
                <button className="btn btn-cancel" onClick={handleExport}>Export CSV</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {hasLoaded && (
        <div className="row g-3 mb-3">
          <div className="col-auto">
            <div className="card h-100" style={{ minWidth: 160 }}>
              <div className="card-body py-2 px-3">
                <div className="text-muted" style={{ fontSize: 11 }}>Total Discount</div>
                <div className="fw-bold" style={{ fontSize: 18 }}>{formatCurrency(totalDiscount)}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{rows.length} lines</div>
              </div>
            </div>
          </div>
          {summary.map((s) => {
            const c = SOURCE_COLORS[s.discountsource] ?? { bg: '#f3f4f6', color: '#374151' };
            return (
              <div className="col-auto" key={s.discountsource}>
                <div className="card h-100" style={{ minWidth: 140, borderTop: `3px solid ${c.color}` }}>
                  <div className="card-body py-2 px-3">
                    <div style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>{SOURCE_LABELS[s.discountsource] ?? s.discountsource}</div>
                    <div className="fw-bold" style={{ fontSize: 16 }}>{formatCurrency(Number(s.totaldiscountamount))}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{s.totallines} lines</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <div className="card">
        <div className="card-body p-0">
          <div className="ag-theme-quartz" style={{ height: 500 }}>
            <AgGridReact
              ref={gridRef}
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
              rowHeight={28}
              headerHeight={32}
              suppressCellFocus
              overlayNoRowsTemplate={hasLoaded ? '<span class="text-muted">No discount lines found for the selected period.</span>' : '<span class="text-muted">Run the report to see results.</span>'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountReportComponent;
