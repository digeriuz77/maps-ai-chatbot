export interface Character {
  name: string;
  emotionalState: string;
  readinessToChange: string;
  hiddenBackstory: {
    details: string;
    revealed: boolean;
  };
}

export function updateCharacterState(character: Character, userMessage: string): Character {
  // Implement state transition logic here
  // This is a simplified example
  if (userMessage.toLowerCase().includes('understand') || userMessage.toLowerCase().includes('appreciate')) {
    return {
      ...character,
      readinessToChange: 'contemplation',
      hiddenBackstory: { ...character.hiddenBackstory, revealed: true }
    };
  } else if (userMessage.toLowerCase().includes('must') || userMessage.toLowerCase().includes('need to')) {
    return {
      ...character,
      readinessToChange: 'pre-contemplation',
      emotionalState: 'defensive'
    };
  }
  return character;
}
