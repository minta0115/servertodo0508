import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DEFAULT_STRUCTURE = {
    '日常工作': ['客户经营', '过程与指标管理'],
    '个人学习': ['认证与体系化学习', '碎片化输入与补充学习'],
    '社交成长': ['社交成长'],
    '专项': ['专项']
};

const DEFAULT_KEYWORD_MAP = `客户 -> 日常工作/客户经营
合同 -> 日常工作/客户经营
报价 -> 日常工作/客户经营
方案 -> 日常工作/客户经营
会议 -> 日常工作/客户经营
FBL -> 日常工作/客户经营
指标 -> 日常工作/过程与指标管理
录屏 -> 个人学习/碎片化输入与补充学习
直播 -> 个人学习/碎片化输入与补充学习
课程 -> 个人学习/认证与体系化学习
考试 -> 个人学习/认证与体系化学习
学习 -> 个人学习/认证与体系化学习
社交 -> 社交成长/社交成长
朋友 -> 社交成长/社交成长
专项 -> 专项/专项`;

const AddTab = ({ isMobile = false, onAdded }) => {
    const [rawInput, setRawInput] = useState('');
    const [parsedResult, setParsedResult] = useState(null);
    const [parsedItems, setParsedItems] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 配置面板状态
    const [showConfig, setShowConfig] = useState(false);
    const [directionStructure, setDirectionStructure] = useState(DEFAULT_STRUCTURE);
    const [keywordMapText, setKeywordMapText] = useState(DEFAULT_KEYWORD_MAP);

    // 手动添加表单状态
    const [manualContent, setManualContent] = useState('');
    const [manualCategory, setManualCategory] = useState('其他');
    const [manualPriority, setManualPriority] = useState('中');
    const [manualDueDate, setManualDueDate] = useState('');
    const [manualDirection, setManualDirection] = useState('日常工作');
    const [manualSubCategory, setManualSubCategory] = useState('客户经营');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = () => {
        try {
            const saved = localStorage.getItem('todo_direction_config');
            if (saved) {
                const config = JSON.parse(saved);
                if (config.structure) setDirectionStructure(config.structure);
                if (config.keywordMap) setKeywordMapText(config.keywordMap);
            }
        } catch (e) {
            console.log('Using default config');
        }
    };

    const saveConfig = () => {
        try {
            localStorage.setItem('todo_direction_config', JSON.stringify({
                structure: directionStructure,
                keywordMap: keywordMapText
            }));
            setError('✅ 配置已保存');
            setTimeout(() => setError(null), 2000);
        } catch (e) {
            setError('❌ 保存失败');
        }
    };

    // 解析关键词映射
    const parseKeywordMap = () => {
        const map = {};
        keywordMapText.split('\n').forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;
            const [keywords, direction] = line.split('->').map(s => s.trim());
            if (keywords && direction) {
                const [dir, sub] = direction.split('/').map(s => s.trim());
                keywords.split(',').forEach(kw => {
                    kw = kw.trim();
                    if (kw) map[kw] = { direction: dir || '其他', subCategory: sub || '其他' };
                });
            }
        });
        return map;
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

    // 解析单个任务的方向/子类
    const inferDirection = (text) => {
        const kwMap = parseKeywordMap();
        const lower = text.toLowerCase();

        for (const [keyword, mapping] of Object.entries(kwMap)) {
            if (lower.includes(keyword.toLowerCase())) {
                return mapping;
            }
        }

        // 默认分类逻辑
        if (lower.match(/客户|合同|报价|方案|会议|FBL/)) {
            return { direction: '日常工作', subCategory: '客户经营' };
        }
        if (lower.match(/指标|录入|看板|dashboard/)) {
            return { direction: '日常工作', subCategory: '过程与指标管理' };
        }
        if (lower.match(/课程|考试|认证|学习/)) {
            return { direction: '个人学习', subCategory: '认证与体系化学习' };
        }
        if (lower.match(/录屏|直播|碎片/)) {
            return { direction: '个人学习', subCategory: '碎片化输入与补充学习' };
        }
        if (lower.match(/社交|朋友|人脉/)) {
            return { direction: '社交成长', subCategory: '社交成长' };
        }
        if (lower.match(/专项/)) {
            return { direction: '专项', subCategory: '专项' };
        }

        return { direction: '其他', subCategory: '其他' };
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
                    const dirInfo = inferDirection(cmd.content);
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dueStr = tomorrow.toISOString().slice(0, 10);
                    await api.post('/todos/direct', {
                        content: cmd.content,
                        category: '其他',
                        direction: dirInfo.direction,
                        subCategory: dirInfo.subCategory,
                        due_date: dueStr
                    });
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
            const result = response.data.result;
            setParsedResult(result);

            // 解析结果，每条可调整方向/子类
            const lines = result.split('\n').filter(l => l.trim());
            const items = [];

            lines.forEach(line => {
                // 匹配格式: 序号. 【分类】任务名 或 序号. 任务名
                const match = line.match(/^(\d+)\.\s*(?:【(.+?)】)?(.+)/);
                if (match) {
                    const content = match[3].trim();
                    const dirInfo = inferDirection(content);
                    items.push({
                        content,
                        direction: dirInfo.direction,
                        subCategory: dirInfo.subCategory,
                        category: match[2] || '其他'
                    });
                }
            });

            setParsedItems(items);
            setShowResult(true);
        } catch (err) {
            setError('解析失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    // 更新单条的方向/子类
    const updateItemDirection = (index, direction, subCategory) => {
        setParsedItems(prev => prev.map((item, i) =>
            i === index ? { ...item, direction, subCategory } : item
        ));
    };

    // 删除单条
    const removeItem = (index) => {
        setParsedItems(prev => prev.filter((_, i) => i !== index));
    };

    // 确认添加
    const handleConfirm = async () => {
        if (parsedItems.length === 0 && !parsedResult?.trim()) return;

        setLoading(true);
        try {
            if (parsedItems.length > 0) {
                // 批量添加带方向/子类的待办
                await api.post('/todos/batch', {
                    todos: parsedItems.map(item => ({
                        content: item.content,
                        category: item.category || '其他',
                        direction: item.direction || '其他',
                        subCategory: item.subCategory || '其他',
                        priority: '中',
                        dueDate: null
                    }))
                });
            } else {
                // 整个作为单个待办添加
                const dirInfo = inferDirection(parsedResult);
                await api.post('/todos/direct', {
                    content: parsedResult.substring(0, 200),
                    category: '其他',
                    direction: dirInfo.direction,
                    subCategory: dirInfo.subCategory
                });
            }

            setRawInput('');
            setParsedResult(null);
            setParsedItems([]);
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
                due_date: manualDueDate || null,
                direction: manualDirection,
                subCategory: manualSubCategory
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

    const getSubCategories = (direction) => {
        return directionStructure[direction] || ['其他'];
    };

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }}>
            {/* 配置面板 */}
            <div style={{
                background: '#fff9e6',
                borderRadius: isMobile ? '12px' : '14px',
                marginBottom: isMobile ? '10px' : '14px',
                overflow: 'hidden'
            }}>
                <div
                    onClick={() => setShowConfig(!showConfig)}
                    style={{
                        padding: isMobile ? '10px 14px' : '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: isMobile ? '13px' : '14px'
                    }}
                >
                    <span>⚙️ 分类设置</span>
                    <span>{showConfig ? '▲ 收起' : '▼ 展开'}</span>
                </div>

                {showConfig && (
                    <div style={{ padding: isMobile ? '10px 14px' : '12px 16px', borderTop: '1px solid #e9ecf2' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                                方向及子类（格式：方向: 子类1, 子类2）
                            </label>
                            <textarea
                                value={Object.entries(directionStructure).map(([dir, subs]) =>
                                    `${dir}: ${subs.join(', ')}`
                                ).join('\n')}
                                onChange={(e) => {
                                    const newStructure = {};
                                    e.target.value.split('\n').forEach(line => {
                                        const [dir, subs] = line.split(':').map(s => s.trim());
                                        if (dir && subs) {
                                            newStructure[dir] = subs.split(',').map(s => s.trim());
                                        }
                                    });
                                    setDirectionStructure(newStructure);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                    fontFamily: 'inherit',
                                    minHeight: '80px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                                关键词映射（格式：关键词 -> 方向/子类，每行一条）
                            </label>
                            <textarea
                                value={keywordMapText}
                                onChange={(e) => setKeywordMapText(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                    fontFamily: 'inherit',
                                    minHeight: '100px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <button
                            onClick={saveConfig}
                            style={{
                                padding: '8px 16px',
                                background: '#4f6af5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            💾 保存配置
                        </button>
                    </div>
                )}
            </div>

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

            {/* AI解析结果 - 增强版 */}
            {showResult && (
                <div style={{
                    background: '#f8fafc',
                    borderRadius: isMobile ? '12px' : '14px',
                    padding: isMobile ? '12px' : '16px',
                    marginBottom: isMobile ? '10px' : '16px',
                    maxHeight: isMobile ? '350px' : '450px',
                    overflow: 'auto'
                }}>
                    <div style={{
                        marginBottom: '10px',
                        fontWeight: '600',
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#1e293b'
                    }}>
                        📋 AI 解析结果（共 {parsedItems.length} 项）：
                    </div>

                    {/* 解析后的任务列表（可调整方向/子类） */}
                    {parsedItems.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                            {parsedItems.map((item, index) => (
                                <div key={index} style={{
                                    background: 'white',
                                    borderRadius: '10px',
                                    padding: '10px 12px',
                                    border: '1px solid #e9ecf2'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{ fontSize: '12px', color: '#4f6af5', fontWeight: '600' }}>
                                            {index + 1}.
                                        </span>
                                        <button
                                            onClick={() => removeItem(index)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#fc8181',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                padding: '0 4px'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                                        {item.content}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        <select
                                            value={item.direction}
                                            onChange={(e) => {
                                                const newDir = e.target.value;
                                                const subs = getSubCategories(newDir);
                                                updateItemDirection(index, newDir, subs[0]);
                                            }}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '11px',
                                                background: '#eef2ff',
                                                color: '#4f6af5'
                                            }}
                                        >
                                            {Object.keys(directionStructure).map(dir => (
                                                <option key={dir} value={dir}>{dir}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={item.subCategory}
                                            onChange={(e) => updateItemDirection(index, item.direction, e.target.value)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '11px',
                                                background: '#f0fff4',
                                                color: '#38a169'
                                            }}
                                        >
                                            {getSubCategories(item.direction).map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : parsedResult ? (
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
                    ) : null}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                            onClick={() => { setShowResult(false); setParsedResult(null); setParsedItems([]); }}
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
                            disabled={loading || (parsedItems.length === 0 && !parsedResult?.trim())}
                            style={{
                                flex: 1,
                                padding: '8px 16px',
                                background: (loading || (parsedItems.length === 0 && !parsedResult?.trim())) ? '#a0aec0' : '#38a169',
                                border: 'none',
                                borderRadius: '20px',
                                color: 'white',
                                fontSize: '13px',
                                cursor: (loading || (parsedItems.length === 0 && !parsedResult?.trim())) ? 'not-allowed' : 'pointer'
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
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                    gap: isMobile ? '8px' : '10px',
                    marginBottom: isMobile ? '8px' : '10px'
                }}>
                    <select
                        value={manualDirection}
                        onChange={(e) => {
                            setManualDirection(e.target.value);
                            setManualSubCategory(getSubCategories(e.target.value)[0]);
                        }}
                        style={{
                            padding: '10px',
                            borderRadius: isMobile ? '12px' : '14px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px'
                        }}
                    >
                        {Object.keys(directionStructure).map(dir => (
                            <option key={dir} value={dir}>{dir}</option>
                        ))}
                    </select>
                    <select
                        value={manualSubCategory}
                        onChange={(e) => setManualSubCategory(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: isMobile ? '12px' : '14px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px'
                        }}
                    >
                        {getSubCategories(manualDirection).map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
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
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
                    gap: isMobile ? '8px' : '10px',
                    marginBottom: isMobile ? '8px' : '10px'
                }}>
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