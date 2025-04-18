import { gql } from "@apollo/client";

export const ADD_SUPPLIER_MUTATION = gql`
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(createSupplierInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const DELETE_SUPPLIER_MUTATION = gql`
  mutation DeleteSupplier($supplierid: Int!, $outletid: Int!) {
    deleteSupplier(supplierid: $supplierid, outletid: $outletid) {
      success
      message
      error
      data
    }
  }
`;
