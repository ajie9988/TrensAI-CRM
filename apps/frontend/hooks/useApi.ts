"use client";

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import api from "@/services/api";
import type { AxiosRequestConfig } from "axios";

/** GET dengan react-query — hasil di-cache otomatis */
export function useGet<T = unknown>(
  queryKey: unknown[],
  url: string,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
  config?: AxiosRequestConfig
) {
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const res = await api.get<T>(url, config);
      return res.data;
    },
    ...options,
  });
}

/** POST / PUT / DELETE dengan mutation */
export function useMutate<TData = unknown, TVariables = unknown>(
  method: "post" | "put" | "patch" | "delete",
  url: string | ((vars: TVariables) => string),
  options?: {
    invalidateKeys?: unknown[][];
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const resolvedUrl = typeof url === "function" ? url(variables) : url;
      const res =
        method === "delete"
          ? await api.delete<TData>(resolvedUrl)
          : await api[method]<TData>(resolvedUrl, variables);
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate cache untuk refetch otomatis
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}
