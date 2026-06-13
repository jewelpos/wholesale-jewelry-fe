"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { Modal, Form } from "react-bootstrap";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import {
  ADD_CATEGORY_MUTATION,
  EDIT_CATEGORY_MUTATION,
} from "@/lib/graphql/mutations/products";
import { Category, AddCategoryInput, EditCategoryInput } from "@/types/product";
import ButtonLoader from "../../ButtonLoader";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import useWarehouse from "@/hooks/useWarehouse";
import { Layers, type LucideIcon } from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Category | null;
}

interface CategoryFormData {
  categoryname: string;
  categorydescription: string;
  categorycode: string;
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

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
}) => {
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { fetchWarehouseByStoreId, warehouses } = useWarehouse();

  const [addCategory] = useMutation(ADD_CATEGORY_MUTATION);
  const [editCategory] = useMutation(EDIT_CATEGORY_MUTATION);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
    trigger,
  } = useForm<CategoryFormData>({
    defaultValues: {
      categoryname: "",
      categorydescription: "",
      categorycode: "",
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
      setValue("categoryname", editData.categoryname || "");
      setValue("categorydescription", editData.categorydescription || "");
      setValue("categorycode", editData.categorycode || "");
      setValue("warehouseid", editData.warehouseid || 0);
    } else {
      const systemWh = warehouses.find(w => w.issystem);
      reset({ categoryname: "", categorydescription: "", categorycode: "", warehouseid: systemWh?.warehouseid || 0 });
    }
  }, [isOpen, editData, warehouses, setValue, reset]);

  const onSubmit: SubmitHandler<CategoryFormData> = async (formData) => {
    setLoading(true);

    const result = await handleTryCatch(async () => {
      if (editData) {
        const editInput: EditCategoryInput = {
          categoryid: editData.categoryid,
          categoryname: formData.categoryname,
          categorydescription: formData.categorydescription,
          categorycode: formData.categorycode,
          warehouseid: formData.warehouseid,
          storeid: parsedStoreId,
        };
        const { data } = await editCategory({ variables: { editCategoryInput: editInput } });
        if (data?.editCategory.success) {
          dispatch(showNotification({ message: data.editCategory.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onSuccess();
          onClose();
        }
        return data.editCategory;
      } else {
        const addInput: AddCategoryInput = {
          categoryname: formData.categoryname,
          categorydescription: formData.categorydescription,
          categorycode: formData.categorycode,
          warehouseid: formData.warehouseid,
          storeid: parsedStoreId,
        };
        const { data } = await addCategory({ variables: { addCategoryInput: addInput } });
        if (data?.addCategory.success) {
          dispatch(showNotification({ message: data.addCategory.message, type: NOTIFICATION_TYPES.SUCCESS }));
          onSuccess();
          onClose();
        }
        return data.addCategory;
      }
    });

    setLoading(false);

    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal show={isOpen} onHide={handleClose} centered>
      <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 24px" }}>
        <Modal.Title style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
          {editData ? "Edit Category" : "Create Category"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body style={{ padding: "20px 24px 8px" }}>
          <SectionLabel label="Category Details" icon={Layers} />

          {/* Name */}
          <div className="mb-3">
            <FieldLabel required>Category Name</FieldLabel>
            <input
              type="text"
              className={`form-control form-control-sm ${errors.categoryname ? "is-invalid" : ""}`}
              placeholder="e.g. Rings, Necklaces, Bracelets"
              {...register("categoryname", { required: "Category name is required" })}
            />
            {errors.categoryname && (
              <div className="invalid-feedback">{errors.categoryname.message}</div>
            )}
          </div>

          {/* Description */}
          <div className="mb-3">
            <FieldLabel>Description</FieldLabel>
            <textarea
              className="form-control form-control-sm"
              rows={3}
              placeholder="Optional description for this category..."
              style={{ resize: "none" }}
              {...register("categorydescription")}
            />
          </div>

          {/* Warehouse */}
          <div className="mb-2">
            <FieldLabel required>Warehouse</FieldLabel>
            <Controller
              name="warehouseid"
              control={control}
              rules={{ required: "Warehouse is required" }}
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
            loading={loading}
            btnText={editData ? "Update Category" : "Create Category"}
            loadingText={editData ? "Updating..." : "Creating..."}
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CategoryModal;
