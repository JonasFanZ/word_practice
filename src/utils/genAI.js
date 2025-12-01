import { GoogleGenerativeAI } from "@google/generative-ai";
import pastExamQuestions from "./pastExams.json"; // 引入歷屆試題

// 輔助函式：根據傳入的 Key 建立 Model
function getModel(apiKey) {
  const keyToUse = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!keyToUse) {
    console.error("Gemini API Key is missing.");
    return null;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(keyToUse);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  } catch (error) {
    console.error("Error initializing Gemini Model:", error);
    return null;
  }
}

// 輔助函式：從歷屆試題中隨機抽取 N 題作為範例
function getStyleReferences(count = 3) {
  const shuffled = [...pastExamQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(q => ({
    question: q.question,
    answer: q.answer,
    options: q.options
  }));
}

export async function generatePersonalizedQuiz(wrongQuestions, apiKey) {
  const model = getModel(apiKey);
  if (!model) return [];

  // 1. 取得風格參考範例
  const styleReferences = getStyleReferences(3);
  const stylePrompt = `
    **REFERENCE STYLE (GSAT Standards):**
    Please analyze the following past exam questions to understand the difficulty (CEFR B2), sentence complexity, and vocabulary level:
    ${JSON.stringify(styleReferences)}
    
    **INSTRUCTION:**
    Your generated questions MUST mimic the style, length, and difficulty of the references above. Avoid overly simple sentences.
  `;

  const weakPoints = wrongQuestions.map(q => ({
    correctWord: q.answer,
    userMistake: q.userChoice,
    originalQuestion: q.question
  }));

  // 2. 根據是否有錯題來決定 Prompt
  let prompt = "";
  
  if (weakPoints.length > 0) {
    // 針對錯題生成 (弱點強化模式)
    prompt = `
      You are an expert English tutor for high school students in Taiwan (preparing for GSAT).
      
      ${stylePrompt}

      The student made mistakes on the following vocabulary words:
      ${JSON.stringify(weakPoints)}
      
      **Task:**
      Generate 5 NEW multiple-choice questions (MCQ) to help the student distinguish confusing words.
      
      **CRITICAL REQUIREMENTS For Each Question:**
      1. **Target Word:** The correct answer MUST be the 'correctWord' from the student's mistake list.
      2. **Distractor:** One of the wrong options MUST be the 'userMistake' (the word they wrongly chose last time). This is crucial for them to learn the difference.
      3. **Context:** Create a NEW sentence context that clearly fits the 'correctWord' but makes the 'userMistake' incorrect.
      4. **Translation:** The Chinese translation MUST be a COMPLETE sentence with the answer's meaning filled in. **DO NOT use underscores (____) or blanks in the translation.**
      5. **Level:** Strictly consistent with the REFERENCE STYLE.
      6. Output STRICTLY in valid JSON format only. No markdown.
      
      JSON Structure:
      [
        {
          "id": "ai_gen_1",
          "question": "Sentence with ______ blank.",
          "options": ["word A", "word B", "word C", "word D"], 
          "answer": "correct_word",
          "translation": "完整的中文翻譯句子（包含正確答案的意思，不要有底線）",
          "source": "AI Generated (Weakness Review)"
        }
      ]
    `;
  } else {
    // 全新出題模式 (仿製歷屆試題)
    prompt = `
      You are an expert English tutor designing a mock exam for the Taiwan GSAT (General Scholastic Ability Test).
      
      ${stylePrompt}

      **Task:** Generate 10 high-quality MCQ vocabulary questions that perfectly simulate the difficulty of the provided references.

      **Requirements:**
      1. Topics should cover diverse fields (science, culture, daily life, environment) just like the real exam.
      2. Sentences should be substantial (not too short) to provide enough context clues.
      3. Vocabulary level: CEFR B2 (Level 4-5 in Taiwan 7000 words list).
      4. **Translation:** The Chinese translation MUST be a COMPLETE sentence with the answer's meaning filled in. **DO NOT use underscores (____) or blanks in the translation.**
      5. Output STRICTLY in valid JSON format only. No markdown.
      
      JSON Structure:
      [
        {
          "id": "ai_gen_random_1",
          "question": "Sentence with ______ blank.",
          "options": ["word A", "word B", "word C", "word D"], 
          "answer": "correct_word",
          "translation": "完整的中文翻譯句子（包含正確答案的意思，不要有底線）",
          "source": "AI Generated (GSAT Simulation)"
        }
      ]
    `;
  }

  try {
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

export async function analyzeMistakes(mistakes, flaggedItems, eliminatedItems, allQuestions, apiKey) {
  const model = getModel(apiKey);
  if (!model) return "無法連線至 AI 進行分析 (API Key 缺失或無效)";

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
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return `AI 分析暫時無法使用。錯誤訊息: ${error.message}`;
  }
}