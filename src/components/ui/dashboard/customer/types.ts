export type DashboardCustomer = {
  customerid: number;
  custcompanyname: string | null;
  fullname: string | null;
  custcity: string | null;
  phone: string | null;
  lastsaledate: string | null;
  lastpaymentdate: string | null;
  days_since_last_sale: number | null;
  numberofsales: number | null;
  balancedue: number | null;
  totalsale: number | null;
  opencredit: number | null;
  mobile: string | null;
  custregistrationdate: string | null;
  custemailadd: string | null;
  warehousename: string | null;
  warehouseid: number | null;
  outletid: number | null;
};

export default DashboardCustomer;
