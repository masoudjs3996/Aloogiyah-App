import { useRouter } from "next/navigation";

const useMoveBack = (): (() => void) => {
  const router = useRouter();
  return () => router.back();
};

export default useMoveBack;
