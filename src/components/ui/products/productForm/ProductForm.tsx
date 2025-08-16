"use client";

import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useLazyQuery } from "@apollo/client";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { ProductFormType } from "@/types/product";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import { GET_PRODUCT_BY_ITEMCODE_QUERY } from "@/lib/graphql/query/products";
import ProductInformationTab from "./ProductInformationTab";
import ProductStoneDetailsTab from "./ProductStoneDetailsTab";
import PlaceHolder from "../../PlaceHolder";

const ProductForm = ({ disableField }: { disableField?: boolean }) => {
  const { itemcode } = useParams();
  const config = getEnvironmentConfig();
  const dispatch = useDispatch();
  const router = useRouter();
  const { storeId: storeIdParam, outletId: outletIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const isEdit = !!itemcode;

  const [activeTab, setActiveTab] = useState("information");
  const [productImages, setProductImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [getProductByItemCode] = useLazyQuery(GET_PRODUCT_BY_ITEMCODE_QUERY);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    getValues,
    trigger,
    reset,
    setValue,
    watch,
  } = useForm<ProductFormType>({
    defaultValues: {
      itemcode: "",
      itemdescription: "",
      itemwarehouseid: 0,
      supplierid: 0,
      supplieritemcode: "",
      supplierbarcodeid: "",
      itemcategoryid: 0,
      subcategoryid: 0,
      itemstatus: "Active",
      itemtaxable: 1,
      trackinventory: 1,
      itemimagepath: "",
      itemlocation: "",
      itempurchaseprice: 0,
      itemtagpricecode: "",
      itemtagprice: 0,
      itemdiscount: 0,
      itemmetal: "",
      itemremarks: "",
      itemalertwarning: 0,
      itemwarningmessage: "",
      detaileditemdescription: "",
      tag1: "",
      tag2: "",
      tag3: "",
      tag4: "",
      tag5: "",
      tag6: "",
      tag7: "",
      tag8: "",
      tag9: "",
      tag10: "",
      dshape: "",
      dlab: "",
      dcerno: "",
      dcarat: 0,
      ddiameter: "",
      dcolor: "",
      dclarity: "",
      dflorence: "",
      dpolarity: "",
      ddepth: "",
      dtable: "",
      dgirdle: "",
      dculut: "",
      dpolish: "",
      dsymmetry: "",
      dcrownheight: "",
      dcrownangle: "",
      dpavillionheight: "",
      dpavillionangle: "",
      dmesurement: "",
      dsize: "",
      dquality: "",
      dstockno: "",
      drapprice: 0,
      dcost: 0,
      dsaleprice: 0,
      dpricecode: "",
      storeid: parsedStoreId,
    },
  });

  const { handleCancel } = useUnsavedChanges({
    isDirty,
    onCancel: () => {
      reset();
      router.back();
    },
  });

  const onSubmit: SubmitHandler<ProductFormType> = async (formData) => {
    setLoading(true);

    // Prepare file upload parameters
    let updatedParams = {};
    if (productImages && productImages.length > 0) {
      updatedParams = {
        ...updatedParams,
        itemimagepath: productImages,
      };
    }
    if (itemcode && productData) {
      updatedParams = {
        ...updatedParams,
        itemid: productData.itemid,
      };
    }

    // Extract files and prepare payload
    const { itemimagepath, ...rest } = formData;
    const payload = {
      ...rest,
      // Convert boolean fields to numbers
      itemtaxable: formData.itemtaxable ? 1 : 0,
      trackinventory: formData.trackinventory ? 1 : 0,
      itemalertwarning: formData.itemalertwarning ? 1 : 0,

      // Convert string IDs to numbers
      supplierid: Number(formData.supplierid),
      itemcategoryid: Number(formData.itemcategoryid),
      subcategoryid: formData.subcategoryid
        ? Number(formData.subcategoryid)
        : null,

      // Convert price fields to numbers
      itempurchaseprice: Number(formData.itempurchaseprice),
      itemtagprice: formData.itemtagprice
        ? Number(formData.itemtagprice)
        : null,
      itemdiscount: formData.itemdiscount
        ? Number(formData.itemdiscount)
        : null,

      // Stone detail numeric fields - convert to numbers or null
      dcarat: formData.dcarat ? Number(formData.dcarat) : null,
      ddiameter: formData.ddiameter || null,
      ddepth: formData.ddepth ? Number(formData.ddepth) : null,
      dtable: formData.dtable ? Number(formData.dtable) : null,
      dcrownheight: formData.dcrownheight
        ? Number(formData.dcrownheight)
        : null,
      dcrownangle: formData.dcrownangle ? Number(formData.dcrownangle) : null,
      dpavillionheight: formData.dpavillionheight
        ? Number(formData.dpavillionheight)
        : null,
      dpavillionangle: formData.dpavillionangle
        ? Number(formData.dpavillionangle)
        : null,
      drapprice: formData.drapprice ? Number(formData.drapprice) : null,
      dcost: formData.dcost ? Number(formData.dcost) : null,
      dsaleprice: formData.dsaleprice ? Number(formData.dsaleprice) : null,

      // Stone detail text fields - convert empty strings to null
      dshape: formData.dshape || null,
      dlab: formData.dlab || null,
      dcerno: formData.dcerno || null,
      dcolor: formData.dcolor || null,
      dclarity: formData.dclarity || null,
      dflorence: formData.dflorence || null,
      dpolarity: formData.dpolarity || null,
      dgirdle: formData.dgirdle || null,
      dculut: formData.dculut || null,
      dpolish: formData.dpolish || null,
      dsymmetry: formData.dsymmetry || null,
      dmesurement: formData.dmesurement || null,
      dsize: formData.dsize || null,
      dquality: formData.dquality || null,
      dstockno: formData.dstockno || null,
      dpricecode: formData.dpricecode || null,

      ...updatedParams,
    };

    // Create FormData for file upload
    const form = new FormData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(payload).forEach(([key, value]: [string, any]) => {
      if (key !== "itemimagepath") {
        form.append(key, value);
      }
    });

    // Append image file (single image only)
    if (productImages && productImages.length > 0) {
      // Only append the first image since we limit to 1
      form.append(`itemimagepath`, productImages[0]);
    }

    const result = await handleTryCatch(async () => {
      let response;
      if (itemcode && productData) {
        response = await api.put(`${config.apiUrl}/store/product/edit`, form);
      } else {
        response = await api.post(`${config.apiUrl}/store/product/add`, form);
      }

      const { data } = response;
      if (data) {
        dispatch(
          showNotification({
            message: data.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
        router.back();
      }
      return true;
    });

    setLoading(false);
    if (result.error) {
      dispatch(
        showNotification({
          message: result.error,
          type: NOTIFICATION_TYPES.ERROR,
        })
      );
    } else {
      reset();
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (itemcode) {
        const result = await handleTryCatch(async () => {
          const { data } = await getProductByItemCode({
            variables: {
              itemcode: itemcode as string,
              storeid: parsedStoreId,
            },
          });

          if (data?.getProductByItemCode) {
            const product = data.getProductByItemCode;
            setProductData(product);

            // Load existing images if available
            if (product.itemimagepath) {
              try {
                let imageUrls = [];
                if (typeof product.itemimagepath === "string") {
                  try {
                    imageUrls = JSON.parse(product.itemimagepath);
                  } catch {
                    imageUrls = [product.itemimagepath];
                  }
                } else if (Array.isArray(product.itemimagepath)) {
                  imageUrls = product.itemimagepath;
                }

                if (imageUrls.length > 0) {
                  const imageFiles = await Promise.all(
                    imageUrls.slice(0, 1).map(async (url: string) => {
                      try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        return new File([blob], `product-image.jpg`, {
                          type: blob.type,
                        });
                      } catch (error) {
                        console.error("Error loading image:", error);
                        return null;
                      }
                    })
                  );
                  const validFiles = imageFiles.filter(Boolean) as File[];
                  setProductImages(validFiles);
                }
              } catch (error) {
                console.error("Error processing images:", error);
              }
            }

            // Reset form with product data
            reset({
              ...product,
              storeid: parsedStoreId,
              supplierid: Number(product.supplierid),
            });
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
      }
    };
    fetchProduct();
  }, [itemcode, parsedStoreId, getProductByItemCode, reset, dispatch]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={disableField}>
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${
                    activeTab === "information" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("information")}
                >
                  Information
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${
                    activeTab === "stone-details" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("stone-details")}
                >
                  Stone Details
                </button>
              </li>
            </ul>
          </div>
          <div className="card-body">
            {loading ? (
              [1, 2, 3, 4, 5, 6, 7].map((item) => <PlaceHolder key={item} />)
            ) : (
              <div className="tab-content">
                <div className={activeTab === "information" ? "" : "d-none"}>
                  <ProductInformationTab
                    register={register}
                    errors={errors}
                    control={control}
                    trigger={trigger}
                    setValue={setValue}
                    disableField={disableField}
                    storeId={parsedStoreId}
                    productImages={productImages}
                    onImagesChange={setProductImages}
                    isEdit={isEdit}
                  />
                </div>
                <div className={activeTab === "stone-details" ? "" : "d-none"}>
                  <ProductStoneDetailsTab
                    register={register}
                    errors={errors}
                    control={control}
                    trigger={trigger}
                    setValue={setValue}
                    disableField={disableField}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {!disableField && !loading && (
          <ActionFooter handleCancel={handleCancel}>
            <ButtonLoader
              loading={loading}
              btnText="Save"
              loadingText="Saving ..."
            />
          </ActionFooter>
        )}
      </fieldset>
    </form>
  );
};

export default ProductForm;
