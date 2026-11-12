import ChatWorkspace from "@/design-system/organisms/platform/ChatWorkspace";
export default async function Page({ searchParams }: { searchParams: Promise<{ receiver?: string; room?: string; receiverName?: string; contextName?: string; contextType?: string }> }) {
  const { receiver, room, receiverName, contextName, contextType } = await searchParams;
  return (
    <ChatWorkspace
      initialReceiver={receiver || ""}
      initialRoomCode={room || ""}
      initialReceiverName={receiverName || ""}
      initialContextName={contextName || ""}
      initialContextType={contextType || ""}
    />
  );
}
