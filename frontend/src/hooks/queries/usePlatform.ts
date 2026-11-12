"use client";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { platformApi } from "@/lib/actions/platform";
import type { Filters } from "@/shared/types/platform";
export const usePlatformProfile = () =>
  useQuery({
    queryKey: ["platform", "profile"],
    queryFn: ({ signal }) => platformApi.profile(signal),
    staleTime: 60000,
  });
export const useServiceRequests = (filters: Filters) =>
  useQuery({
    queryKey: ["platform", "services", filters],
    queryFn: ({ signal }) => platformApi.services(filters, signal),
    placeholderData: keepPreviousData,
  });
export const useAssessments = (filters: Filters, enabled = true) =>
  useQuery({
    queryKey: ["platform", "assessments", filters],
    queryFn: ({ signal }) => platformApi.assessments(filters, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
export const useArticles = (filters: Filters) =>
  useQuery({
    queryKey: ["platform", "articles", filters],
    queryFn: ({ signal }) => platformApi.articles(filters, signal),
    placeholderData: keepPreviousData,
  });
export const useAuctions = (filters: Filters) =>
  useQuery({
    queryKey: ["platform", "auctions", filters],
    queryFn: ({ signal }) => platformApi.auctions(filters, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
  });
export const useOrders = (filters: Filters) =>
  useQuery({
    queryKey: ["platform", "orders", filters],
    queryFn: ({ signal }) => platformApi.orders(filters, signal),
    placeholderData: keepPreviousData,
  });
