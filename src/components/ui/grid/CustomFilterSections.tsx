import React from "react";
import OutletsFilter from "./OutletsFilter";
import useOutlets from "@/hooks/useOutlets";

interface Props {
  search?: string;
  setSearch?: React.Dispatch<React.SetStateAction<string>>;
  selectedOutlet?: number | undefined;
  setSelectedOutlet?: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const CustomFilterSections = ({
  search,
  setSearch,
  selectedOutlet,
  setSelectedOutlet,
}: Props) => {
  const { fetchOutletsList, loading: outletsLoading, outlets } = useOutlets();
  return (
    <div className="container-fluid my-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div className="input-group w-50 w-md-100">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch?.(e.target.value)}
          />
          <span className="input-group-text">
            <i data-feather="search" className="feather-search" />
          </span>
        </div>
        {setSelectedOutlet && (
          <div className="d-flex align-items-center w-25 w-md-100">
            <OutletsFilter
              fetchOutletsList={fetchOutletsList}
              outlets={outlets}
              loading={outletsLoading}
              setSelectedOutlet={setSelectedOutlet}
              selectedOutlet={selectedOutlet}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFilterSections;
