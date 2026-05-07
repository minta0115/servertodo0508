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

async function callAI(provider, apiKey, prompt, originalText) {
    // For local development, return mock data based on user input
    if (apiKey === 'nvapi-test-key' || apiKey === 'mm-test-key') {
        // 简单的智能解析逻辑
        const todos = [];
        const lines = originalText.split(/[\n、；;]/).filter(l => l.trim());

        for (const line of lines) {
            const cleaned = line.trim();
            if (cleaned.length > 0) {
                // 尝试从文本中提取日期
                let dueDate = null;
                let dateOffset = 0;

                if (cleaned.includes('今天')) dateOffset = 0;
                else if (cleaned.includes('明天')) dateOffset = 1;
                else if (cleaned.includes('后天')) dateOffset = 2;
                else if (cleaned.includes('周一') || cleaned.includes('下周一')) dateOffset = 1;
                else if (cleaned.includes('周二')) dateOffset = 2;
                else if (cleaned.includes('周三')) dateOffset = 3;
                else if (cleaned.includes('周四')) dateOffset = 4;
                else if (cleaned.includes('周五')) dateOffset = 5;
                else if (cleaned.match(/\d+天/)) {
                    const match = cleaned.match(/(\d+)天/);
                    dateOffset = parseInt(match[1]);
                }

                if (dateOffset !== undefined) {
                    dueDate = new Date(Date.now() + dateOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                }

                // 判断分类
                let category = '其他';
                if (cleaned.match(/会议|电话|邮件|联系|沟通/)) category = '沟通';
                else if (cleaned.match(/代码|开发|编程|bug|测试|debug/)) category = '开发';
                else if (cleaned.match(/文档|报告|总结|文案|方案/)) category = '文档';
                else if (cleaned.match(/阅读|学习|培训|课程/)) category = '学习';
                else if (cleaned.match(/提交|审查|review|检查/)) category = '审查';
                else if (cleaned.match(/购买|订购|采购|订单/)) category = '采购';

                todos.push({
                    content: cleaned,
                    confidence: 0.8,
                    due_date: dueDate,
                    category: category
                });
            }
        }

        // 如果没有解析到任何待办，则原文本本身作为一个待办
        if (todos.length === 0) {
            todos.push({
                content: originalText.trim(),
                confidence: 0.6,
                category: '其他'
            });
        }

        return JSON.stringify(todos);
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

        const response = await callAI(preferredProvider, apiKey, prompt, text);
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