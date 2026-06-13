import axios from "axios";
import { BACKEND_URL } from "../utils/constants";

export type CommentOwner = {
  _id: string;
  username: string;
  avatar: string;
};

export type Comment = {
  _id: string;
  content: string;
  createdAt: string;
  owner: CommentOwner;
};

export type CommentsPage = {
  docs: Comment[];
  totalDocs: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/** Read the access token from the Zustand-persisted auth store in localStorage */
function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    return JSON.parse(raw)?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** GET /comments/:videoId — public */
export async function getVideoComments(
  videoId: string,
  page = 1,
  limit = 10
): Promise<CommentsPage> {
  const { data } = await axios.get(`${BACKEND_URL}/comments/${videoId}`, {
    params: { page, limit },
    withCredentials: true,
  });
  return data.data;
}

/** POST /comments/:videoId — requires auth */
export async function addComment(videoId: string, content: string): Promise<Comment> {
  const { data } = await axios.post(
    `${BACKEND_URL}/comments/${videoId}`,
    { content },
    { withCredentials: true, headers: authHeaders() }
  );
  return data.data;
}

/** PATCH /comments/c/:commentId — requires auth + ownership */
export async function updateComment(commentId: string, content: string): Promise<Comment> {
  const { data } = await axios.patch(
    `${BACKEND_URL}/comments/c/${commentId}`,
    { content },
    { withCredentials: true, headers: authHeaders() }
  );
  return data.data;
}

/** DELETE /comments/c/:commentId — requires auth + ownership */
export async function deleteComment(commentId: string): Promise<void> {
  await axios.delete(`${BACKEND_URL}/comments/c/${commentId}`, {
    withCredentials: true,
    headers: authHeaders(),
  });
}
