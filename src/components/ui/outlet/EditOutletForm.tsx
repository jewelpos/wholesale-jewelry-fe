"use client";

import React, { useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SubmitHandler, useForm } from "react-hook-form";
import { handleTryCatch } from "@/lib/utils/errorFormatter";
import { showNotification } from "@/lib/store/slice/notificationSlice";
import { useAppDispatch } from "@/lib/store/hook";
import { NOTIFICATION_TYPES } from "@/lib/config/constants";
import { UPDATE_OUTLET_MUTATION } from "@/lib/graphql/mutations/outlet";
import { GET_OUTLETS_QUERY } from "@/lib/graphql/query/outlet";
import { CreateOutlet } from "@/types/outlet";
import { useParams, useRouter } from "next/navigation";
import ButtonLoader from "../ButtonLoader";
import OutletFormTypeB from "./OutletFormTypeB";
import OutletFormTypeC from "./OutletFormTypeC";
import OutletFormTypeD from "./OutletFormTypeD";
import OutletLogoUpload from "./OutletLogoUpload";
import ActionFooter from "../ActionFooter";
import PlaceHolder from "../PlaceHolder";

const EditOutletForm = () => {
  const { storeId, outletId } = useParams();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const parsedStoreId = parseInt(storeId as string, 10);
  const parsedOutletId = parseInt(outletId as string, 10);

  const [updateOutlet, { loading: saving }] = useMutation(UPDATE_OUTLET_MUTATION);

  const { data: outletsData, loading: loadingOutlet } = useQuery(GET_OUTLETS_QUERY, {
    variables: { storeid: [parsedStoreId] },
    skip: !parsedStoreId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
    trigger,
    reset,
    setValue,
    watch,
  } = useForm<CreateOutlet>();

  useEffect(() => {
    const outlet = outletsData?.getOutlets?.find(
      (o: { outletid: number }) => o.outletid === parsedOutletId
    );
    if (outlet) {
      reset({
        storeid: parsedStoreId,
        outletname: outlet.outletname ?? "",
        address: outlet.address ?? "",
        city: outlet.city ?? "",
        state: outlet.state ?? "",
        zipcode: outlet.zipcode ?? "",
        country: outlet.country ?? "",
        storephone: outlet.storephone ?? "",
        storeemail: outlet.storeemail ?? "",
        contactperson: outlet.contactperson ?? "",
        storelogo: outlet.storelogo ?? "",
      });
    }
  }, [outletsData, parsedOutletId, parsedStoreId, reset]);

  const onSubmit: SubmitHandler<CreateOutlet> = async (formData) => {
    const result = await handleTryCatch(async () => {
      const { data } = await updateOutlet({
        variables: {
          input: {
            outletid: parsedOutletId,
            outletname: formData.outletname,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipcode: formData.zipcode,
            country: formData.country,
            storephone: formData.storephone,
            storeemail: formData.storeemail,
            contactperson: formData.contactperson,
            storelogo: formData.storelogo ?? null,
          },
        },
      });
      if (data?.updateOutlet) {
        dispatch(
          showNotification({
            message: data.updateOutlet.message,
            type: NOTIFICATION_TYPES.SUCCESS,
          })
        );
        router.back();
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
  };

  if (loadingOutlet) return <>{[1, 2, 3].map((i) => <PlaceHolder key={i} />)}</>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <OutletFormTypeB register={register} errors={errors} />

      {/* Store logo */}
      <div className="card table-list-card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-5 mb-3">
              <h4 className="mb-2">Store logo</h4>
              <p>Upload your outlet logo. It will appear on receipts and invoices.</p>
            </div>
            <div className="col-md-7">
              <OutletLogoUpload
                value={watch("storelogo")}
                onChange={(v) => setValue("storelogo", v ?? undefined)}
              />
            </div>
          </div>
        </div>
      </div>

      <OutletFormTypeC register={register} errors={errors} />
      <OutletFormTypeD
        register={register}
        errors={errors}
        control={control}
        selectedCountry={getValues("country")}
        trigger={trigger}
      />
      <ActionFooter handleCancel={() => router.back()}>
        <ButtonLoader
          loading={saving}
          btnText="Save changes"
          loadingText="Saving..."
        />
      </ActionFooter>
    </form>
  );
};

export default EditOutletForm;
