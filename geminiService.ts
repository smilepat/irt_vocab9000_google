
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { QuizType, QuizQuestion } from "./types";

const getGenAI = () => {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
  return new GoogleGenerativeAI(apiKey);
};

export async function listAvailableModels(apiKey: string): Promise<string[]> {
  try {
    if (!apiKey) throw new Error("API Key is required to check models");
    // We create a temporary instance with the provided key to check
    const genAI = new GoogleGenerativeAI(apiKey);
    // Note: listModels is a method on the GoogleGenerativeAI instance (or its manager)
    // However, the JS SDK exposes it slightly differently depending on version.
    // In @google/generative-ai, we might need to use the model manager or just try/catch specific models if list isn't easily exposed.
    // Actually, as of v0.1.0+, there isn't a direct "listModels" on the client side SDK easily exposed for browser use without some work or it might be missing.
    // Let's check if we can simply fetch from the REST API manually if the SDK doesn't support it directly for browser.
    // The SDK often wraps this. Let's try to use the fetch directly for 'v1beta/models' to be safe and sure.

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.models?.map((m: any) => m.name.replace('models/', '')) || [];
  } catch (error: any) {
    console.error("Failed to list models", error);
    throw error;
  }
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const models = await listAvailableModels(apiKey);
    return models.length > 0;
  } catch (e) {
    console.error("API Key Validation Failed:", e);
    return false;
  }
}

const QUIZ_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    id: { type: SchemaType.STRING },
    word: { type: SchemaType.STRING },
    rank: { type: SchemaType.NUMBER },
    type: { type: SchemaType.STRING },
    questionText: { type: SchemaType.STRING },
    options: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Required for multiple choice types like I, J, K, L, M, P. Exactly 4 options."
    },
    correctAnswer: { type: SchemaType.STRING },
    explanation: { type: SchemaType.STRING }
  },
  required: ["id", "word", "rank", "type", "questionText", "correctAnswer", "explanation"]
};

export async function generateVocabularyQuestion(
  type: QuizType,
  targetRank: number,
  word?: string,
  modelName: string = "gemini-1.5-flash"
): Promise<QuizQuestion> {
  const prompt = `
    You are an IRT-based adaptive vocabulary testing engine for Korean students.
    You manage a "Master Vocabulary Table" of 9000 words with the following ranking logic:
    
    [Ranking Logic]
    - Rank 1 ~ 800: Core 800 English words prescribed by the South Korean Elementary School Curriculum (Basic nouns like 'apple', 'family', core verbs like 'go', 'eat').
    - Rank 801 ~ 1500: Rest of the general elementary and early middle school level words.
    - Rank 1501 ~ 4000: Core Middle and High school vocabulary, essential for the CSAT (수능).
    - Rank 4001 ~ 7000: Academic and professional vocabulary found in TOEIC, TOEFL, and college-level texts.
    - Rank 7001 ~ 9000: Advanced, rare, and high-difficulty academic terms (GRE, LSAT level).

    Your Task:
    1. ${word ? `Target Word: "${word}" (Rank: ${targetRank})` : `Select a word that strictly matches the difficulty Rank: ${targetRank} according to the logic above.`}
    2. Generate a quiz question of Type: ${type}.
    3. IMPORTANT: The question stem (the instructions and the question itself) MUST be in KOREAN. 
       The English sentence or target word remains in English.
    4. CRITICAL RULE FOR OPTIONS: Ensure the vocabulary used in options is NOT more difficult than the target word. Options should be words with a rank equal to or lower than ${targetRank}.
    
    [Quiz Type Rules & Korean Stem Examples]
    H: (영한번역 빈칸) Stem: "다음 한국어 문장에 들어갈 알맞은 영어 단어를 쓰세요." (English sentence with blank, plus Korean translation).
    I: (객관식) Stem: "다음 단어 <u>${word || '[word]'}</u>의 뜻으로 가장 알맞은 것을 고르세요."
    J: (유의어 찾기) Stem: "다음 단어 <u>${word || '[word]'}</u>와 의미가 가장 비슷한 유의어를 고르세요."
    K: (반의어 찾기) Stem: "다음 단어 <u>${word || '[word]'}</u>와 의미가 반대인 반의어를 고르세요."
    L: (품사 맞추기) Stem: "다음 문장에서 밑줄 친 <u>${word || '[word]'}</u>의 품사를 고르세요."
    M: (영영 풀이) Stem: "제시된 영영 풀이를 읽고, 이에 해당하는 단어를 고르세요."
    N: (문장 완성) Stem: "문맥상 빈칸에 들어갈 가장 적절한 단어를 고르세요." (Must provide an English sentence with a blank '______' that the target word fits into).
    O: (철자 맞추기) Stem: "다음 뜻에 해당하는 단어의 올바른 철자를 쓰거나 고르세요."
    P: (문맥 추론) Stem: "다음 지문을 읽고 밑줄 친 <u>${word || '[word]'}</u>의 의미를 문맥상 추론하여 고르세요."
    Q: (단어 배열) Stem: "제시된 뜻에 맞게 알파벳(또는 단어 조각)을 올바른 순서로 배열하세요."

    General Formatting Rules:
    - Use <u> tags for the target word in questionText.
    - The "explanation" field must be in Korean.
    ${word ? `- UNCONDITIONALLY USE THE WORD "${word}" AS THE TARGET.` : `- For Rank ${targetRank}, if it's 1-800, use words like 'pencil', 'school', 'run', etc.`}
  `;

  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: QUIZ_SCHEMA
    }
  });

  const result = await model.generateContent(prompt);
  const rawJson = result.response.text().trim();
  const parsed = JSON.parse(rawJson);

  return {
    ...parsed,
    rank: targetRank
  };
}

export async function evaluateAnswer(
  question: QuizQuestion,
  userAnswer: string
): Promise<boolean> {
  const cleanAnswer = userAnswer.trim().toLowerCase();
  const cleanCorrect = question.correctAnswer.trim().toLowerCase();
  return cleanAnswer === cleanCorrect;
}
