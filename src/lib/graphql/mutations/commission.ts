import { gql } from "@apollo/client";

export const UPSERT_EMPLOYEE_COMMISSION_RATE_MUTATION = gql`
  mutation UpsertEmployeeCommissionRate(
    $storeid: Int!
    $userid: Int!
    $commission_basis: String!
    $tiers: [CommissionTierInput!]!
  ) {
    upsertEmployeeCommissionRate(
      storeid: $storeid
      userid: $userid
      commission_basis: $commission_basis
      tiers: $tiers
    )
  }
`;

export const RECORD_COMMISSION_PAYOUT_MUTATION = gql`
  mutation RecordCommissionPayout($input: RecordCommissionPayoutInput!) {
    recordCommissionPayout(input: $input)
  }
`;

export const UPDATE_COMMISSION_TRIGGER_MUTATION = gql`
  mutation UpdateCommissionTrigger($input: UpdateCommissionTriggerInput!) {
    updateCommissionTrigger(input: $input)
  }
`;
