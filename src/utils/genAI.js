import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

console.log("Gemini API Key Status:", API_KEY ? `Present (${API_KEY.substring(0, 4)}...)` : "Missing");

export async function generatePersonalizedQuiz(wrongQuestions) {
  if (!genAI) {
    console.error("Gemini API Key is missing.");
    return [];
  }

  const weakPoints = wrongQuestions.map(q => ({
    correctWord: q.answer,
    userMistake: q.userChoice,
    originalQuestion: q.question
  }));

  const prompt = weakPoints.length > 0 ? `
    You are an expert English tutor for high school students in Taiwan (preparing for GSAT).
    The student made mistakes on the following vocabulary words:
    ${JSON.stringify(weakPoints)}
    
    Task:
    Generate 5 NEW multiple-choice questions (MCQ) to help the student distinguish these confusing words.
    
    Requirements:
    1. Create a NEW sentence context.
    2. The level should be CEFR B2 (GSAT Level 4-5).
    3. Output STRICTLY in valid JSON format only. No markdown.
    
    JSON Structure:
    [
      {
        "id": "ai_gen_1",
        "question": "Sentence with ______ blank.",
        "options": ["word A", "word B", "word C", "word D"], 
        "answer": "correct_word",
        "translation": "Traditional Chinese translation of the sentence",
        "source": "AI Generated"
      }
    ]
  ` : `
    You are an expert English tutor.
    Task: Generate 10 high-quality MCQ vocabulary questions for GSAT (Grade 12).
    Requirements: CEFR B2 level. Academic vocabulary. Valid JSON output only.
    
    JSON Structure:
    [
      {
        "id": "ai_gen_random_1",
        "question": "Sentence with ______ blank.",
        "options": ["word A", "word B", "word C", "word D"], 
        "answer": "correct_word",
        "translation": "Traditional Chinese translation of the sentence",
        "source": "AI Generated"
      }
    ]
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Generation API Error:", error);
    return [];
  }
}

export async function analyzeMistakes(mistakes, flaggedItems, eliminatedItems, allQuestions) {
  if (!genAI) return "無法連線至 AI 進行分析 (API Key 缺失)";

  // 1. 篩選需要檢討的題目
  const questionsToReview = allQuestions.filter(q => {
    const isWrong = mistakes.some(m => m.id === q.id);
    const isFlagged = flaggedItems.some(f => f.questionId === q.id);
    return isWrong || isFlagged;
  });

  if (questionsToReview.length === 0) {
    return "太棒了！你全對且沒有任何標記疑問，表示你完全掌握了這些內容，無須檢討！🎉";
  }

  // 整理資料給 AI
  const dataToAnalyze = questionsToReview.map(q => {
    const wrongRecord = mistakes.find(m => m.id === q.id);
    const userSelected = wrongRecord ? wrongRecord.userChoice : q.answer;
    const isCorrect = !wrongRecord;

    const flagsForThisQ = flaggedItems
        .filter(f => f.questionId === q.id)
        .map(f => f.optionText);
        
    const eliminationsForThisQ = eliminatedItems
        .filter(e => e.questionId === q.id)
        .map(e => e.optionText);

    return {
      question: q.question,
      options: q.options,
      correctAnswer: q.answer,
      userSelected: userSelected,
      isCorrect: isCorrect,
      flagged: flagsForThisQ,
      eliminated: eliminationsForThisQ
    };
  });

  const prompt = `
    You are a strict exam analysis AI for Taiwanese students.
    Analyze the student's performance in Traditional Chinese (繁體中文).

    **Student Data:**
    ${JSON.stringify(dataToAnalyze)}

    **Strict Output Rules:**
    1.  **ABSOLUTELY NO ASTERISKS (*)** allowed. Use brackets [ ] or emojis if needed, but keep it clean.
    2.  **No greetings.** Start immediately.
    3.  For each question, follow this exact format:

    Q: [Question Text]
    
    
    [Options Format]
    - List options vertically.
    - Add ✅ ""before"" the correct answer.
    - Add ❌ ""before"" the user's wrong answer (if applicable).
    - Add ❔ ""before"" any option the user flagged as unknown.
    - Include brief Chinese translation for each option in parenthesis.
    
    Example:
    ❔(A) optionA (翻譯)
    ✅(B) optionB (翻譯)
    ❔(C) optionC (翻譯)
    ❌(D) optionD (翻譯)

    [細節分析]
    - Explain the correct answer logic.
    - If there are **flagged words** (marked as unknown), explain them here: [Word]: [Definition].
    - Infer the user's thought process based on their choice, flagged words, and eliminated options. Use "你" to address the user.
    - Explain why the user's choice is wrong (if applicable).

    ---
    (Use "---" to separate questions)
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return `AI 分析暫時無法使用。錯誤訊息: ${error.message}`;
  }
}