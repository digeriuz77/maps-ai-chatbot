import { convertToCoreMessages, Message, streamText } from "ai";

import { geminiProModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import {
  deleteChatById,
  getChatById,
  saveChat,
} from "@/db/queries";
import { MIChatbot, createMIChatbot } from "@/lib/mi-chatbot";

// Use a Map to store MIChatbot instances for each user
const userChatbots = new Map<string, MIChatbot>();

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } = await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  // Get or create MIChatbot instance for the user
  let chatbot = userChatbots.get(session.user.id);
  if (!chatbot) {
    chatbot = createMIChatbot();
    userChatbots.set(session.user.id, chatbot);
  }

  // Update chatbot state based on the last user message
  if (coreMessages.length > 0) {
    const lastUserMessage = coreMessages[coreMessages.length - 1].content;
    chatbot.updateState(lastUserMessage);
  }

  const result = await streamText({
    model: geminiProModel,
    system: chatbot.getSystemPrompt(),
    messages: coreMessages,
    tools: {
      // If there are any existing tools that need to be kept, they should be included here
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
          });
          // Note: Character state is automatically saved in the MIChatbot instance
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
