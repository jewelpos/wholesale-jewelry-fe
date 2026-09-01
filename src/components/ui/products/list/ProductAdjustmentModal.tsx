import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useAppDispatch } from "@/lib/store/hook";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useParams } from "next/navigation";
import { ADJUST_PRODUCT_MUTATION } from "@/lib/graphql/mutations/products";
import { AdjustProductInput } from "@/types/product";
import { ProductListType } from "@/types/product";
import SelectWarehouse from "@/components/forms/SelectWarehouse";
import SelectProduct from "@/components/forms/SelectProduct";
import { ItemDetails } from "@/hooks/useProducts";
import ButtonLoader from "@/components/ui/ButtonLoader";

interface ProductAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated?: { itemid: number; itemquantityinhand: number }) => void;
  // Row-action flow: product already known. Omitted for the list-level "New
  // Adjustment" flow, which shows a warehouse + product picker instead.
  productData?: ProductListType | null;
}

interface AdjustmentFormData {
  productid?: number;
  warehouseid: number;
  newquantity: number;
  newcost: number;
  updateremarks: string;
}

const ProductAdjustmentModal: React.FC<ProductAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productData,
}) => {
  const dispatch = useAppDispatch();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const [loading, setLoading] = useState(false);
  // Mirrors the "Adjusted Quantity" input's raw text so an in-progress "-" (before any
  // digits follow it) isn't clobbered by react-hook-form's numeric value on re-render.
  const [adjustQtyText, setAdjustQtyText] = useState("0");
  // Only used in the list-level "New Adjustment" flow (no productData prop) — holds
  // whichever product the user picks so the same display/quantity-math code below can
  // read from it just like it reads from productData in the row-action flow.
  const [pickedProduct, setPickedProduct] = useState<ItemDetails | null>(null);
  const isNewMode = !productData;
  const effectiveProduct = productData ?? pickedProduct;

  const [adjustProduct] = useMutation(ADJUST_PRODUCT_MUTATION);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm<AdjustmentFormData>({
    defaultValues: {
      productid: undefined,
      warehouseid: 0,
      newquantity: 0,
      newcost: 0,
      updateremarks: "",
    },
  });

  const pickedWarehouseId = watch("warehouseid");

  useEffect(() => {
    if (isOpen && productData) {
      // Pre-fill form with product data
      setValue("warehouseid", productData.itemwarehouseid || 0);
      setAdjustQtyText("0");
    } else if (isOpen) {
      // Reset form for new adjustment
      reset({
        productid: undefined,
        newquantity: 0,
        warehouseid: 0,
      });
      setPickedProduct(null);
      setAdjustQtyText("0");
    }
  }, [isOpen, productData, setValue, reset]);

  const onSubmit = async (data: AdjustmentFormData) => {
    const itemid = productData?.itemid ?? data.productid;
    if (!itemid) {
      dispatch(
        showNotification({ message: "Product is required", type: NOTIFICATION_TYPES.ERROR })
      );
      return;
    }
    if (!data.warehouseid) {
      dispatch(
        showNotification({ message: "Warehouse is required", type: NOTIFICATION_TYPES.ERROR })
      );
      return;
    }

    setLoading(true);

    const result = await handleTryCatch(async () => {
      const adjustInput: AdjustProductInput = {
        storeid: parsedStoreId,
        warehouseid: data.warehouseid,
        productid: itemid,
        updateremarks: data.updateremarks,
      };
      if (data.newquantity !== 0) {
        // Backend expects the absolute resulting quantity, not the typed delta —
        // the form's "Adjusted Quantity" field is a +/- delta on top of current stock.
        adjustInput.newquantity =
          (effectiveProduct?.itemquantityinhand || 0) + data.newquantity;
      }
      if (data.newcost !== 0) {
        adjustInput.newcost = data.newcost;
      }

      const { data: responseData } = await adjustProduct({
        variables: { adjustProductInput: adjustInput },
      });

      if (responseData?.adjustProduct.success) {
        dispatch(
          showNotification({
            message: responseData.adjustProduct.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
        // Echo the already-known resulting quantity straight into the grid row instead
        // of refetching the whole list — same instant-update feel as Gmail's read/star toggles.
        onSuccess(
          typeof adjustInput.productid === "number"
            ? {
                itemid: adjustInput.productid,
                itemquantityinhand:
                  adjustInput.newquantity ?? effectiveProduct?.itemquantityinhand ?? 0,
              }
            : undefined
        );
        onClose();
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
    setPickedProduct(null);
    onClose();
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isNewMode ? "New Adjustment" : `Adjust Product - ${effectiveProduct?.itemdescription || "Product"}`}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {isNewMode && (
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Warehouse</Form.Label>
                  <Controller
                    name="warehouseid"
                    control={control}
                    rules={{ validate: (v) => v !== 0 || "Warehouse is required" }}
                    render={({ field }) => (
                      <SelectWarehouse
                        {...field}
                        onChange={(value: number) => {
                          field.onChange(value);
                          // Changing warehouse invalidates whatever product was picked
                          // for the previous one — its stock qty won't be right here.
                          setValue("productid", undefined);
                          setPickedProduct(null);
                        }}
                        trigger={trigger}
                        storeId={parsedStoreId}
                        className={errors.warehouseid ? "is-invalid" : ""}
                      />
                    )}
                  />
                  {errors.warehouseid && (
                    <div className="invalid-feedback d-block">{errors.warehouseid.message}</div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Product</Form.Label>
                  <Controller
                    name="productid"
                    control={control}
                    rules={{ required: "Product is required" }}
                    render={({ field }) => (
                      <SelectProduct
                        {...field}
                        onChange={(value: number) => field.onChange(value)}
                        onChangeAdditional={(selected: ItemDetails | null) => setPickedProduct(selected)}
                        trigger={trigger}
                        storeId={parsedStoreId}
                        hasWarehouseId
                        warehouseId={pickedWarehouseId}
                        disableField={!pickedWarehouseId}
                        className={errors.productid ? "is-invalid" : ""}
                      />
                    )}
                  />
                  {errors.productid && (
                    <div className="invalid-feedback d-block">{errors.productid.message}</div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          )}

          {effectiveProduct && (
            <div className="mb-3 p-3 bg-light rounded text-primary">
              <Row>
                <Col md={6}>
                  <strong>Product Code:</strong> {effectiveProduct.itemcode}
                </Col>
                <Col md={6}>
                  <strong>Current Quantity:</strong>{" "}
                  {effectiveProduct.itemquantityinhand}
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <strong>Current Cost:</strong> ${effectiveProduct.itemsellprice}
                </Col>
                {productData && (
                  <Col md={6}>
                    <strong>Current Warehouse:</strong>{" "}
                    {productData.warehousename}
                  </Col>
                )}
              </Row>
            </div>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Adjusted Quantity</Form.Label>
                <Controller
                  name="newquantity"
                  control={control}
                  rules={{
                    validate: (value) => {
                      const newcost = getValues("newcost");
                      if (!value && !newcost) {
                        return "Either adjusted quantity or new cost is required";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <Form.Control
                      name={field.name}
                      ref={field.ref}
                      // type="text" (not "number") — a native number input reports an
                      // empty value for an in-progress "-", so parsing it immediately
                      // snapped the field back to 0 and the minus sign could never be typed.
                      type="text"
                      inputMode="decimal"
                      step="1"
                      placeholder="Enter adjusted quantity (+/-)"
                      isInvalid={!!errors.newquantity}
                      value={adjustQtyText}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw !== "" && raw !== "-" && !/^-?\d*\.?\d*$/.test(raw)) {
                          return;
                        }
                        setAdjustQtyText(raw);
                        const parsed = parseFloat(raw);
                        field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                        trigger(["newquantity", "newcost"]);
                      }}
                      onBlur={() => {
                        field.onBlur();
                        setAdjustQtyText(String(field.value || 0));
                      }}
                    />
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.newquantity?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>New Quantity</Form.Label>
                <Form.Control
                  type="text"
                  disabled
                  value={
                    (effectiveProduct?.itemquantityinhand || 0) +
                    (getValues("newquantity") || 0)
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>New Cost</Form.Label>
                <Controller
                  name="newcost"
                  control={control}
                  rules={{
                    validate: (value) => {
                      const newquantity = getValues("newquantity");
                      if (!value && !newquantity) {
                        return "Either new cost or adjusted quantity is required";
                      }
                      return true;
                    },
                    min: { value: 0, message: "Cost must be 0 or greater" },
                  }}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="number"
                      step="1"
                      placeholder="Enter new cost"
                      isInvalid={!!errors.newcost}
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value) || 0);
                        trigger(["newquantity", "newcost"]);
                      }}
                    />
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.newcost?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Update Remarks</Form.Label>
                <Controller
                  name="updateremarks"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      as="textarea"
                      rows={3}
                      placeholder="Enter reason for adjustment"
                    />
                  )}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <ButtonLoader
            btnText="Adjust Product"
            loading={loading}
            disabled={loading}
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProductAdjustmentModal;
