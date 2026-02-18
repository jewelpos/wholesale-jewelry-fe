import { gql } from "@apollo/client";

export const CREATE_INVOICE_MUTATION = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(createInvoiceInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const CREATE_CREDIT_INVOICE_MUTATION = gql`
  mutation CreateCreditInvoice($input: CreateCreditInvoiceInput!) {
    createCreditInvoice(createCreditInvoiceInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const EDIT_INVOICE_MUTATION = gql`
  mutation EditInvoice($input: EditInvoiceInput!) {
    editInvoice(editInvoiceInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const CREATE_MEMO_MUTATION = gql`
  mutation CreateMemo($input: CreateMemoInput!) {
    createMemo(createMemoInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const CREATE_CREDIT_MEMO_MUTATION = gql`
  mutation CreateCreditMemo($input: CreateCreditMemoInput!) {
    createCreditMemo(createCreditMemoInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const CREATE_INVOICE_FROM_MEMO_MUTATION = gql`
  mutation CreateInvoiceFromMemo($input: CreateInvoiceFromMemoInput!) {
    createInvoiceFromMemo(createInvoiceFromMemoInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const DELETE_SALES_ORDER_MUTATION = gql`
  mutation DeleteSalesOrder($salesorderno: String!, $outletid: Int!) {
    deleteSalesOrder(salesorderno: $salesorderno, outletid: $outletid) {
      success
      message
      error
      data
    }
  }
`;

export const DELETE_SALE_MUTATION = gql`
  mutation DeleteSalesOrder($salesorderno: String!, $outletid: Int!) {
    deleteSalesOrder(salesorderno: $salesorderno, outletid: $outletid) {
      success
      message
      error
      data
    }
  }
`;
