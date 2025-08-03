"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useCategory from "@/hooks/useCategory";

const SelectSubCategory = ({
  value,
  onChange,
  className,
  trigger,
  storeId,
  disableField,
  onChangeAdditional,
  ...field
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fetchSubCategoriesByStoreId, subCategories, loading } = useCategory();

  useEffect(() => {
    if (storeId) {
      fetchSubCategoriesByStoreId(storeId);
    }
  }, [fetchSubCategoriesByStoreId, storeId]);

  const subCategoryOptions: SelectOption[] = useMemo(
    () =>
      subCategories.map(
        (subCategory: { subcategoryid: number; subcategoryname: string }) => ({
          value: subCategory.subcategoryid,
          label: subCategory.subcategoryname,
        })
      ),
    [subCategories]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={subCategoryOptions}
      placeholder="Select product line"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                subCategoryOptions.find(
                  (subCategory) => subCategory.value === value
                )?.label || "",
            }
          : null
      }
      onChange={(option) => {
        if (onChangeAdditional) onChangeAdditional(option?.value);
        else {
          onChange(option?.value);
          trigger(field.name);
        }
      }}
      menuIsOpen={menuIsOpen}
      onMenuOpen={() => setMenuIsOpen(true)}
      onMenuClose={() => setMenuIsOpen(false)}
      inputValue={input}
      onInputChange={setInput}
      {...field}
    />
  );
};

export default SelectSubCategory;
