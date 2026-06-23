import { gql } from "@apollo/client";

export const CREATE_EXPENSE_CODE_MUTATION = gql`
  mutation CreateExpenseCode($input: CreateExpenseCodeInput!) {
    createExpenseCode(createExpenseCodeInput: $input) {
      success
      message
      error
    }
  }
`;

export const UPDATE_EXPENSE_CODE_MUTATION = gql`
  mutation UpdateExpenseCode($input: UpdateExpenseCodeInput!) {
    updateExpenseCode(updateExpenseCodeInput: $input) {
      success
      message
      error
    }
  }
`;

export const DELETE_EXPENSE_CODE_MUTATION = gql`
  mutation DeleteExpenseCode($expensecode: Int!, $storeid: Int!) {
    deleteExpenseCode(expensecode: $expensecode, storeid: $storeid) {
      success
      message
      error
    }
  }
`;

export const CREATE_NEW_EXPENSE_MUTATION = gql`
  mutation CreateNewExpense($input: CreateExpenseInput!) {
    createNewExpense(createExpenseInput: $input) {
      success
      message
      error
    }
  }
`;

export const UPDATE_EXPENSE_MUTATION = gql`
  mutation UpdateExpense($input: UpdateExpenseInput!) {
    updateExpense(updateExpenseInput: $input) {
      success
      message
      error
    }
  }
`;

export const DELETE_EXPENSE_MUTATION = gql`
  mutation DeleteExpense($expenseid: Int!, $storeid: Int!) {
    deleteExpense(expenseid: $expenseid, storeid: $storeid) {
      success
      message
      error
    }
  }
`;
