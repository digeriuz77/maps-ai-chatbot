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
  if (detectsEmpathy(userMessage)) {
    return {
      ...character,
      readinessToChange: 'contemplation',
      hiddenBackstory: { ...character.hiddenBackstory, revealed: true }
    };
  } else if (detectsConfrontation(userMessage)) {
    return {
      ...character,
      readinessToChange: 'pre-contemplation',
      emotionalState: 'defensive'
    };
  }
  return character;
}

export function getInitialCharacter(): Character {
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

function detectsEmpathy(message: string): boolean {
  const empathyPhrases = ['understand', 'appreciate', 'it sounds like', 'that must be difficult'];
  return empathyPhrases.some(phrase => message.toLowerCase().includes(phrase));
}

function detectsConfrontation(message: string): boolean {
  const confrontationalPhrases = ['you must', 'why can\'t you', 'you need to', 'this is unacceptable'];
  return confrontationalPhrases.some(phrase => message.toLowerCase().includes(phrase));
}
