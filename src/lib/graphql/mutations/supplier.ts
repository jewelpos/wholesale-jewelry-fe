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
  mutation DeleteSupplier($supplierid: Int!, $storeid: Int!) {
    deleteSupplier(supplierid: $supplierid, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;

export const UPDATE_SUPPLIER_MUTATION = gql`
  mutation EditSupplier($input: EditSupplierInput!) {
    editSupplier(editSupplierInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const ADD_SUPPLIER_INVOICE_MUTATION = gql`
  mutation CreateSupplierInvoice($input: CreateSupplierInvoiceInput!) {
    createSupplierInvoice(createSupplierInvoiceInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const DELETE_SUPPLIER_INVOICE_MUTATION = gql`
  mutation DeleteSupplierInvoice($supplierinvoiceid: Int!, $storeid: Int!) {
    deleteSupplierInvoice(supplierinvoiceid: $supplierinvoiceid, storeid: $storeid) {
      success
      message
      error
      data
    }
  }
`;

export const UPDATE_SUPPLIER_INVOICE_MUTATION = gql`
  mutation EditSupplierInvoice($input: EditSupplierInvoiceInput!) {
    editSupplierInvoice(editSupplierInvoiceInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const CREATE_SUPPLIER_NEW_PAYMENT_MUTATION = gql`
  mutation CreateSupplierNewPayment($input: CreateSupplierNewPaymentInput!) {
    createSupplierNewPayment(createSupplierNewPaymentInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const CREATE_SUPPLIER_VOIDED_PAYMENT_MUTATION = gql`
  mutation CreateSupplierVoidedPayment($input: CreateSupplierVoidedPaymentInput!) {
    createSupplierVoidedPayment(createSupplierVoidedPaymentInput: $input) {
      success
      message
      error
      data
    }
  }
`;