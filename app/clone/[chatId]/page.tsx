import ChatInterface from '@/components/ChatInterface'

export default async function CloneChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  return <ChatInterface mode="clone" chatId={chatId} />
}
