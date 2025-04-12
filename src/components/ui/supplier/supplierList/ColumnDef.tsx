import { SupplierListType } from "@/types/supplier";
import { ColDef } from "ag-grid-community";

export const suopplierListcolumnDefs: ColDef<SupplierListType>[] = [
  { headerName: "Company", field: "companyname" },
  { headerName: "Name", field: "contactname" },
  { headerName: "Account number", field: "accountno" },
  { headerName: "Phone number", field: "phone" },
  { headerName: "Email ID", field: "emailaddress" },
  { headerName: "Web", field: "webaddress" },
  { headerName: "Warehouse name", field: "warehousename" },
];
