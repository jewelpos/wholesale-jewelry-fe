"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select/base";
import { SelectOption } from "@/types/form";
import useCategory from "@/hooks/useCategory";
import { selectStyles } from "@/lib/styles/selectStyles";

const SelectItemCategory = ({
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
  const { fetchCategoriesByStoreId, categories, loading } = useCategory();

  useEffect(() => {
    if (storeId) {
      fetchCategoriesByStoreId(storeId);
    }
  }, [fetchCategoriesByStoreId, storeId]);

  const categoryOptions: SelectOption[] = useMemo(
    () =>
      categories.map(
        (category: { categoryid: number; categoryname: string }) => ({
          value: category.categoryid,
          label: category.categoryname,
        })
      ),
    [categories]
  );

  return (
    <Select<SelectOption>
      isLoading={loading}
      options={categoryOptions}
      placeholder="Select department"
      isClearable
      isDisabled={disableField}
      className={`form-control p-0 ${className} select-form-custom`}
      value={
        value
          ? {
              value: value,
              label:
                categoryOptions.find((category) => category.value === value)
                  ?.label || "",
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
      styles={selectStyles}
      {...field}
    />
  );
};

export default SelectItemCategory;
