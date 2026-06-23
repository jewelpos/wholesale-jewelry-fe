"use client";

import React from "react";
import { Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { useDispatch } from "react-redux";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { DELETE_PROMOTION_MUTATION, TOGGLE_PROMOTION_ACTIVE_MUTATION } from "@/lib/graphql/mutations/promotions";
import { handleTryCatch } from "@/lib/utils/errorFormatter";

interface Props {
  data: { promotionid: number; isactive: number; promotionname: string };
  onRefresh: () => void;
}

const PromotionActions: React.FC<Props> = ({ data, onRefresh }) => {
  const { storeId: storeIdParam, outletId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const parsedStoreId = parseInt(storeIdParam as string, 10);

  const [deletePromotion] = useMutation(DELETE_PROMOTION_MUTATION);
  const [toggleActive] = useMutation(TOGGLE_PROMOTION_ACTIVE_MUTATION);

  const handleEdit = () =>
    router.push(`/jw/${storeIdParam}/${outletId}/products/promotions/${data.promotionid}/edit`);

  const handleToggle = async () => {
    const result = await handleTryCatch(async () => {
      await toggleActive({ variables: { storeid: parsedStoreId, promotionid: data.promotionid, isactive: data.isactive === 1 ? 0 : 1 } });
      return true;
    });
    if (result.error) dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    else onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete promotion "${data.promotionname}"?`)) return;
    const result = await handleTryCatch(async () => {
      await deletePromotion({ variables: { storeid: parsedStoreId, promotionid: data.promotionid } });
      return true;
    });
    if (result.error) dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    else { dispatch(showNotification({ message: "Promotion deleted", type: NOTIFICATION_TYPES.SUCCESS })); onRefresh(); }
  };

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", height: "100%" }}>
      <button type="button" className="btn btn-sm btn-outline-secondary" style={{ padding: "2px 7px" }} title="Edit" onClick={handleEdit}>
        <Edit size={12} />
      </button>
      <button type="button" className="btn btn-sm btn-outline-secondary" style={{ padding: "2px 7px" }} title={data.isactive === 1 ? "Deactivate" : "Activate"} onClick={handleToggle}>
        {data.isactive === 1 ? <ToggleRight size={12} color="#16a34a" /> : <ToggleLeft size={12} color="#94a3b8" />}
      </button>
      <button type="button" className="btn btn-sm btn-outline-danger" style={{ padding: "2px 7px" }} title="Delete" onClick={handleDelete}>
        <Trash2 size={12} />
      </button>
    </div>
  );
};

export default PromotionActions;
