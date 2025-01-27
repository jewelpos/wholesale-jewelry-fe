import { setContext } from "@apollo/client/link/context";
import { getAccessToken } from "../authStorage";

export const authLink = setContext(async (_, { headers }) => {
  try {
    // Get the access token
    const token = await getAccessToken();
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  } catch (error) {
    console.error("Error in auth link:", error);
    return { headers };
  }
});
