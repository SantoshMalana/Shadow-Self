import ChatInterface from '@/components/ChatInterface'

export default async function TrainChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  return <ChatInterface mode="onboarding" chatId={chatId} />
}
