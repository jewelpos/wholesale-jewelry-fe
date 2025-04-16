export const filterVariables = (
  params: any,
  debouncedSearch?: string,
  key?: string
) => {
  const {
    startRow,
    endRow,
    filterModel,
    sortModel,
    groupKeys,
    rowGroupCols: rowGroup,
  } = params.request;

  let filters;
  if (debouncedSearch) {
    filters = [
      {
        key: key,
        value: {
          filterType: "text",
          operator: "OR",
          conditions: [
            { filterType: "text", type: "contains", filter: debouncedSearch },
          ],
        },
      },
    ];
  } else {
    filters = Object.keys(filterModel).map((item, key) => ({
      key: item,
      value: filterModel[item],
    }));
  }
  const rowGroupCols = rowGroup.map((item: any) => ({ field: item.field }));
  const perpage = endRow - startRow;
  const page = Math.floor(startRow / perpage) + 1;
  return { perpage, page, filters, sortModel, rowGroupCols, groupKeys };
};
