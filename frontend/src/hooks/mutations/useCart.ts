import { AddCart } from "@/lib/actions/cart";
import { useMutation, useQueryClient } from "@tanstack/react-query";
export default function useCart() { const client = useQueryClient(); const addCart = useMutation({ mutationFn: (params: { productCode: string; quantity: number }) => AddCart(params), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["platform", "cart"] }), client.invalidateQueries({ queryKey: ["userGetCart"] })]); } }); return { addCart }; }
