"use client";

import React, { useState } from "react";
import { Table, Input, Select, Switch, Avatar } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { AgGridReact } from "ag-grid-react";

const { Option } = Select;

// Define TypeScript types
interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  outlet: string;
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  lastActive: string;
  enabled: boolean;
  avatarInitials: string;
  avatarColor: string;
}

const UserComponent = () => {
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("All roles");
  const [outletFilter, setOutletFilter] = useState<string>("All outlets");

  const users: UserData[] = [
    {
      id: "1",
      name: "memurugan30@gmail.com (Muruga NA)",
      email: "memurugan30@gmail.com",
      role: "Account owner, Admin",
      outlet: "All outlets",
      dailyTarget: 0.0,
      weeklyTarget: 0.0,
      monthlyTarget: 0.0,
      lastActive: "7 minutes ago",
      enabled: true,
      avatarInitials: "MN",
      avatarColor: "purple",
    },
    {
      id: "2",
      name: "SQA (DDAAEO)",
      email: "mem@dvom",
      role: "Cashier",
      outlet: "All outlets",
      dailyTarget: 3033,
      weeklyTarget: 303,
      monthlyTarget: 0.0,
      lastActive: "never",
      enabled: false,
      avatarInitials: "D",
      avatarColor: "orange",
    },
  ];

  const columnDefs: ColDef<UserData>[] = [
    {
      headerName: "User",
      field: "name",
      filter: true,
      cellRenderer: (params: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar style={{ backgroundColor: params.data.avatarColor }}>
            {params.data.avatarInitials}
          </Avatar>
          <div>
            <a href={`mailto:${params.data.email}`}>{params.value}</a>
            <div style={{ fontSize: "12px", color: "#888" }}>
              {params.data.email}
            </div>
          </div>
        </div>
      ),
    },
    { headerName: "Role", field: "role" },
    { headerName: "Outlet", field: "outlet" },
    {
      headerName: "Daily Target",
      field: "dailyTarget",
      valueFormatter: (params: any) => `₹ ${params.value.toFixed(2)}`,
    },
    {
      headerName: "Weekly Target",
      field: "weeklyTarget",
      valueFormatter: (params: any) => `₹ ${params.value.toFixed(2)}`,
      filter: "agSetColumnFilter",
    },
    {
      headerName: "Monthly Target",
      field: "monthlyTarget",
      valueFormatter: (params: any) => `₹ ${params.value.toFixed(2)}`,
    },
    { headerName: "Last Active", field: "lastActive" },
    {
      headerName: "Enabled",
      field: "enabled",
      cellRenderer: (params: any) => <Switch defaultChecked={params.value} />,
    },
  ];
  return (
    <div
      className="ag-theme-quartz custom-theme"
      style={{ height: 500, width: "100%" }}
    >
      <AgGridReact<UserData>
        rowData={users}
        columnDefs={columnDefs}
        defaultColDef={{
          filter: true,
        }}
      />
    </div>
  );
};

export default UserComponent;
