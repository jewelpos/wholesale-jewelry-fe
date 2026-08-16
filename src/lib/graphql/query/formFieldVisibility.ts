import { gql } from "@apollo/client";

export const GET_FORM_FIELD_VISIBILITY_QUERY = gql`
  query GetFormFieldVisibility($storeid: Int!, $formkey: String!) {
    getFormFieldVisibility(storeid: $storeid, formkey: $formkey)
  }
`;
