import { gql } from "@apollo/client";

export const SAVE_FORM_FIELD_VISIBILITY_MUTATION = gql`
  mutation SaveFormFieldVisibility($storeid: Int!, $formkey: String!, $hiddenfields: String!) {
    saveFormFieldVisibility(storeid: $storeid, formkey: $formkey, hiddenfields: $hiddenfields)
  }
`;
