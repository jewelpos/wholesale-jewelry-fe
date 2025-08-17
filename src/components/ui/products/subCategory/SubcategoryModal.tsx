import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
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

  const [addSubcategory] = useMutation(ADD_SUBCATEGORY_MUTATION);
  const [editSubcategory] = useMutation(EDIT_SUBCATEGORY_MUTATION);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    trigger,
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
    if (isOpen) {
      if (editData) {
        // Pre-fill form with edit data
        setValue("subcategoryname", editData.subcategoryname);
        setValue("subcategorydescription", editData.subcategorydescription);
        setValue("categoryid", editData.categoryid);
        setValue("warehouseid", editData.warehouseid);
      } else {
        // Reset form for new subcategory
        reset({
          subcategoryname: "",
          subcategorydescription: "",
          categoryid: 0,
          warehouseid: 0,
        });
      }
    }
  }, [isOpen, editData, setValue, reset]);

  const onSubmit = async (data: SubcategoryFormData) => {
    setLoading(true);

    const result = await handleTryCatch(async () => {
      if (editData) {
        // Edit existing subcategory
        const editInput: EditSubcategoryInput = {
          subcategoryid: editData.subcategoryid,
          subcategoryname: data.subcategoryname,
          subcategorydescription: data.subcategorydescription,
          categoryid: data.categoryid,
          warehouseid: data.warehouseid,
          storeid: parsedStoreId,
        };

        const { data: responseData } = await editSubcategory({
          variables: { editSubcategoryInput: editInput },
        });

        if (responseData?.editSubcategory.success) {
          dispatch(
            showNotification({
              message: responseData.editSubcategory.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          onSuccess();
          onClose();
        }
      } else {
        // Add new subcategory
        const addInput: AddSubcategoryInput = {
          subcategoryname: data.subcategoryname,
          subcategorydescription: data.subcategorydescription,
          categoryid: data.categoryid,
          warehouseid: data.warehouseid,
          storeid: parsedStoreId,
        };

        const { data: responseData } = await addSubcategory({
          variables: { addSubcategoryInput: addInput },
        });

        if (responseData?.addSubcategory.success) {
          dispatch(
            showNotification({
              message: responseData.addSubcategory.message,
              type: NOTIFICATION_TYPES.SUCCESS,
            })
          );
          onSuccess();
          onClose();
        }
      }
      return true;
    });

    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    }

    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {editData ? "Edit Subcategory" : "Add New Subcategory"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Subcategory Name <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="subcategoryname"
                  control={control}
                  rules={{ required: "Subcategory name is required" }}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Enter subcategory name"
                      isInvalid={!!errors.subcategoryname}
                    />
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.subcategoryname?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Controller
                  name="subcategorydescription"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Enter description"
                    />
                  )}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Category <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="categoryid"
                  control={control}
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <SelectItemCategory
                      {...field}
                      value={field.value}
                      onChange={(value: number) => {
                        field.onChange(value);
                        setValue("categoryid", value);
                      }}
                      trigger={trigger}
                      storeId={parsedStoreId}
                      className={errors.categoryid ? "is-invalid" : ""}
                    />
                  )}
                />
                {errors.categoryid && (
                  <div className="invalid-feedback d-block">
                    {errors.categoryid.message}
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Warehouse <span className="text-danger">*</span>
                </Form.Label>
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
                      className={errors.warehouseid ? "is-invalid" : ""}
                    />
                  )}
                />
                {errors.warehouseid && (
                  <div className="invalid-feedback d-block">
                    {errors.warehouseid.message}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <ButtonLoader
            btnText={editData ? "Update Subcategory" : "Add Subcategory"}
            loading={loading}
            disabled={loading}
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SubcategoryModal;
