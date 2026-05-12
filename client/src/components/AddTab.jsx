import React, { useState } from 'react';
import api from '../services/api';

const AddTab = ({ isMobile = false, onAdded }) => {
    const [rawInput, setRawInput] = useState('');
    const [parsedResult, setParsedResult] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 手动添加表单状态
    const [manualContent, setManualContent] = useState('');
    const [manualCategory, setManualCategory] = useState('其他');
    const [manualPriority, setManualPriority] = useState('中');
    const [manualDueDate, setManualDueDate] = useState('');

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

    // 处理输入
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
                        await api.delete(`/todos/${found.id}`);
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

        // 调用AI解析接口
        setLoading(true);
        try {
            const response = await api.post('/todos/parse-text', { text: raw });
            setParsedResult(response.data.result);
            setShowResult(true);
        } catch (err) {
            setError('解析失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    // 确认添加 - 简单处理所有内容为单个待办
    const handleConfirm = async () => {
        if (!parsedResult || !parsedResult.trim()) return;

        setLoading(true);
        try {
            // 提取解析结果中的任务内容，生成简单待办
            const lines = parsedResult.split('\n').filter(l => l.trim());
            const todoContents = [];

            lines.forEach(line => {
                // 匹配序号行如 "1. 【分类】任务名"
                const match = line.match(/^\d+\.\s*【(.+?)】(.+)/);
                if (match) {
                    todoContents.push({
                        content: match[2].trim(),
                        category: match[1]
                    });
                }
            });

            if (todoContents.length > 0) {
                await api.post('/todos/batch', {
                    todos: todoContents.map(t => ({
                        content: t.content,
                        category: t.category || '其他',
                        priority: '中',
                        dueDate: null
                    }))
                });
            } else {
                // 如果没匹配到格式，整个作为待办添加
                await api.post('/todos/direct', {
                    content: parsedResult.substring(0, 200),
                    category: '其他'
                });
            }

            setRawInput('');
            setParsedResult(null);
            setShowResult(false);
            setError('✅ 已添加待办');
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
                placeholder={"输入待办描述，例如：\n下午做两个事情，第一个是指标数的跟进和录入，第二个是绘制看板，第三个是面向华力微电子的FBL场景和价值设计\n\n或输入指令：\n完成 某任务\n删除 某任务\n增加 新任务"}
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
                {loading ? '⏳ AI解析中...' : '🤖 AI智能解析'}
            </button>

            {/* AI解析结果 */}
            {showResult && parsedResult && (
                <div style={{
                    background: '#f8fafc',
                    borderRadius: isMobile ? '12px' : '14px',
                    padding: isMobile ? '12px' : '16px',
                    marginBottom: isMobile ? '10px' : '16px',
                    maxHeight: isMobile ? '300px' : '400px',
                    overflow: 'auto'
                }}>
                    <div style={{
                        marginBottom: '10px',
                        fontWeight: '600',
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#1e293b'
                    }}>
                        📋 AI 解析结果：
                    </div>
                    <pre style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: isMobile ? '12px' : '13px',
                        lineHeight: '1.6',
                        color: '#334155',
                        fontFamily: 'inherit',
                        margin: 0,
                        padding: '10px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e9ecf2'
                    }}>
                        {parsedResult}
                    </pre>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                            onClick={() => { setShowResult(false); setParsedResult(null); }}
                            style={{
                                flex: 1,
                                padding: '8px 16px',
                                background: '#e2e8f0',
                                border: 'none',
                                borderRadius: '20px',
                                color: '#475569',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            重新输入
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '8px 16px',
                                background: '#38a169',
                                border: 'none',
                                borderRadius: '20px',
                                color: 'white',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            ✅ 确认添加
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div style={{
                    background: error.startsWith('✅') || error.startsWith('➕') || error.startsWith('✏️') || error.startsWith('🗑') ? '#c6f6d5' : '#fed7d7',
                    color: error.startsWith('✅') || error.startsWith('➕') || error.startsWith('✏️') || error.startsWith('🗑') ? '#22543d' : '#c53030',
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