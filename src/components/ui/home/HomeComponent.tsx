"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import { Tool } from "react-feather";
import InfoHeader from "../InfoHeader";
import { useAppSelector } from "@/lib/store/hook";

const HomeComponent = () => {
  const { storeId } = useParams();
  const user = useAppSelector((state) => state.user.data);

  const tiles = [
    {
      icon: "/assets/img/gif/store.gif",
      title: "Set up your stores",
      sub: "Accurately report on sales performance and manage your inventory",
      link: "Learn more about setting up stores",
      btn: "Add a store",
      btnActive: true,
      disabled: false,
      btnUrl: !storeId ? "/jw/store/create" : `/jw/${storeId}/store/create`,
    },
    {
      icon: "/assets/img/gif/outlet.gif",
      title: "Set up your outlets and registers",
      sub: "Accurately report on sales performance and manage your inventory",
      link: "Learn more about setting up outlets",
      btn: "Add an outlet",
      btnActive: true,
      disabled: !storeId,
      btnUrl: `/jw/${storeId}/outlet/create`,
    },
    {
      icon: "/assets/img/gif/user.gif",
      title: "Set up your users and their roles",
      sub: "Create user accounts and manage what your users are allowed to see and do in Lightspeed Retail.",
      link: "Learn more about setting up users",
      btn: "Add users",
      btnActive: false,
      disabled: !storeId,
    },
    {
      icon: "/assets/img/gif/tax.gif",
      title: "Organize your sales taxes",
      sub: "To make sure your products, reports and accounting systems all work in sync.",
      link: "Learn more about sales taxes",
      btn: "Add sales taxes",
      btnActive: false,
      disabled: !storeId,
    },
    {
      icon: "/assets/img/gif/payment.gif",
      title: "Create different payment types",
      sub: "Start accepting multiple types of payments in your outlets.",
      link: "Learn more about payment types",
      btn: "Add payment types",
      btnActive: false,
      disabled: !storeId,
    },
    {
      icon: "/assets/img/gif/products.gif",
      title: "Add your product catalog to Lightspeed Retail",
      sub: "Build your product catalog so you can start selling products in-store and online.",
      link: "Learn more about adding products",
      btn: "Add products",
      btnActive: false,
      disabled: !storeId,
    },
    {
      icon: "/assets/img/gif/inventory.gif",
      title: "Inventory added to your products",
      sub: "Continue using stock control to ensure your inventory levels and costs stay accurate.",
      link: "Learn more about inventory in Lightspeed Retail",
      btn: "",
      btnActive: false,
      disabled: !storeId,
    },
    // {
    //   icon: "/assets/img/gif/receipt.gif",
    //   title: "Customize your receipt templates",
    //   sub: "Choose what information you want to show on your receipts and how it should be displayed.",
    //   link: "Learn more about receipt templates",
    //   btn: "Add recipient templates",
    //   btnActive: false,
    // },
    {
      icon: "/assets/img/gif/ready.gif",
      title: "Ready to get selling?",
      sub: "Once you're done setting up, this dashboard will show you how your business is doing at a glance.",
      link: "",
      btn: "I'm ready to sell",
      btnActive: false,
      disabled: !storeId,
    },
  ];

  return (
    <>
      <InfoHeader
        title={storeId ? `Hi ${user?.name},` : `Welcome ${user?.name},`}
        para={
          storeId
            ? "Manage your business efficiently with quick access to key modules."
            : "Create your first store and details. Store name will be considered as your outlet name by default."
        }
      />
      <div className="content container-fluid">
        <div className="row">
          {tiles.map((tile) => (
            <div
              className="col-xxl-3 col-xl-6 col-lg-6 col-md-6 d-flex "
              key={tile.title}
            >
              <div className={`connected-app-card d-flex w-100 `}>
                <ul className={`w-100 ${tile.disabled && "disabled-card"}`}>
                  <li className="flex-column align-items-start">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div className="security-type d-flex align-items-center">
                        <span className="system-app-icon">
                          <Image
                            src={tile.icon}
                            height={40}
                            width={40}
                            alt={`${tile.title} gif`}
                            unoptimized
                          />
                        </span>
                        <div className="security-title">
                          <h6 className="lead">
                            <b>{tile.title}</b>
                          </h6>
                        </div>
                      </div>
                    </div>
                    <br></br>
                    <p className="lead">{tile.sub}</p>
                    <Link className="btn-link " href="#">
                      {tile.link}
                    </Link>
                  </li>
                  <li>
                    <div className="integration-btn">
                      {tile.btn && (
                        <Link
                          href={tile.btnUrl || "#"}
                          type="button"
                          className="btn btn-outline-primary rounded-pill "
                        >
                          <Tool className="me-2" />
                          {tile.btn}
                        </Link>
                      )}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HomeComponent;
