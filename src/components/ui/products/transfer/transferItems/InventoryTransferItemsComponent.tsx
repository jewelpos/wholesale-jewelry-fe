"use client";

import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import { InventoryTransfer } from "@/types/product";
import { GET_INVENTORY_TRANSFER_ITEM_QUERY } from "@/lib/graphql/query/products";

interface Props {
  data: InventoryTransfer;
}

const InventoryTransferItemsComponent = ({ data }: Props) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const [fetchItems, { data: result, loading }] = useLazyQuery(
    GET_INVENTORY_TRANSFER_ITEM_QUERY,
    { fetchPolicy: "no-cache" }
  );

  useEffect(() => {
    if (data.inventoryitemtransferid && parsedStoreId) {
      fetchItems({
        variables: {
          storeid: parsedStoreId,
          inventoryitemtransferid: data.inventoryitemtransferid,
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.inventoryitemtransferid, parsedStoreId]);

  const items: any[] = result?.getInventoryTransferItemList ?? [];

  return (
    <div className="px-4 py-3" style={{ background: "#f8f9fa" }}>
      {loading ? (
        <div className="text-muted" style={{ fontSize: 12 }}>Loading items...</div>
      ) : !items.length ? (
        <div className="text-muted" style={{ fontSize: 12 }}>No items found.</div>
      ) : (
        <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th>Item Code</th>
              <th>Description</th>
              <th className="text-end">Qty Transferred</th>
              <th className="text-end">Qty Received</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.inventoryitemtransferdetailid ?? idx}>
                <td className="text-muted">{idx + 1}</td>
                <td className="fw-semibold">{item.itemcode}</td>
                <td>{item.itemdescription}</td>
                <td className="text-end">{item.transferquantity}</td>
                <td className="text-end">{item.quantityreceived ?? "—"}</td>
                <td>
                  {item.itemreceived ? (
                    <span className="badge bg-success" style={{ fontSize: 10 }}>Received</span>
                  ) : (
                    <span className="badge bg-secondary" style={{ fontSize: 10 }}>Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InventoryTransferItemsComponent;
