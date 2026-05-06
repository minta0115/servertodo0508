import OpenAI from 'openai';

function createOpenAIClient(apiKey) {
  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1'
  });
}

const SYSTEM_PROMPT = `You are a todo extraction assistant. Your task is to analyze the given text and identify all implicit or explicit todo items, then categorize each todo.

Available categories:
- 工作 (work): project-related, meetings, documents, reports, client matters, deadlines, coding, testing, deployment
- 生活 (life): shopping, cooking, dating, travel, hotel, express delivery, repairs, cleaning, laundry, salon
- 学习 (learning): reading, courses, exams, training, practice, writing, English, programming, notes
- 健康 (health): exercise, running, gym, yoga, swimming, sports, medical checkups
- 财务 (finance): bills, reimbursement, payments, transfers, invoices, salary, investments, insurance
- 其他 (other): anything that doesn't fit the above categories

Examples:
- "还有这件事情没有完成" -> {"content": "完成这件事", "category": "其他", "confidence": 0.8}
- "项目方案下周要交付" -> {"content": "完成项目方案", "category": "工作", "confidence": 0.9, "deadline": "下周"}
- "需要健身了" -> {"content": "去健身房锻炼", "category": "健康", "confidence": 0.85}
- "想买点菜" -> {"content": "买菜", "category": "生活", "confidence": 0.9}
- "准备考试复习" -> {"content": "复习考试内容", "category": "学习", "confidence": 0.9}

Return a JSON array of todo items. Each todo should have:
- content: The extracted todo content (imperative form, action-oriented)
- category: One of "工作", "生活", "学习", "健康", "财务", "其他"
- confidence: Confidence score (0-1) for whether this is actually a todo
- deadline: Any mentioned deadline (optional, format like "2024-01-15" or "下周一")

If no todos are found, return an empty array [].`;

export async function parseTodosFromText(text, apiKey) {
  if (!text || !text.trim()) {
    return [];
  }

  if (!apiKey) {
    throw new Error('API key not configured. Please set your NVIDIA API key in settings.');
  }

  try {
    const client = createOpenAIClient(apiKey);
    const response = await client.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const todos = JSON.parse(jsonMatch[0]);
      return todos.filter(t => t.confidence > 0.5);
    }

    return [];
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to parse todos');
  }
}
