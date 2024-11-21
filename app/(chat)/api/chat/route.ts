import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { geminiProModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import {
  createReservation,
  deleteChatById,
  getChatById,
  getReservationById,
  saveChat,
} from "@/db/queries";
import { generateUUID } from "@/lib/utils";

// New imports for MI Chatbot functionality
import { Character, updateCharacterState } from "@/lib/character";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  // Initialize or retrieve character state
  let character: Character = await getCharacterState(session.user.id);

  // Update character state based on the last user message
  if (coreMessages.length > 0) {
    const lastUserMessage = coreMessages[coreMessages.length - 1].content;
    character = updateCharacterState(character, lastUserMessage);
  }

  const result = await streamText({
    model: geminiProModel,
    system: `\n
        You are role-playing as ${character.name}, an employee who is ${character.emotionalState}.
        Your current readiness to change is: ${character.readinessToChange}.
        ${character.hiddenBackstory.revealed ? `You have recently experienced: ${character.hiddenBackstory.details}` : ''}
        Respond in a way that reflects your current emotional state and readiness to change.
        Keep your responses limited to a few sentences.
      `,
    messages: coreMessages,
    tools: {
      // Existing tools can be kept if needed for the MI Chatbot functionality
      // Remove or comment out tools that are not relevant
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
          });
          // Save updated character state
          await saveCharacterState(session.user.id, character);
        } catch (error) {
          console.error("Failed to save chat or character state");
        }
      }
    },
  });

  return result.toDataStreamResponse({});
}

// Existing DELETE function can be kept as is

// Helper functions for character state management
async function getCharacterState(userId: string): Promise<Character> {
  // Implement logic to retrieve character state from database
  // If no state exists, return initial state
  return {
    name: "Disaffected Employee",
    emotionalState: 'neutral',
    readinessToChange: 'pre-contemplation',
    hiddenBackstory: {
      details: 'You have been diagnosed with anxiety recently.',
      revealed: false
    }
  };
}

async function saveCharacterState(userId: string, character: Character): Promise<void> {
  // Implement logic to save character state to database
}
