import { createAsyncThunk } from "@reduxjs/toolkit";
import { apolloClientAuthorized } from "@/lib/apolloClientAuthorized";
import { GET_ACTIVE_USER } from "@/lib/graphql/query/user";

export const fetchActiveUserData = createAsyncThunk(
  "user/fetchActiveUserData",
  async () => {
    const { data } = await apolloClientAuthorized.query({
      query: GET_ACTIVE_USER,
    });
    return data.getActiveUserInfo;
  }
);
