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
import { ProductFormType, ProductSettingsInfo } from "@/types/product";
import api from "@/lib/axios";
import { getEnvironmentConfig } from "@/lib/config/environment";
import {
  GET_PRODUCT_BY_ITEMCODE_QUERY,
  GET_PRODUCT_SETTINGS_INFO_QUERY,
} from "@/lib/graphql/query/products";
import ProductInformationTab from "./ProductInformationTab";
import ProductStoneDetailsTab from "./ProductStoneDetailsTab";
import PlaceHolder from "../../PlaceHolder";

const ProductForm = ({ disableField }: { disableField?: boolean }) => {
  const { itemcode } = useParams();
  const config = getEnvironmentConfig();
  const dispatch = useDispatch();
  const router = useRouter();
  const { storeId: storeIdParam } = useParams();
  const parsedStoreId = parseInt(storeIdParam as string, 10);
  const isEdit = !!itemcode;

  const [activeTab, setActiveTab] = useState("information");
  const [productImages, setProductImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [productSettings, setProductSettings] =
    useState<ProductSettingsInfo | null>(null);
  const [getProductByItemCode] = useLazyQuery(GET_PRODUCT_BY_ITEMCODE_QUERY);
  const [getProductSettingsInfo] = useLazyQuery(
    GET_PRODUCT_SETTINGS_INFO_QUERY
  );
  const [saveLoading, setSaveLoading] = useState(false);

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
      itemcategoryid: 0,
      subcategoryid: 0,
      itemstatus: "Active",
      itemimagepath: "",
      itempurchaseprice: 0,
      profitpercent: 0,
      itemremarks: "",
      itemalertwarning: 0,
      itemwarningmessage: "",
      detaileditemdescription: "",
      itemreorderqtypnt: 0,
      itemreorderqty: 0,
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

  // Watch for changes in purchase price and profit percent to calculate tag price
  const watchedValues = watch([
    "itempurchaseprice",
    "profitpercent",
    "itemtagprice",
  ]);
  const [itempurchaseprice, profitpercent, itemtagprice] = watchedValues;

  // Fetch product settings on component mount
  useEffect(() => {
    const fetchProductSettings = async () => {
      try {
        const { data } = await getProductSettingsInfo({
          variables: {
            storeid: parsedStoreId,
            warehouiseid: 1, // Default warehouse ID - you may need to get this from context
          },
        });

        if (data?.getProductSettingsInfo?.[0]) {
          setProductSettings(data.getProductSettingsInfo[0]);
        }
      } catch (error) {
        console.error("Error fetching product settings:", error);
      }
    };

    if (parsedStoreId) {
      fetchProductSettings();
    }
  }, [parsedStoreId, getProductSettingsInfo]);

  // Auto-calculate itemtagprice when purchase price, profit percent, or settings change
  useEffect(() => {
    if (
      productSettings?.saletagkey &&
      itempurchaseprice &&
        
      !isEdit // Only auto-calculate for new products, not when editing
    ) {
      const percentageValue = (itempurchaseprice / 100) * profitpercent;
      const profitpercentValue = itempurchaseprice + percentageValue;
      const calculatedTagPrice =
        profitpercentValue * productSettings.saletagkey;
      setValue("itemtagprice", Number(calculatedTagPrice.toFixed(2)));
    }
  }, [itempurchaseprice, profitpercent, productSettings, setValue, isEdit]);

  const onSubmit: SubmitHandler<ProductFormType> = async (formData) => {
    setSaveLoading(true);

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
      profitpercent: formData.profitpercent
        ? Number(formData.profitpercent)
        : null,
      itemreorderqtypnt: formData.itemreorderqtypnt
        ? Number(formData.itemreorderqtypnt)
        : null,
      itemreorderqty: formData.itemreorderqtypnt
        ? Number(formData.itemreorderqtypnt)
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

    setSaveLoading(false);
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
                    barcodeId={productData?.itembarcodeid}
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
              loading={saveLoading}
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
