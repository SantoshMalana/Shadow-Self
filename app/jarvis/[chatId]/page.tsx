import ChatInterface from '@/components/ChatInterface'

export default async function JarvisChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  return <ChatInterface mode="jarvis" chatId={chatId} />
}
