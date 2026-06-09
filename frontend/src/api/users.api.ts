import axios from "axios";
import { BACKEND_URL } from "../utils/constants";

export async function registerUser(formData: FormData) {
  const { data } = await axios.post(
    `${BACKEND_URL}/users/register`,
    formData,
    { withCredentials: true }
  );
  return data.data;
}

export async function loginUser(payload: {
  username: string;
  email: string;
  password: string;
}) {
  const { data } = await axios.post(
    `${BACKEND_URL}/users/login`,
    payload,
    { withCredentials: true }
  );
  return data.data;
}


export async function getChannelProfile(username: string) {
  const { data } = await axios.get(`${BACKEND_URL}/users/channel/${username}`, {
    withCredentials: true,
  });
  return data.data;
}


