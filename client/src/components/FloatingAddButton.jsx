import React, { useState } from 'react';
import api from '../services/api';

const FloatingAddButton = () => {
    const [showModal, setShowModal] = useState(false);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('direct'); // 'direct' 或 'ai'
    const [category, setCategory] = useState('其他');
    const [dueDate, setDueDate] = useState('');

    const handleAddTodo = async () => {
        if (!text.trim()) {
            setError('请输入待办内容');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            if (mode === 'direct') {
                // 直接添加模式
                await api.post('/todos/direct', {
                    content: text,
                    category: category,
                    due_date: dueDate || null
                });
            } else {
                // AI解析模式
                await api.post('/todos/parse', { text });
            }
            setText('');
            setCategory('其他');
            setDueDate('');
            setShowModal(false);
            // Refresh todos
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err) {
            setError('添加失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    return (
        <>
            {/* 浮动按钮 */}
            <button onClick={() => setShowModal(true)} style={{
                position: 'fixed',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
                color: 'white',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(56, 161, 105, 0.4)',
                transition: 'all 0.3s',
                zIndex: 999
            }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1) translateX(-50%)';
                    e.target.style.boxShadow = '0 6px 20px rgba(56, 161, 105, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateX(-50%)';
                    e.target.style.boxShadow = '0 4px 12px rgba(56, 161, 105, 0.4)';
                }}>
                ➕
            </button>

            {/* 模态框背景 */}
            {showModal && (
                <div onClick={() => setShowModal(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* 模态框内容 */}
                    <div onClick={(e) => e.stopPropagation()} style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '450px',
                        width: '90%',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                    }}>
                        <h2 style={{ marginTop: 0, color: '#2d3748', marginBottom: '16px' }}>
                            ➕ 添加待办事项
                        </h2>

                        {/* 模式切换标签页 */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>
                            <button
                                onClick={() => { setMode('direct'); setError(null); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: mode === 'direct' ? '#38a169' : 'transparent',
                                    color: mode === 'direct' ? 'white' : '#2d3748',
                                    border: 'none',
                                    borderRadius: '8px 8px 0 0',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                ✏️ 直接添加
                            </button>
                            <button
                                onClick={() => { setMode('ai'); setError(null); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: mode === 'ai' ? '#38a169' : 'transparent',
                                    color: mode === 'ai' ? 'white' : '#2d3748',
                                    border: 'none',
                                    borderRadius: '8px 8px 0 0',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                🤖 AI解析
                            </button>
                        </div>

                        {/* 直接添加模式 */}
                        {mode === 'direct' && (
                            <>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="输入待办内容..."
                                    rows={3}
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        fontFamily: 'inherit',
                                        marginBottom: '12px',
                                        resize: 'none'
                                    }}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <option>其他</option>
                                        <option>工作</option>
                                        <option>学习</option>
                                        <option>生活</option>
                                        <option>健康</option>
                                        <option>开发</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        {/* AI解析模式 */}
                        {mode === 'ai' && (
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="输入待办相关文本，AI会自动提取待办事项..."
                                rows={4}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit',
                                    marginBottom: '12px',
                                    resize: 'none'
                                }}
                            />
                        )}

                        {error && (
                            <div style={{
                                background: '#fed7d7',
                                color: '#c53030',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '12px',
                                fontSize: '14px'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowModal(false)} style={{
                                background: '#cbd5e0',
                                color: '#2d3748',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                取消
                            </button>
                            <button onClick={handleAddTodo} disabled={loading} style={{
                                background: loading ? '#a0aec0' : '#38a169',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 20px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                {loading ? '⏳ 添加中...' : '✅ 添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingAddButton;
