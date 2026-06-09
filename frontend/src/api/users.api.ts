import axios from "axios";
import { BACKEND_URL } from "../utils/constants";

export async function getChannelProfile(username: string) {
  const { data } = await axios.get(`${BACKEND_URL}/users/channel/${username}`, {
    withCredentials: true,
  });
  return data.data;
}
