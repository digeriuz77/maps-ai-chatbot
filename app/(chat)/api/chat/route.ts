import { convertToCoreMessages, Message, streamText } from "ai";
import { geminiProModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { deleteChatById, getChatById, saveChat } from "@/db/queries";
import { Character, updateCharacterState, getInitialCharacter } from "@/lib/character";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } = await request.json();

  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0
  );

  // Retrieve or initialize character state
  let character: Character = await getCharacterState(session.user.id);

  // Update character state based on the last user message
  if (coreMessages.length > 0) {
    const lastUserMessage = coreMessages[coreMessages.length - 1].content;
    character = updateCharacterState(character, lastUserMessage);
  }

  const result = await streamText({
    model: geminiProModel,
    system: generateSystemPrompt(character),
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
          await saveCharacterState(session.user.id, character);
        } catch (error) {
          console.error("Failed to save chat or character state");
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

// The DELETE function remains unchanged
export async function DELETE(request: Request) {
  // ... (keep existing implementation)
}

// Helper functions
async function getCharacterState(userId: string): Promise<Character> {
  // TODO: Implement retrieval from database
  return getInitialCharacter();
}

async function saveCharacterState(userId: string, character: Character): Promise<void> {
  // TODO: Implement saving to database
  console.log("Saving character state:", character);
}

function generateSystemPrompt(character: Character): string {
  return `
    You are role-playing as ${character.name}, an employee who is ${character.emotionalState}.
    Your current readiness to change is: ${character.readinessToChange}.
    ${character.hiddenBackstory.revealed ? `You have recently experienced: ${character.hiddenBackstory.details}` : ''}
    Respond in a way that reflects your current emotional state and readiness to change.
    Keep your responses concise and limited to a few sentences.
    Engage in a manner consistent with Motivational Interviewing techniques.
  `;
}
