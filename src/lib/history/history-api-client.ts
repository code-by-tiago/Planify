import type { HistoryItem } from "../../types/history";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiError = {
  success: false;
  error: {
    message: string;
    details?: string;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

const fetchOptions: RequestInit = {
  credentials: "include",
};

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const json = (await response.json()) as ApiResponse<T>;

  return json;
}

export async function listHistoryFromAPI(): Promise<ApiResponse<{ items: HistoryItem[] }>> {
  const response = await fetch("/api/history", {
    method: "GET",
    ...fetchOptions,
  });

  return parseResponse<{ items: HistoryItem[] }>(response);
}

export async function saveHistoryItemToAPI(
  item: HistoryItem,
): Promise<ApiResponse<{ item: HistoryItem }>> {
  const response = await fetch("/api/history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      item,
    }),
  });

  return parseResponse<{ item: HistoryItem }>(response);
}

export async function removeHistoryItemFromAPI(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  const response = await fetch(`/api/history/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseResponse<{ id: string }>(response);
}

export async function clearHistoryFromAPI(): Promise<ApiResponse<{ cleared: boolean }>> {
  const response = await fetch("/api/history/clear", {
    method: "DELETE",
    credentials: "include",
  });

  return parseResponse<{ cleared: boolean }>(response);
}
