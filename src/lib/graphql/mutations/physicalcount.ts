import { gql } from "@apollo/client";

const BASE_RESPONSE = `
  success
  message
  error
  data
`;

export const CREATE_PHYSICAL_COUNT_BATCH_MUTATION = gql`
  mutation CreatePhysicalCountBatch($input: CreatePhysicalCountBatchInput!) {
    createPhysicalCountBatch(input: $input) {
      ${BASE_RESPONSE}
    }
  }
`;

export const SAVE_COUNT_ITEMS_MUTATION = gql`
  mutation SaveCountItems($input: SaveCountItemsInput!) {
    saveCountItems(input: $input) {
      ${BASE_RESPONSE}
    }
  }
`;

export const COMPLETE_COUNT_MUTATION = gql`
  mutation CompleteCount($storeid: Int!, $batchid: Int!) {
    completeCount(storeid: $storeid, batchid: $batchid) {
      ${BASE_RESPONSE}
    }
  }
`;

export const REQUEST_RECOUNT_MUTATION = gql`
  mutation RequestRecount($storeid: Int!, $batchid: Int!, $countitemids: [Int!]!) {
    requestRecount(storeid: $storeid, batchid: $batchid, countitemids: $countitemids) {
      ${BASE_RESPONSE}
    }
  }
`;

export const SAVE_RECOUNT_ITEMS_MUTATION = gql`
  mutation SaveRecountItems($input: SaveRecountItemsInput!) {
    saveRecountItems(input: $input) {
      ${BASE_RESPONSE}
    }
  }
`;

export const APPROVE_PHYSICAL_COUNT_MUTATION = gql`
  mutation ApprovePhysicalCount($storeid: Int!, $batchid: Int!) {
    approvePhysicalCount(storeid: $storeid, batchid: $batchid) {
      ${BASE_RESPONSE}
    }
  }
`;

export const POST_PHYSICAL_COUNT_MUTATION = gql`
  mutation PostPhysicalCount($input: PostPhysicalCountInput!) {
    postPhysicalCount(input: $input) {
      ${BASE_RESPONSE}
    }
  }
`;

export const CANCEL_PHYSICAL_COUNT_MUTATION = gql`
  mutation CancelPhysicalCount($storeid: Int!, $batchid: Int!) {
    cancelPhysicalCount(storeid: $storeid, batchid: $batchid) {
      ${BASE_RESPONSE}
    }
  }
`;
