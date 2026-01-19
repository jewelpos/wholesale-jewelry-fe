import { gql } from "@apollo/client";

export const ADD_PRODUCT_MUTATION = gql`
  mutation AddProduct($input: ProductInput!) {
    addProduct(input: $input) {
      success
      message
      itemid
    }
  }
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($input: ProductInput!) {
    updateProduct(input: $input) {
      success
      message
      itemid
    }
  }
`;

export const DELETE_PRODUCT_MUTATION = gql`
  mutation DeleteProduct($itemid: Int!, $storeid: Int!) {
    deleteProduct(itemid: $itemid, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;

export const ADD_CATEGORY_MUTATION = gql`
  mutation AddCategory($addCategoryInput: AddCategoryInput!) {
    addCategory(addCategoryInput: $addCategoryInput) {
      success
      message
      error
      data
    }
  }
`;

export const EDIT_CATEGORY_MUTATION = gql`
  mutation EditCategory($editCategoryInput: EditCategoryInput!) {
    editCategory(editCategoryInput: $editCategoryInput) {
      success
      message
      error
      data
    }
  }
`;

export const DELETE_CATEGORY_MUTATION = gql`
  mutation DeleteCategory($categoryid: Int!, $storeid: Int!) {
    deleteCategory(categoryid: $categoryid, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;

export const ADD_SUBCATEGORY_MUTATION = gql`
  mutation AddSubcategory($addSubcategoryInput: AddSubcategoryInput!) {
    addSubcategory(addSubcategoryInput: $addSubcategoryInput) {
      success
      message
      error
      data
    }
  }
`;

export const EDIT_SUBCATEGORY_MUTATION = gql`
  mutation EditSubcategory($editSubcategoryInput: EditSubcategoryInput!) {
    editSubcategory(editSubcategoryInput: $editSubcategoryInput) {
      success
      message
      error
      data
    }
  }
`;

export const DELETE_SUBCATEGORY_MUTATION = gql`
  mutation DeleteSubcategory($subcategoryid: Int!, $storeid: Int!) {
    deleteSubcategory(subcategoryid: $subcategoryid, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;

export const ADJUST_PRODUCT_MUTATION = gql`
  mutation AdjustProduct($adjustProductInput: AdjustProductInput!) {
    adjustProduct(adjustProductInput: $adjustProductInput) {
      success
      message
      error
      data
    }
  }
`;

export const CREATE_INVENTORY_TRANSFER_MUTATION = gql`
  mutation CreateInventoryTransfer(
    $createInventoryTransferInput: CreateInventoryTransferInput!
  ) {
    createInventoryTransfer(
      createInventoryTransferInput: $createInventoryTransferInput
    ) {
      success
      message
      error
      data
    }
  }
`;

export const REQUEST_INVENTORY_TRANSFER_MUTATION = gql`
  mutation RequestInventoryTransfer(
    $requestInventoryTransferInput: RequestInventoryTransferInput!
  ) {
    requestInventoryTransfer(
      requestInventoryTransferInput: $requestInventoryTransferInput
    ) {
      success
      message
      error
      data
    }
  }
`;

export const CHANGE_INVENTORY_TRANSFER_STATUS_MUTATION = gql`
  mutation ChangeInventoryTransferStatus(
    $changeInventoryTransferStatusInput: ChangeInventoryTransferStatusInput!
  ) {
    changeInventoryTransferStatus(
      changeInventoryTransferStatusInput: $changeInventoryTransferStatusInput
    ) {
      success
      message
      error
      data
    }
  }
`;

export const RECEIVE_INVENTORY_TRANSFER_MUTATION = gql`
  mutation ReceiveInventoryTransfer(
    $receiveInventoryTransferInput: ReceiveInventoryTransferInput!
  ) {
    receiveInventoryTransfer(
      receiveInventoryTransferInput: $receiveInventoryTransferInput
    ) {
      success
      message
      error
      data
    }
  }
`;
