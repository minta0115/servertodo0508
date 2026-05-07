const axios = require('axios');

const DEFAULT_NVIDIA_KEY = 'nvapi-test-key';
const DEFAULT_MINIMAX_KEY = 'mm-test-key';

function detectProvider(apiKey) {
    if (apiKey.startsWith('nvapi-')) return 'nvidia';
    if (apiKey.startsWith('sk-')) return 'kimi';
    if (apiKey.startsWith('mm-')) return 'minimax';
    return 'openai';
}

const MODEL_MAP = {
    nvidia: 'meta/llama-3.1-70b-instruct',
    minimax: 'MiniMax-Text-01',
    kimi: 'moonshot-v1-8k',
    openai: 'gpt-4o-mini'
};

async function callAI(provider, apiKey, prompt) {
    // For local development, return mock data
    if (apiKey === 'nvapi-test-key' || apiKey === 'mm-test-key') {
        return JSON.stringify([
            {
                content: '完成项目文档编写',
                confidence: 0.9,
                due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: '工作'
            },
            {
                content: '回复客户邮件',
                confidence: 0.85,
                due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: '工作'
            }
        ]);
    }

    if (provider === 'nvidia') {
        try {
            const response = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
                model: MODEL_MAP.nvidia,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024
            }, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('NVIDIA AI error:', error.message);
            throw error;
        }
    } else if (provider === 'minimax') {
        try {
            const response = await axios.post('https://api.minimax.chat/v1/text/chatcompletion_v2', {
                model: MODEL_MAP.minimax,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024
            }, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('MiniMax AI error:', error.message);
            throw error;
        }
    }
    throw new Error('Unsupported provider');
}

async function parseTodos(text, userId, db) {
    try {
        const settings = db.userSettings[userId] || { preferred_provider: 'nvidia' };
        const preferredProvider = settings.preferred_provider || 'nvidia';

        const apiKeyRow = db.userApiKeys[`${userId}_${preferredProvider}`];
        let apiKey = apiKeyRow?.api_key;

        if (!apiKey) {
            apiKey = preferredProvider === 'minimax' ? DEFAULT_MINIMAX_KEY : DEFAULT_NVIDIA_KEY;
        }

        const prompt = `请从以下文本中提取待办事项。文本：${text}\n\n请以JSON格式返回，格式如下：[{"content": "待办内容", "confidence": 0.8, "due_date": "2024-05-10", "category": "工作"}]`;

        const response = await callAI(preferredProvider, apiKey, prompt);
        let todos = [];
        try {
            todos = JSON.parse(response);
        } catch (e) {
            // If AI response is not valid JSON, try to extract it
            const jsonMatch = response.match(/\[.*\]/s);
            if (jsonMatch) {
                todos = JSON.parse(jsonMatch[0]);
            } else {
                todos = [{
                    content: response,
                    confidence: 0.5,
                    category: 'other'
                }];
            }
        }

        // Generate IDs for todos
        let nextId = db.todos.length > 0 ? Math.max(...db.todos.map(t => t.id)) + 1 : 1;

        for (const todo of todos) {
            db.todos.push({
                id: nextId++,
                user_id: userId,
                content: todo.content,
                source: 'manual',
                completed: 0,
                created_at: new Date().toISOString(),
                completed_at: null
            });
        }

        return todos;
    } catch (error) {
        console.error('Error parsing todos:', error);
        throw error;
    }
}

module.exports = { parseTodos };