const axios = require('axios');

const DEFAULT_NVIDIA_KEY = process.env.DEFAULT_NVIDIA_API_KEY || 'nvapi-test-key';
const DEFAULT_MINIMAX_KEY = process.env.DEFAULT_MINIMAX_API_KEY || 'mm-test-key';
const SYSTEM_PROMPT = process.env.AI_PARSE_SYSTEM_PROMPT || '';
const INPUT_PREFIX = process.env.AI_PARSE_INPUT_PREFIX || '';
const TEXT_FORMAT_PROMPT = `你是一个智能待办解析器。每次用户发送一段杂乱、口语化的任务描述，你必须严格按照以下规则输出：

【原则】
1. 输出纯文字，用序号，绝对不用表格。
2. 自动分类（如：客户工作、录屏学习、AI考试，工作事务等，根据内容灵活命名）。
3. 模糊任务拆解为具体可执行步骤（每个大任务下给出① ② ③...）。
4. 标注优先级（高/中/低）或按紧急程度排序，必要时预估时间（单位：分钟或小时）。
5. 支持用户后续调整，但本次输出不需要询问调整，只需输出清单本身。
6. 当用户明确说"完成某任务"时，需将其移入"已完成"区域（本次忽略，等待后续指令）。

【输出格式要求】
- 直接输出整理后的清单，不要输出任何开场白、解释或额外提问。
- 每个任务格式如下：
  序号. 【分类】任务名称
    - 优先级：X
    - 预估时间：XX分钟/小时
    - 拆解步骤：
      ① ...
      ② ...
  如果分类下有多个任务，用连续序号。

【分类建议】
- 客户工作：客户相关、合同、报价、方案、会议、FBL场景等
- 学习类：直播、课程、考试、录屏、指标学习等
- 工具类：软件优化、脚本、自动化、看板等
- 生活类：运动、健身、买菜、做饭等

现在解析以下内容：`;

function detectProvider(apiKey) {
    if (!apiKey) return 'nvidia';
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

async function callAIWithPrompt(provider, apiKey, systemPrompt, userText) {
    if (provider === 'nvidia') {
        try {
            const response = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
                model: MODEL_MAP.nvidia,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userText }
                ],
                max_tokens: 2048,
                temperature: 0.3
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
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userText }
                ],
                max_tokens: 2048
            }, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('MiniMax AI error:', error.message);
            throw error;
        }
    } else if (provider === 'kimi') {
        try {
            const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
                model: MODEL_MAP.kimi,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userText }
                ],
                max_tokens: 2048
            }, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Kimi AI error:', error.message);
            throw error;
        }
    }
    throw new Error('Unsupported provider');
}

async function parseTodosTextFormat(text, userId, db) {
    const settings = db?.userSettings?.[userId] || { preferred_provider: 'nvidia' };
    const preferredProvider = settings.preferred_provider || 'nvidia';

    const apiKeyRow = db?.userApiKeys?.[`${userId}_${preferredProvider}`];
    let apiKey = apiKeyRow?.api_key;

    if (!apiKey) {
        if (preferredProvider === 'minimax') {
            apiKey = DEFAULT_MINIMAX_KEY;
        } else {
            apiKey = DEFAULT_NVIDIA_KEY;
        }
    }

    if (!apiKey || apiKey === 'nvapi-test-key' || apiKey === 'mm-test-key') {
        // Fallback to simple parsing if no API key
        return '无法解析：缺少有效的 API Key，请联系管理员配置。';
    }

    try {
        const result = await callAIWithPrompt(preferredProvider, apiKey, TEXT_FORMAT_PROMPT, text);
        return result;
    } catch (error) {
        console.error('AI parsing error:', error);
        throw error;
    }
}

module.exports = { parseTodos, parseTodosTextFormat };
    // 如果没有有效的 apiKey，使用简单的智能解析作为 fallback
    if (!apiKey || apiKey === 'nvapi-test-key' || apiKey === 'mm-test-key' || apiKey === 'mmt-test-key') {
        console.log('Using smart parsing fallback (no valid API key)');
        // 智能解析逻辑
        const todos = [];
        // 尝试按句子分割，识别潜在待办
        // 按中文标点、空格、英文标点分割
        const sentences = originalText.split(/[。！？\n、，,；;\s]+/).filter(s => s.trim());

        for (const sentence of sentences) {
            const cleaned = sentence.trim();
            if (cleaned.length < 2) continue;

            // 跳过明显的无意义内容
            if (cleaned.match(/^[哈好哇嘻呵]+$/) || cleaned.length < 4) continue;

            // 尝试从文本中提取日期
            let dueDate = null;
            let dateOffset = null;

            if (cleaned.includes('今天')) dateOffset = 0;
            else if (cleaned.includes('明天')) dateOffset = 1;
            else if (cleaned.includes('后天')) dateOffset = 2;
            else if (cleaned.includes('下周一')) dateOffset = 7;
            else if (cleaned.includes('下周二')) dateOffset = 8;
            else if (cleaned.includes('下周三')) dateOffset = 9;
            else if (cleaned.includes('下周四')) dateOffset = 10;
            else if (cleaned.includes('下周五')) dateOffset = 11;
            else if (cleaned.match(/(\d+)天/)) {
                const match = cleaned.match(/(\d+)天/);
                dateOffset = parseInt(match[1]);
            }

            if (dateOffset !== null) {
                const d = new Date();
                d.setDate(d.getDate() + dateOffset);
                dueDate = d.toISOString().split('T')[0];
            }

            // 判断分类
            let category = '其他';
            const lowerCleaned = cleaned.toLowerCase();
            if (lowerCleaned.match(/会议|电话|邮件|联系|沟通|回复|发送/)) category = '沟通';
            else if (lowerCleaned.match(/代码|开发|编程|bug|测试|debug|程序|软件/)) category = '开发';
            else if (lowerCleaned.match(/文档|报告|总结|文案|方案|写/)) category = '文档';
            else if (lowerCleaned.match(/阅读|学习|培训|课程|读书|看书/)) category = '学习';
            else if (lowerCleaned.match(/提交|审查|review|检查|审核/)) category = '审查';
            else if (lowerCleaned.match(/购买|订购|采购|订单|买/)) category = '采购';
            else if (lowerCleaned.match(/运动|跑步|健身|锻炼|打球/)) category = '健康';
            else if (lowerCleaned.match(/游戏|玩|娱乐/)) category = '娱乐';

            // 提取动词短语作为待办内容
            let content = cleaned;
            // 去掉句首的语气词
            content = content.replace(/^[哈好哇嘻呵嗯]+/, '');
            // 规范化空格
            content = content.replace(/\s+/g, ' ').trim();

            if (content.length >= 2) {
                todos.push({
                    content: content,
                    confidence: 0.7,
                    due_date: dueDate,
                    category: category
                });
            }
        }

        // 如果没有解析到任何待办，尝试从原文中提取动词短语
        if (todos.length === 0) {
            // 尝试匹配常见待办模式
            const patterns = [
                /([一-龥]{2,20}(?:程序|代码|文档|报告|邮件|电话|会议|任务|事情))/g,
                /((?:写|做|完成|准备|检查|提交|发送|回复|购买|学习|读书|运动|玩)[一-龥]{0,30})/g,
            ];

            let found = false;
            for (const pattern of patterns) {
                const matches = originalText.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const trimmed = match.trim();
                        if (trimmed.length >= 4) {
                            todos.push({
                                content: trimmed,
                                confidence: 0.6,
                                due_date: null,
                                category: '其他'
                            });
                            found = true;
                        }
                    }
                }
            }

            // 如果还是没找到，返回空数组让用户重新输入
            if (!found) {
                return JSON.stringify([]);
            }
        }

        return JSON.stringify(todos);
    }

    // 真正的 AI 调用
    let aiPrompt;
    if (SYSTEM_PROMPT) {
        // 使用系统级指令配置
        aiPrompt = `${INPUT_PREFIX}${SYSTEM_PROMPT}\n\n用户输入：${originalText}`;
    } else {
        // 默认 prompt
        aiPrompt = `你是一个待办事项提取助手。请仔细分析以下文本，找出所有隐藏的待办事项，并将其拆分成独立的、清晰的待办项。

要求：
1. 识别文本中所有隐含的待办任务
2. 每个待办事项要表达清晰，去除口语化表达
3. 如果文本中没有明确的待办，返回空数组 []
4. 返回格式必须是严格的JSON数组

文本：${originalText}

返回格式示例：
[{"content": "写一个AI程序", "confidence": 0.9, "due_date": "2026-05-10", "category": "开发"}, {"content": "晚上玩一会儿电脑", "confidence": 0.8, "due_date": "2026-05-08", "category": "娱乐"}]`;
    }

    if (provider === 'nvidia') {
        try {
            const response = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
                model: MODEL_MAP.nvidia,
                messages: [{ role: 'user', content: aiPrompt }],
                max_tokens: 1024,
                temperature: 0.3
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
                messages: [{ role: 'user', content: aiPrompt }],
                max_tokens: 1024
            }, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('MiniMax AI error:', error.message);
            throw error;
        }
    } else if (provider === 'kimi') {
        try {
            const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
                model: MODEL_MAP.kimi,
                messages: [{ role: 'user', content: aiPrompt }],
                max_tokens: 1024
            }, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Kimi AI error:', error.message);
            throw error;
        }
    }
    throw new Error('Unsupported provider');
}

async function parseTodos(text, userId, db, shouldSave = true) {
    try {
        // 从 db 参数获取设置（如果提供）
        const settings = db?.userSettings?.[userId] || { preferred_provider: 'nvidia' };
        const preferredProvider = settings.preferred_provider || 'nvidia';

        const apiKeyRow = db?.userApiKeys?.[`${userId}_${preferredProvider}`];
        let apiKey = apiKeyRow?.api_key;

        if (!apiKey) {
            // 优先使用环境变量中的真实 API Key
            if (preferredProvider === 'minimax') {
                apiKey = DEFAULT_MINIMAX_KEY;
            } else {
                apiKey = DEFAULT_NVIDIA_KEY;
            }
        }

        console.log(`Parsing todos for user ${userId} with provider ${preferredProvider}`);

        const response = await callAI(preferredProvider, apiKey, null, text);
        let todos = [];

        try {
            todos = JSON.parse(response);
        } catch (e) {
            // If AI response is not valid JSON, try to extract it
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    todos = JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    console.error('Failed to parse AI response as JSON:', response);
                    return [];
                }
            } else {
                console.error('No JSON array found in AI response:', response);
                return [];
            }
        }

        // Validate todos array
        if (!Array.isArray(todos)) {
            console.error('AI response is not an array:', todos);
            return [];
        }

        console.log(`Parsed ${todos.length} todos`);

        // Only save if shouldSave is true
        if (shouldSave && todos.length > 0) {
            let nextId = db.todos.length > 0 ? Math.max(...db.todos.map(t => t.id)) + 1 : 1;

            for (const todo of todos) {
                if (!todo.content) continue;

                db.todos.push({
                    id: nextId++,
                    user_id: userId,
                    content: todo.content,
                    category: todo.category || '其他',
                    due_date: todo.due_date || null,
                    source: 'ai',
                    completed: 0,
                    created_at: new Date().toISOString(),
                    completed_at: null
                });
            }
            console.log(`Saved ${todos.length} todos for user ${userId}`);
        }

        return todos;
    } catch (error) {
        console.error('Error parsing todos:', error);
        throw error;
    }
}

module.exports = { parseTodos };
