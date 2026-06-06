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

export const CREATE_SALES_ORDER_MUTATION = gql`
  mutation CreateSalesOrder($input: CreateSalesOrderInput!) {
    createSalesOrder(createSalesOrderInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const EDIT_SALES_ORDER_MUTATION = gql`
  mutation EditSalesOrder($input: EditSalesOrderInput!) {
    editSalesOrder(editSalesOrderInput: $input) {
      success
      message
      error
      data
    }
  }
`;

export const UPDATE_SALES_ORDER_STATUS_MUTATION = gql`
  mutation UpdateSalesOrderStatus($input: UpdateSalesOrderStatusInput!) {
    updateSalesOrderStatus(updateSalesOrderStatusInput: $input) {
      success
      message
      error
    }
  }
`;

export const EDIT_MEMO_MUTATION = gql`
  mutation EditMemo($input: EditMemoInput!) {
    editMemo(editMemoInput: $input) {
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

export const UPDATE_SO_AFTER_INVOICING_MUTATION = gql`
  mutation UpdateSOAfterInvoicing($input: UpdateSOAfterInvoicingInput!) {
    updateSOAfterInvoicing(updateSOAfterInvoicingInput: $input) {
      success
      message
      error
    }
  }
`;

export const UPDATE_MEMO_AFTER_INVOICING_MUTATION = gql`
  mutation UpdateMemoAfterInvoicing($input: UpdateMemoAfterInvoicingInput!) {
    updateMemoAfterInvoicing(updateMemoAfterInvoicingInput: $input) {
      success
      message
      error
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

export const CANCEL_INVOICE_MUTATION = gql`
  mutation CancelInvoice($input: CancelInvoiceInput!) {
    cancelInvoice(cancelInvoiceInput: $input) {
      success
      message
      error
      data
    }
  }
`;
