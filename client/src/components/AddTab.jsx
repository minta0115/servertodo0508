import React, { useState } from 'react';
import api from '../services/api';

const AddTab = ({ isMobile = false, onAdded }) => {
    const [rawInput, setRawInput] = useState('');
    const [parsedTodos, setParsedTodos] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 手动添加表单状态
    const [manualContent, setManualContent] = useState('');
    const [manualCategory, setManualCategory] = useState('其他');
    const [manualPriority, setManualPriority] = useState('中');
    const [manualDueDate, setManualDueDate] = useState('');

    // 智能解析引擎 - 客户端本地解析
    const parseAdvancedInput = (raw) => {
        const draftSegments = raw.split(/[。；\n]+/).filter(s => s.trim()).map(s => s.trim());
        const structuredTasks = [];

        const tomorrowStr = () => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
        };

        draftSegments.forEach(seg => {
            if (/^[✅✔️]/.test(seg) || /^(完成|done)[：: ]/i.test(seg)) return;

            let task = seg;
            let priority = '中';
            let category = null;
            let dueDate = null;

            // 优先级识别
            if (/尽快|立刻|马上|紧急|deadline|ddl/i.test(task)) priority = '高';
            else if (/不急|有空|低优先|优先级[较很]?低/.test(task)) priority = '低';

            const now = new Date();

            // 日期识别
            if (/今天/.test(task)) dueDate = now.toISOString().slice(0, 10);
            else if (/明天/.test(task)) dueDate = tomorrowStr();
            else if (/后天/.test(task)) {
                const d = new Date(); d.setDate(d.getDate() + 2); dueDate = d.toISOString().slice(0, 10);
            } else if (/周(一|二|三|四|五|六|日|天)/.test(task)) {
                const map = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7 };
                const match = task.match(/周(一|二|三|四|五|六|日|天)/);
                if (match) {
                    const targetDay = map[match[1]];
                    const today = now.getDay() || 7;
                    let diff = targetDay - today;
                    if (diff <= 0) diff += 7;
                    const d = new Date(); d.setDate(d.getDate() + diff); dueDate = d.toISOString().slice(0, 10);
                }
            } else if (/周三前/.test(task)) {
                const today = now.getDay() || 7;
                let target = 3;
                let diff = target - today;
                if (diff < 0) diff += 7;
                const d = new Date(); d.setDate(d.getDate() + diff); dueDate = d.toISOString().slice(0, 10);
            } else if (/(\d{1,2})月(\d{1,2})[日号]/.test(task)) {
                const match = task.match(/(\d{1,2})月(\d{1,2})[日号]/);
                if (match) {
                    const month = parseInt(match[1]), day = parseInt(match[2]);
                    const year = now.getFullYear();
                    const d = new Date(year, month - 1, day);
                    dueDate = d.toISOString().slice(0, 10);
                }
            }

            // 分类识别
            if (/客户|盘点|跟进|合同|报价|方案|会议|汇报|周报|邮件|电气|人才服务/.test(task)) category = '工作';
            else if (/直播|课程|学习|考试|阅读|书|AI考试|录屏|教程|录播|CSM/.test(task)) category = '学习';
            else if (/龙虾|工具|优化|软件|app|脚本|自动化/.test(task)) category = '工具';
            else if (/运动|健身|跑步|瑜伽|体检|买菜|做饭|打扫/.test(task)) category = '生活';
            else category = '其他';

            // 清理内容
            let content = task
                .replace(/尽快|立刻|马上|紧急|不急|有空|低优先|优先级[较很]?低/g, '')
                .replace(/今天|明天|后天|周[一二三四五六日天]|周三前|下周一/g, '')
                .replace(/\d{1,2}月\d{1,2}[日号]/g, '')
                .replace(/[，,。、\s]+/g, ' ')
                .trim();

            if (!content) content = '未命名任务';

            structuredTasks.push({
                content,
                category,
                priority,
                dueDate: dueDate || tomorrowStr()
            });
        });

        return { draft: draftSegments, structured: structuredTasks };
    };

    // 命令检测
    const detectCommand = (text) => {
        const lower = text.trim().toLowerCase();
        if (/^(完成|done)[：: ]/i.test(lower)) {
            const taskHint = text.replace(/^(完成|done)[：: ]*/i, '').trim();
            return { action: 'complete', target: taskHint };
        }
        if (/^(删除|remove|delete)[：: ]/i.test(lower)) {
            const taskHint = text.replace(/^(删除|remove|delete)[：: ]*/i, '').trim();
            return { action: 'delete', target: taskHint };
        }
        if (/^(增加|add|新增)[：: ]/i.test(lower)) {
            const content = text.replace(/^(增加|add|新增)[：: ]*/i, '').trim();
            return { action: 'add', content };
        }
        if (/^(修改|update)[：: ]/i.test(lower)) {
            const parts = text.replace(/^(修改|update)[：: ]*/i, '').split(/为|改成/);
            if (parts.length >= 2) {
                return { action: 'update', old: parts[0].trim(), new: parts[1].trim() };
            }
        }
        return null;
    };

    // 链接格式化
    const linkify = (text) => {
        return text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
    };

    const handleProcess = async () => {
        const raw = rawInput.trim();
        if (!raw) return;

        setError(null);

        // 检测命令
        const cmd = detectCommand(raw);
        if (cmd) {
            setLoading(true);
            try {
                if (cmd.action === 'complete') {
                    const response = await api.get('/todos');
                    const todos = response.data || [];
                    const found = todos.find(t => t.content.includes(cmd.target) || cmd.target.includes(t.content));
                    if (found) {
                        await api.put(`/todos/${found.id}`, { completed: true });
                        setRawInput('');
                        setError('✅ 已完成「' + found.content + '」');
                        if (onAdded) onAdded();
                    } else {
                        setError('⚠️ 未找到匹配的待办：' + cmd.target);
                    }
                } else if (cmd.action === 'delete') {
                    const response = await api.get('/todos');
                    const todos = response.data || [];
                    const found = todos.find(t => t.content.includes(cmd.target) || cmd.target.includes(t.content));
                    if (found) {
                        await api.put(`/todos/${found.id}`, { deleted: true });
                        setRawInput('');
                        setError('🗑 已删除「' + found.content + '」');
                        if (onAdded) onAdded();
                    } else {
                        setError('⚠️ 未找到匹配的待办：' + cmd.target);
                    }
                } else if (cmd.action === 'add') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dueStr = tomorrow.toISOString().slice(0, 10);
                    await api.post('/todos/direct', { content: cmd.content, category: '其他', due_date: dueStr });
                    setRawInput('');
                    setError('➕ 已添加「' + cmd.content + '」');
                    if (onAdded) onAdded();
                } else if (cmd.action === 'update') {
                    const response = await api.get('/todos');
                    const todos = response.data || [];
                    const found = todos.find(t => t.content.includes(cmd.old));
                    if (found) {
                        await api.put(`/todos/${found.id}`, { content: cmd.new });
                        setRawInput('');
                        setError('✏️ 已修改为「' + cmd.new + '」');
                        if (onAdded) onAdded();
                    } else {
                        setError('⚠️ 未找到待办：' + cmd.old);
                    }
                }
            } catch (err) {
                setError('操作失败：' + (err.response?.data?.message || err.message));
            }
            setLoading(false);
            return;
        }

        // 使用本地解析引擎解析
        const parsed = parseAdvancedInput(raw);
        setParsedTodos(parsed.structured);
        setShowResult(true);
    };

    const handleRemoveItem = (index) => {
        setParsedTodos(parsedTodos.filter((_, i) => i !== index));
    };

    const handleConfirm = async () => {
        if (parsedTodos.length === 0) return;
        setLoading(true);
        try {
            const response = await api.post('/todos/batch', { todos: parsedTodos });
            const addedCount = parsedTodos.length;
            const firstTodo = parsedTodos[0].content.substring(0, 15);
            setRawInput('');
            setParsedTodos([]);
            setShowResult(false);
            setError(`✅ 已添加「${firstTodo}...」等${addedCount}项到清单`);
            if (onAdded) onAdded();
        } catch (err) {
            setError('添加失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const handleManualAdd = async () => {
        if (!manualContent.trim()) return;
        setLoading(true);
        try {
            await api.post('/todos/direct', {
                content: manualContent,
                category: manualCategory,
                priority: manualPriority,
                due_date: manualDueDate || null
            });
            setManualContent('');
            setManualDueDate('');
            setError('✅ 已添加');
            if (onAdded) onAdded();
        } catch (err) {
            setError('添加失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const tomorrowStr = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    };

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }}>
            {/* 标题 */}
            <div style={{
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: '650',
                marginBottom: isMobile ? '10px' : '14px',
                color: '#1e293b'
            }}>
                ➕ 添加待办 · 支持对话指令
            </div>

            {/* 输入框 */}
            <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={"可输入口语化待办，也可输入指令。如：\n完成 档案录屏\n删除 优化龙虾\n增加 今晚买牛奶\n修改 开会 为 和客户开视频会\n或直接粘贴一大堆待办事项"}
                rows={isMobile ? 5 : 6}
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: isMobile ? '14px' : '16px',
                    border: '1px solid #e2e8f0',
                    fontSize: isMobile ? '13px' : '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    marginBottom: isMobile ? '8px' : '12px',
                    resize: 'vertical'
                }}
            />

            <button
                onClick={handleProcess}
                disabled={loading}
                style={{
                    width: '100%',
                    padding: isMobile ? '10px' : '12px 20px',
                    background: loading ? '#a0aec0' : '#4f6af5',
                    color: 'white',
                    border: 'none',
                    borderRadius: isMobile ? '20px' : '24px',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: isMobile ? '10px' : '16px'
                }}
            >
                {loading ? '⏳ 处理中...' : '🔍 智能处理'}
            </button>

            {/* 解析结果 */}
            {showResult && parsedTodos.length > 0 && (
                <div style={{
                    background: '#f8fafc',
                    borderRadius: isMobile ? '12px' : '14px',
                    padding: isMobile ? '12px' : '16px',
                    marginBottom: isMobile ? '10px' : '16px'
                }}>
                    <div style={{ marginBottom: '8px', fontWeight: '600', fontSize: isMobile ? '13px' : '14px' }}>
                        📋 结构化清单：
                    </div>
                    {parsedTodos.map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: idx < parsedTodos.length - 1 ? '1px solid #e9ecf2' : 'none'
                        }}>
                            <div
                                style={{
                                    flex: 1,
                                    fontSize: isMobile ? '13px' : '14px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}
                                dangerouslySetInnerHTML={{ __html: linkify(item.content) }}
                            />
                            <div style={{
                                marginLeft: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <span style={{
                                    fontSize: '11px',
                                    color: '#64748b',
                                    marginRight: '8px'
                                }}>
                                    {item.category} · {item.priority} · {item.dueDate || '明天'}
                                </span>
                                <button
                                    onClick={() => handleRemoveItem(idx)}
                                    style={{
                                        border: 'none',
                                        background: '#f1f5f9',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={handleConfirm}
                        disabled={loading || parsedTodos.length === 0}
                        style={{
                            marginTop: '8px',
                            padding: '8px 16px',
                            background: parsedTodos.length === 0 ? '#a0aec0' : '#38a169',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '13px',
                            cursor: parsedTodos.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ✅ 确认添加 {parsedTodos.length} 项
                    </button>
                </div>
            )}

            {error && (
                <div style={{
                    background: error.startsWith('✅') || error.startsWith('➕') || error.startsWith('✏️') ? '#c6f6d5' : '#fed7d7',
                    color: error.startsWith('✅') || error.startsWith('➕') || error.startsWith('✏️') ? '#22543d' : '#c53030',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: isMobile ? '10px' : '16px'
                }}>
                    🤖 {error}
                </div>
            )}

            {/* 手动添加表单 */}
            <div style={{
                borderTop: '0.5px solid #e9ecf2',
                paddingTop: isMobile ? '12px' : '16px',
                marginTop: isMobile ? '8px' : '16px'
            }}>
                <div style={{
                    fontWeight: '600',
                    marginBottom: isMobile ? '8px' : '10px',
                    fontSize: isMobile ? '14px' : '15px'
                }}>
                    📌 手动添加
                </div>
                <input
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="任务内容"
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: isMobile ? '12px' : '14px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        marginBottom: isMobile ? '8px' : '10px',
                        boxSizing: 'border-box'
                    }}
                />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
                    gap: isMobile ? '8px' : '10px',
                    marginBottom: isMobile ? '8px' : '10px'
                }}>
                    <select
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: isMobile ? '12px' : '14px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px'
                        }}
                    >
                        <option>其他</option>
                        <option>工作</option>
                        <option>学习</option>
                        <option>生活</option>
                        <option>工具</option>
                    </select>
                    <select
                        value={manualPriority}
                        onChange={(e) => setManualPriority(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: isMobile ? '12px' : '14px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px'
                        }}
                    >
                        <option value="高">高</option>
                        <option value="中">中</option>
                        <option value="低">低</option>
                    </select>
                    <input
                        type="date"
                        value={manualDueDate}
                        onChange={(e) => setManualDueDate(e.target.value)}
                        placeholder="截止日期"
                        style={{
                            padding: '10px',
                            borderRadius: isMobile ? '12px' : '14px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px'
                        }}
                    />
                </div>
                <button
                    onClick={handleManualAdd}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '10px 20px',
                        background: loading ? '#a0aec0' : '#4f6af5',
                        color: 'white',
                        border: 'none',
                        borderRadius: isMobile ? '20px' : '24px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? '⏳ 添加中...' : '📌 添加'}
                </button>
            </div>
        </div>
    );
};

export default AddTab;