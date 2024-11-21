export interface Character {
  name: string;
  emotionalState: string;
  readinessToChange: string;
  hiddenBackstory: {
    details: string;
    revealed: boolean;
  };
}

export class MIChatbot {
  private character: Character;

  constructor(initialCharacter: Character) {
    this.character = initialCharacter;
  }

  public updateState(userMessage: string): void {
    if (this.detectsEmpathy(userMessage)) {
      this.character.readinessToChange = 'contemplation';
      this.character.hiddenBackstory.revealed = true;
    } else if (this.detectsConfrontation(userMessage)) {
      this.character.readinessToChange = 'pre-contemplation';
      this.character.emotionalState = 'defensive';
    }
  }

  public getSystemPrompt(): string {
    return `
      You are role-playing as ${this.character.name}, an employee who is ${this.character.emotionalState}.
      Your current readiness to change is: ${this.character.readinessToChange}.
      ${this.character.hiddenBackstory.revealed ? `You have recently experienced: ${this.character.hiddenBackstory.details}` : ''}
      Respond in a way that reflects your current emotional state and readiness to change.
      Keep your responses concise and limited to a few sentences.
      Engage in a manner consistent with Motivational Interviewing techniques.
    `;
  }

  public getCharacterState(): Character {
    return { ...this.character };
  }

  private detectsEmpathy(message: string): boolean {
    const empathyPhrases = ['understand', 'appreciate', 'it sounds like', 'that must be difficult'];
    return empathyPhrases.some(phrase => message.toLowerCase().includes(phrase));
  }

  private detectsConfrontation(message: string): boolean {
    const confrontationalPhrases = ['you must', 'why can\'t you', 'you need to', 'this is unacceptable'];
    return confrontationalPhrases.some(phrase => message.toLowerCase().includes(phrase));
  }
}

export function createMIChatbot(): MIChatbot {
  const initialCharacter: Character = {
    name: "Disaffected Employee",
    emotionalState: 'neutral',
    readinessToChange: 'pre-contemplation',
    hiddenBackstory: {
      details: 'You have been diagnosed with anxiety recently.',
      revealed: false
    }
  };
  return new MIChatbot(initialCharacter);
}
