import { SupplierListType } from "@/types/supplier";
import { ColDef } from "ag-grid-community";

export const suopplierListcolumnDefs: ColDef<SupplierListType>[] = [
  { headerName: "Company", field: "companyname", filter: "agTextColumnFilter" },
  { headerName: "Name", field: "contactname", filter: "agTextColumnFilter" },
  {
    headerName: "Account number",
    field: "accountno",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Phone number",
    field: "phone",
    filter: "agNumberColumnFilter",
  },
  {
    headerName: "Email ID",
    field: "emailaddress",
    filter: "agTextColumnFilter",
  },
  { headerName: "Web", field: "webaddress", filter: "agTextColumnFilter" },
  {
    headerName: "Warehouse name",
    field: "warehousename",
    filter: "agTextColumnFilter",
  },
];
