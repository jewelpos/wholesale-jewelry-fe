import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Tool } from "react-feather";

const Home = () => {
  const tiles = [
    {
      icon: "/assets/img/gif/store.gif",
      title: "Set up your outlets and registers",
      sub: "Accurately report on sales performance and manage your inventory",
      link: "Learn more about setting up outlets",
      btn: "Add an outlet",
      btnActive: true,
    },
    {
      icon: "/assets/img/gif/user.gif",
      title: "Set up your users and their roles",
      sub: "Create user accounts and manage what your users are allowed to see and do in Lightspeed Retail.",
      link: "Learn more about setting up users",
      btn: "Add users",
      btnActive: false,
    },
    {
      icon: "/assets/img/gif/tax.gif",
      title: "Organize your sales taxes",
      sub: "To make sure your products, reports and accounting systems all work in sync.",
      link: "Learn more about sales taxes",
      btn: "Add sales taxes",
      btnActive: false,
    },
    {
      icon: "/assets/img/gif/payment.gif",
      title: "Create different payment types",
      sub: "Start accepting multiple types of payments in your outlets.",
      link: "Learn more about payment types",
      btn: "Add payment types",
      btnActive: false,
    },
    {
      icon: "/assets/img/gif/products.gif",
      title: "Add your product catalog to Lightspeed Retail",
      sub: "Build your product catalog so you can start selling products in-store and online.",
      link: "Learn more about adding products",
      btn: "Add products",
      btnActive: false,
    },
    {
      icon: "/assets/img/gif/inventory.gif",
      title: "Inventory added to your products",
      sub: "Continue using stock control to ensure your inventory levels and costs stay accurate.",
      link: "Learn more about inventory in Lightspeed Retail",
      btn: "",
      btnActive: false,
    },
    {
      icon: "/assets/img/gif/receipt.gif",
      title: "Customize your receipt templates",
      sub: "Choose what information you want to show on your receipts and how it should be displayed.",
      link: "Learn more about receipt templates",
      btn: "Add recipient templates",
      btnActive: false,
    },
    {
      icon: "/assets/img/gif/ready.gif",
      title: "Ready to get selling?",
      sub: "Once you're done setting up, this dashboard will show you how your business is doing at a glance.",
      link: "",
      btn: "I'm ready to sell",
      btnActive: false,
    },
  ];

  return (
    <div>
      <div className="page-wrapper cardhead">
        <div className="content container-fluid">
          <div className="row">
            {tiles.map((tile) => (
              <div className="col-xxl-3 col-xl-6 col-lg-6 col-md-6 d-flex">
                <div className="connected-app-card d-flex w-100">
                  <ul className="w-100">
                    <li className="flex-column align-items-start">
                      <div className="d-flex align-items-center justify-content-between w-100">
                        <div className="security-type d-flex align-items-center">
                          <span className="system-app-icon">
                            <img src={tile.icon} />
                          </span>
                          <div className="security-title">
                            <h5>{tile.title}</h5>
                          </div>
                        </div>
                      </div>
                      <br></br>
                      <p>{tile.sub}</p>
                      <Link className="btn-link" href="#">
                        {tile.link}
                      </Link>
                    </li>
                    <li>
                      <div className="integration-btn">
                        {tile.btn && (
                          <Link
                            href="#"
                            data-bs-toggle="modal"
                            data-bs-target="#google-captcha"
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
      </div>
    </div>
  );
};

export default Home;
