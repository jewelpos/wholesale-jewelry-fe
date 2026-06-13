"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { Modal, Form } from "react-bootstrap";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useParams } from "next/navigation";
import {
  ADD_SUBCATEGORY_MUTATION,
  EDIT_SUBCATEGORY_MUTATION,
} from "@/lib/graphql/mutations/products";
import {
  Subcategory,
  AddSubcategoryInput,
  EditSubcategoryInput,
} from "@/types/product";
import SelectItemCategory from "@/components/forms/SelectItemCategory";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import ButtonLoader from "@/components/ui/ButtonLoader";
import useWarehouse from "@/hooks/useWarehouse";
import { LayoutList, type LucideIcon } from "lucide-react";

interface SubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Subcategory | null;
}

interface SubcategoryFormData {
  subcategoryname: string;
  subcategorydescription: string;
  categoryid: number;
  warehouseid: number;
}

const SectionLabel = ({ label, icon: Icon }: { label: string; icon: LucideIcon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "4px 0 14px" }}>
    <Icon size={13} strokeWidth={2} color="#6c757d" />
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#6c757d", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: "#dee2e6" }} />
  </div>
);

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
    {children}{required && <span className="text-danger ms-1">*</span>}
  </label>
);

const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
}) => {
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [loading, setLoading] = useState(false);
  const { fetchWarehouseByStoreId, warehouses } = useWarehouse();

  const [addSubcategory] = useMutation(ADD_SUBCATEGORY_MUTATION);
  const [editSubcategory] = useMutation(EDIT_SUBCATEGORY_MUTATION);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    trigger,
    register,
    formState: { errors },
  } = useForm<SubcategoryFormData>({
    defaultValues: {
      subcategoryname: "",
      subcategorydescription: "",
      categoryid: 0,
      warehouseid: 0,
    },
  });

  useEffect(() => {
    if (parsedStoreId) fetchWarehouseByStoreId(parsedStoreId);
  }, [fetchWarehouseByStoreId, parsedStoreId]);

  // Populate on edit, or reset with system warehouse pre-selected on create
  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setValue("subcategoryname", editData.subcategoryname || "");
      setValue("subcategorydescription", editData.subcategorydescription || "");
      setValue("categoryid", editData.categoryid);
      setValue("warehouseid", editData.warehouseid);
    } else {
      const systemWh = warehouses.find(w => w.issystem);
      reset({
        subcategoryname: "",
        subcategorydescription: "",
        categoryid: 0,
        warehouseid: systemWh?.warehouseid || 0,
      });
    }
  }, [isOpen, editData, warehouses, setValue, reset]);

  const onSubmit = async (data: SubcategoryFormData) => {
    setLoading(true);

    const result = await handleTryCatch(async () => {
      if (editData) {
        const editInput: EditSubcategoryInput = {
          subcategoryid: editData.subcategoryid,
          subcategoryname: data.subcategoryname,
          subcategorydescription: data.subcategorydescription,
          categoryid: data.categoryid,
          warehouseid: data.warehouseid,
          storeid: parsedStoreId,
        };
        const { data: res } = await editSubcategory({ variables: { editSubcategoryInput: editInput } });
        if (res?.editSubcategory.success) {
          dispatch(showNotification({ message: res.editSubcategory.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onSuccess();
          onClose();
        }
      } else {
        const addInput: AddSubcategoryInput = {
          subcategoryname: data.subcategoryname,
          subcategorydescription: data.subcategorydescription,
          categoryid: data.categoryid,
          warehouseid: data.warehouseid,
          storeid: parsedStoreId,
        };
        const { data: res } = await addSubcategory({ variables: { addSubcategoryInput: addInput } });
        if (res?.addSubcategory.success) {
          dispatch(showNotification({ message: res.addSubcategory.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onSuccess();
          onClose();
        }
      }
      return true;
    });

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }

    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal show={isOpen} onHide={handleClose} centered>
      <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 24px" }}>
        <Modal.Title style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
          {editData ? "Edit Product Line" : "Create Product Line"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body style={{ padding: "20px 24px 8px" }}>
          <SectionLabel label="Product Line Details" icon={LayoutList} />

          {/* Name */}
          <div className="mb-3">
            <FieldLabel required>Product Line Name</FieldLabel>
            <Controller
              name="subcategoryname"
              control={control}
              rules={{ required: "Product line name is required" }}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  size="sm"
                  type="text"
                  placeholder="e.g. Diamond Solitaire, Gold Chain"
                  isInvalid={!!errors.subcategoryname}
                />
              )}
            />
            <Form.Control.Feedback type="invalid">
              {errors.subcategoryname?.message}
            </Form.Control.Feedback>
          </div>

          {/* Category + Warehouse */}
          <div className="row g-2 mb-3">
            <div className="col-6">
              <FieldLabel required>Parent Category</FieldLabel>
              <Controller
                name="categoryid"
                control={control}
                rules={{ required: "Category is required", validate: v => v !== 0 || "Category is required" }}
                render={({ field }) => (
                  <SelectItemCategory
                    {...field}
                    onChange={(value: number) => field.onChange(value)}
                    trigger={trigger}
                    storeId={parsedStoreId}
                    className={errors.categoryid ? "is-invalid" : ""}
                  />
                )}
              />
              {errors.categoryid && (
                <div className="invalid-feedback d-block">{errors.categoryid.message}</div>
              )}
            </div>
            <div className="col-6">
              <FieldLabel required>Warehouse</FieldLabel>
              <Controller
                name="warehouseid"
                control={control}
                rules={{ required: "Warehouse is required", validate: v => v !== 0 || "Warehouse is required" }}
                render={({ field }) => (
                  <SelectWarehouse
                    {...field}
                    onChange={(value: number) => field.onChange(value)}
                    trigger={trigger}
                    storeId={parsedStoreId}
                    disableField={loading}
                    className={errors.warehouseid ? "is-invalid" : ""}
                  />
                )}
              />
              {errors.warehouseid && (
                <div className="invalid-feedback d-block">{errors.warehouseid.message}</div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              className="form-control form-control-sm"
              rows={3}
              placeholder="Optional description for this product line..."
              style={{ resize: "none" }}
              {...register("subcategorydescription")}
            />
          </div>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: "1px solid #f1f5f9", padding: "12px 24px" }}>
          <button
            type="button"
            className="btn btn-cancel me-2"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <ButtonLoader
            btnText={editData ? "Update Product Line" : "Create Product Line"}
            loading={loading}
            disabled={loading}
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SubcategoryModal;
