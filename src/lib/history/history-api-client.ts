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

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const json = (await response.json()) as ApiResponse<T>;

  return json;
}

export async function listHistoryFromAPI(): Promise<ApiResponse<{ items: HistoryItem[] }>> {
  const response = await fetch("/api/history", {
    method: "GET",
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
  });

  return parseResponse<{ id: string }>(response);
}

export async function clearHistoryFromAPI(): Promise<ApiResponse<{ cleared: boolean }>> {
  const response = await fetch("/api/history/clear", {
    method: "DELETE",
  });

  return parseResponse<{ cleared: boolean }>(response);
}
