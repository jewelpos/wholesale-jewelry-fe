"use client";

import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useLazyQuery, useQuery } from "@apollo/client";
import ActionFooter from "../../ActionFooter";
import ButtonLoader from "../../ButtonLoader";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { ProductFormType } from "@/types/product";
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

  const [productImages, setProductImages] = useState<File[]>([]);
  const [loading] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [getProductByItemCode] = useLazyQuery(GET_PRODUCT_BY_ITEMCODE_QUERY);
  const [saveLoading, setSaveLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
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
      itemtagprice: 0,
      itemtagpricecode: "",
      itemdiscount: 0,
      supplieritemcode: "",
      supplierbarcodeid: "",
      modelno: "",
      manufacturer: "",
      itemlocation: "",
      itemtaxable: 0,
      trackinventory: 0,
      itemmetal: "",
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

  const watchedValues = watch(["itempurchaseprice", "profitpercent"]);
  const [itempurchaseprice, profitpercent] = watchedValues;
  const marginAmount =
    itempurchaseprice && profitpercent
      ? Number(itempurchaseprice) * (Number(profitpercent) / 100)
      : 0;

  const { data: productSettingsData } = useQuery(GET_PRODUCT_SETTINGS_INFO_QUERY, {
    variables: { storeid: parsedStoreId, warehouiseid: 0 },
    skip: !parsedStoreId,
  });
  const productSettings = productSettingsData?.getProductSettingsInfo?.[0] ?? null;

  useEffect(() => {
    if (productSettings?.saletagkey && itempurchaseprice && !isEdit) {
      const pct = (itempurchaseprice / 100) * profitpercent;
      setValue("itemtagprice", Number(((itempurchaseprice + pct) * productSettings.saletagkey).toFixed(2)));
    }
  }, [itempurchaseprice, profitpercent, productSettings, setValue, isEdit]);

  const onSubmit: SubmitHandler<ProductFormType> = async (formData) => {
    setSaveLoading(true);

    let updatedParams = {};
    if (productImages?.length > 0) updatedParams = { ...updatedParams, itemimagepath: productImages };
    if (itemcode && productData) updatedParams = { ...updatedParams, itemid: productData.itemid };

    const { itemimagepath, ...rest } = formData;
    const payload = {
      ...rest,
      itemtaxable: formData.itemtaxable ? 1 : 0,
      trackinventory: formData.trackinventory ? 1 : 0,
      itemalertwarning: formData.itemalertwarning ? 1 : 0,
      supplierid: Number(formData.supplierid),
      itemcategoryid: Number(formData.itemcategoryid),
      subcategoryid: formData.subcategoryid ? Number(formData.subcategoryid) : null,
      itempurchaseprice: Number(formData.itempurchaseprice),
      itemtagprice: formData.itemtagprice ? Number(formData.itemtagprice) : null,
      itemdiscount: formData.itemdiscount ? Number(formData.itemdiscount) : null,
      profitpercent: formData.profitpercent ? Number(formData.profitpercent) : null,
      itemreorderqtypnt: formData.itemreorderqtypnt ? Number(formData.itemreorderqtypnt) : null,
      itemreorderqty: formData.itemreorderqtypnt ? Number(formData.itemreorderqtypnt) : null,
      dcarat: formData.dcarat ? Number(formData.dcarat) : null,
      ddiameter: formData.ddiameter || null,
      ddepth: formData.ddepth ? Number(formData.ddepth) : null,
      dtable: formData.dtable ? Number(formData.dtable) : null,
      dcrownheight: formData.dcrownheight ? Number(formData.dcrownheight) : null,
      dcrownangle: formData.dcrownangle ? Number(formData.dcrownangle) : null,
      dpavillionheight: formData.dpavillionheight ? Number(formData.dpavillionheight) : null,
      dpavillionangle: formData.dpavillionangle ? Number(formData.dpavillionangle) : null,
      drapprice: formData.drapprice ? Number(formData.drapprice) : null,
      dcost: formData.dcost ? Number(formData.dcost) : null,
      dsaleprice: formData.dsaleprice ? Number(formData.dsaleprice) : null,
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

    const form = new FormData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(payload).forEach(([key, value]: [string, any]) => {
      if (key !== "itemimagepath") form.append(key, value);
    });
    if (productImages?.length > 0) form.append("itemimagepath", productImages[0]);

    const result = await handleTryCatch(async () => {
      const response = itemcode && productData
        ? await api.put(`${config.apiUrl}/store/product/edit`, form)
        : await api.post(`${config.apiUrl}/store/product/add`, form);
      const { data } = response;
      if (data) {
        dispatch(showNotification({ message: data.message, type: NOTIFICATION_TYPES.SUCCESS }));
        router.back();
      }
      return true;
    });

    setSaveLoading(false);
    if (result.error) {
      dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
    } else {
      reset();
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!itemcode) return;
      const result = await handleTryCatch(async () => {
        const { data } = await getProductByItemCode({
          variables: { itemcode: itemcode as string, storeid: parsedStoreId },
        });
        if (data?.getProductByItemCode) {
          const product = data.getProductByItemCode;
          setProductData(product);
          if (product.itemimagepath) {
            try {
              let imageUrls: string[] = [];
              if (typeof product.itemimagepath === "string") {
                try { imageUrls = JSON.parse(product.itemimagepath); } catch { imageUrls = [product.itemimagepath]; }
              } else if (Array.isArray(product.itemimagepath)) {
                imageUrls = product.itemimagepath;
              }
              if (imageUrls.length > 0) {
                const files = await Promise.all(
                  imageUrls.slice(0, 1).map(async (url: string) => {
                    try {
                      const res = await fetch(url);
                      const blob = await res.blob();
                      return new File([blob], "product-image.jpg", { type: blob.type });
                    } catch { return null; }
                  })
                );
                setProductImages(files.filter(Boolean) as File[]);
              }
            } catch { /* ignore image load errors */ }
          }
          reset({ ...product, storeid: parsedStoreId, supplierid: Number(product.supplierid) });
        }
        return true;
      });
      if (result.error) {
        dispatch(showNotification({ message: result.error, type: NOTIFICATION_TYPES.ERROR }));
      }
    };
    fetchProduct();
  }, [itemcode, parsedStoreId, getProductByItemCode, reset, dispatch]);

  if (loading) return <>{[1, 2, 3, 4, 5].map(i => <PlaceHolder key={i} />)}</>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={disableField}>
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
          marginAmount={marginAmount}
        />
        <ProductStoneDetailsTab
          register={register}
          errors={errors}
          control={control}
          trigger={trigger}
          setValue={setValue}
          disableField={disableField}
        />
        {!disableField && (
          <ActionFooter handleCancel={handleCancel}>
            <ButtonLoader loading={saveLoading} btnText="Save Product" loadingText="Saving..." />
          </ActionFooter>
        )}
      </fieldset>
    </form>
  );
};

export default ProductForm;
