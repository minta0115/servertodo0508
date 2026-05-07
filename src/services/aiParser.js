import OpenAI from 'openai';

function createOpenAIClient(apiKey, provider) {
  const config = { apiKey };

  switch (provider) {
    case 'nvidia':
      config.baseURL = 'https://integrate.api.nvidia.com/v1';
      break;
    case 'kimi':
      config.baseURL = 'https://api.moonshot.cn/v1';
      break;
    case 'minimax':
      config.baseURL = 'https://api.minimax.chat/v1';
      break;
    case 'openai':
    default:
      // OpenAI compatible - no baseURL needed
      break;
  }

  return new OpenAI(config);
}

function detectProvider(apiKey) {
  if (apiKey.startsWith('nvapi-')) {
    return 'nvidia';
  }
  if (apiKey.startsWith('sk-')) {
    // Could be OpenAI or Kimi - default to Kimi for Chinese support
    return 'kimi';
  }
  if (apiKey.startsWith('mm-')) {
    return 'minimax';
  }
  return 'openai';
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

const MODEL_MAP = {
  nvidia: 'meta/llama-3.1-70b-instruct',
  kimi: 'moonshot-v1-8k',
  minimax: 'MiniMax-Text-01',
  openai: 'gpt-4o-mini'
};

export async function parseTodosFromText(text, apiKey, provider = null) {
  if (!text || !text.trim()) {
    return [];
  }

  if (!apiKey) {
    throw new Error('API key not configured. Please set your API key in settings.');
  }

  const detectedProvider = provider || detectProvider(apiKey);
  const model = MODEL_MAP[detectedProvider] || MODEL_MAP.openai;

  console.log(`Using provider: ${detectedProvider}, model: ${model}`);

  try {
    const client = createOpenAIClient(apiKey, detectedProvider);

    // Create a promise that wraps the API call
    const apiPromise = client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    // Race between API call and 120s timeout
    const response = await Promise.race([
      apiPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI 响应超时（120秒），请重试')), 120000)
      )
    ]);

    const content = response.choices[0].message.content;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const todos = JSON.parse(jsonMatch[0]);
      return todos.filter(t => t.confidence > 0.5);
    }

    return [];
  } catch (error) {
    console.error('AI API error:', error.message);
    if (error.message.includes('超时') || error.message.includes('timeout')) {
      throw new Error('AI 响应超时（120秒），请重试');
    }
    throw new Error('Failed to parse todos: ' + error.message);
  }
}