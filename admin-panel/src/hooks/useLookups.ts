import {useQuery} from '@tanstack/react-query';
import {request} from '../shared/api/client';
import type {Lookups} from '../shared/types';
export function useLookups(){return useQuery<Lookups>({queryKey:['lookups'],queryFn:()=>request('/Admin/Lookups'),staleTime:300000});}
