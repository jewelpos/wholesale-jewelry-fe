"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useMutation } from "@apollo/client";
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

  // Set form values when editing
  useEffect(() => {
    if (editData) {
      // Use the editData directly from the grid selection
      setValue("categoryname", editData.categoryname || "");
      setValue("categorydescription", editData.categorydescription || "");
      setValue("categorycode", editData.categorycode || "");
      setValue("warehouseid", editData.warehouseid || 0);
    } else {
      reset();
    }
  }, [editData, setValue, reset]);

  const onSubmit: SubmitHandler<CategoryFormData> = async (formData) => {
    setLoading(true);

    const result = await handleTryCatch(async () => {
      if (editData) {
        // Edit category
        const editInput: EditCategoryInput = {
          categoryid: editData.categoryid,
          categoryname: formData.categoryname,
          categorydescription: formData.categorydescription,
          categorycode: formData.categorycode,
          warehouseid: formData.warehouseid,
          storeid: parsedStoreId,
        };

        const { data } = await editCategory({
          variables: { editCategoryInput: editInput },
        });
        if (data?.editCategory.success) {
          dispatch(
            showNotification({
              message: data.editCategory.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          onSuccess();
          onClose();
        }
        return data.editCategory;
      } else {
        // Add category
        const addInput: AddCategoryInput = {
          categoryname: formData.categoryname,
          categorydescription: formData.categorydescription,
          categorycode: formData.categorycode,
          warehouseid: formData.warehouseid,
          storeid: parsedStoreId,
        };

        const { data } = await addCategory({
          variables: { addCategoryInput: addInput },
        });
        if (data?.addCategory.success) {
          dispatch(
            showNotification({
              message: data.addCategory.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          onSuccess();
          onClose();
        }
        return data.addCategory;
      }
    });

    setLoading(false);

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered custom-modal-two">
        <div className="modal-content">
          <div className="page-wrapper-new p-0">
            <div className="content">
              <div className="modal-header border-0 custom-modal-header">
                <div className="page-title">
                  <h4>{editData ? "Edit Category" : "Create Category"}</h4>
                </div>
                <button
                  type="button"
                  className="close"
                  onClick={handleClose}
                  aria-label="Close"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body custom-modal-body">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label className="form-label">Category Name</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.categoryname ? "is-invalid" : ""
                      }`}
                      {...register("categoryname", {
                        required: "Category name is required",
                      })}
                    />
                    {errors.categoryname && (
                      <div className="invalid-feedback">
                        {errors.categoryname.message}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category Description</label>
                    <textarea
                      className={`form-control ${
                        errors.categorydescription ? "is-invalid" : ""
                      }`}
                      rows={3}
                      {...register("categorydescription")}
                    />
                    {errors.categorydescription && (
                      <div className="invalid-feedback">
                        {errors.categorydescription.message}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category Code</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.categorycode ? "is-invalid" : ""
                      }`}
                      {...register("categorycode")}
                    />
                    {errors.categorycode && (
                      <div className="invalid-feedback">
                        {errors.categorycode.message}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Warehouse</label>
                    <Controller
                      name="warehouseid"
                      control={control}
                      rules={{ required: "Warehouse is required" }}
                      render={({ field }) => (
                        <SelectWarehouse
                          {...field}
                          value={field.value}
                          onChange={(value: number) => {
                            field.onChange(value);
                            setValue("warehouseid", value);
                          }}
                          trigger={trigger}
                          storeId={parsedStoreId}
                          disableField={loading}
                          className={errors.warehouseid ? "is-invalid" : ""}
                        />
                      )}
                    />
                    {errors.warehouseid && (
                      <div className="invalid-feedback">
                        {errors.warehouseid.message}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer-btn">
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
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
