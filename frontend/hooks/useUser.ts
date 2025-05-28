import { useEffect, useState } from "react";
import { UserService } from "../service/user/user.service";

/**
 * Return user profile from server use in component
 * @returns
 */
export function useUser(context = null) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getUser = async () => {
    try {
      setLoading(true);
      const res = await UserService.getUserProfile(context);
      let userData = null;

      if (res.data && !res.data.error) {
        userData = res.data.data || res.data;
      } else {
        setError(res.data?.message || "Failed to fetch user profile");
      }
      setUser(userData);
    } catch (error) {
      setError("An error occurred while fetching user profile");
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return { user, loading, error, refetch: getUser };
}

/**
 * Return user profile from server use in serversideprops
 * @returns
 */
export async function getUser(context = null) {
  let userData = null;
  try {
    const res = await UserService.getUserProfile(context);

    if (res.data && !res.data.error) {
      userData = res.data.data || res.data;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    userData = null;
  }

  return userData;
}
