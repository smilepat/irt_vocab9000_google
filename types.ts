
export enum QuizType {
  H = 'H', // Translation Fill-in-blank
  I = 'I', // Multiple Choice
  J = 'J', // Synonym
  K = 'K', // Antonym
  L = 'L', // Parts of Speech
  M = 'M', // English Definition
  N = 'N', // Sentence Completion
  O = 'O', // Spelling
  P = 'P', // Context Inference
  Q = 'Q'  // Word Scramble
}

export const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  [QuizType.H]: 'H: 영한번역 빈칸',
  [QuizType.I]: 'I: 객관식',
  [QuizType.J]: 'J: 유의어 찾기',
  [QuizType.K]: 'K: 반의어 찾기',
  [QuizType.L]: 'L: 품사 맞추기',
  [QuizType.M]: 'M: 영영 풀이',
  [QuizType.N]: 'N: 문장 완성',
  [QuizType.O]: 'O: 철자 맞추기',
  [QuizType.P]: 'P: 문맥 추론',
  [QuizType.Q]: 'Q: 단어 배열'
};

export interface QuizQuestion {
  id: string;
  type: QuizType;
  word: string;
  rank: number;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface UserResponse {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface QuizState {
  currentQuestion: QuizQuestion | null;
  history: QuizQuestion[];
  responses: UserResponse[];
  loading: boolean;
  score: number;
  totalAnswered: number;
  difficultyRange: [number, number];
}
