"use client";

import React, { Dispatch, SetStateAction, useEffect } from "react";
import { SelectOption } from "@/types/form";
import Select from "react-select";
import { useParams } from "next/navigation";
import { OutletType } from "@/types/outlet";
import { Col, Row } from "react-bootstrap";

type PropsType = {
  fetchOutletsList: (parsedStoreId: number[]) => void;
  outlets: OutletType[];
  loading: boolean;
  setSelectedOutlet: Dispatch<SetStateAction<number | undefined>>;
  selectedOutlet: number | undefined;
};

const OutletsFilter = ({
  fetchOutletsList,
  outlets,
  loading,
  setSelectedOutlet,
  selectedOutlet,
}: PropsType) => {
  const { storeId } = useParams();
  const parsedStoreId = parseInt(storeId as string, 10);

  useEffect(() => {
    if (parsedStoreId) {
      fetchOutletsList([parsedStoreId]);
    }
  }, [parsedStoreId, fetchOutletsList]);

  const outletList = outlets.map((outlet) => ({
    label: outlet.outletname,
    value: outlet.outletid,
  }));

  useEffect(() => {
    if (outlets.length) {
      setSelectedOutlet(outlets[0]?.outletid);
    }
  }, [outlets, setSelectedOutlet]);

  return (
    <Row className="d-flex align-items-center justify-content-center">
      <Col xs={6} className="mr-0 ">
        <h6 className="p-0 m-0">Select Outlet</h6>
      </Col>
      <Col xs={6} className="p-0 m-0">
        <Select<SelectOption>
          className="img-select"
          classNamePrefix="react-select"
          options={outletList}
          value={
            selectedOutlet
              ? {
                  value: selectedOutlet,
                  label:
                    outletList.find((outlet) => outlet.value === selectedOutlet)
                      ?.label || "",
                }
              : null
          }
          onChange={(option) => {
            const parsedId = parseInt(option?.value as string, 10);
            setSelectedOutlet(parsedId);
          }}
          isLoading={loading}
          styles={{
            container: (provided) => ({ ...provided, width: "10rem" }),
          }}
        />
      </Col>
    </Row>
  );
};

export default OutletsFilter;
