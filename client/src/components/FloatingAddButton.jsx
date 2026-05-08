import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import api from '../services/api';

const FloatingAddButton = () => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 直接添加状态
    const [directText, setDirectText] = useState('');
    const [directCategory, setDirectCategory] = useState('其他');
    const [directDueDate, setDirectDueDate] = useState('');

    // AI解析状态
    const [aiText, setAiText] = useState('');
    const [parsedTodos, setParsedTodos] = useState([]);
    const [showAiResult, setShowAiResult] = useState(false);

    const handleClose = () => {
        setShowModal(false);
        setDirectText('');
        setDirectCategory('其他');
        setDirectDueDate('');
        setAiText('');
        setParsedTodos([]);
        setShowAiResult(false);
        setError(null);
    };

    // 直接添加
    const handleDirectAdd = async () => {
        if (!directText.trim()) {
            setError('请输入待办内容');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.post('/todos/direct', {
                content: directText,
                category: directCategory,
                due_date: directDueDate || null
            });
            handleClose();
            setTimeout(() => window.location.reload(), 300);
        } catch (err) {
            setError('添加失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    // AI解析
    const handleAiParse = async () => {
        if (!aiText.trim()) {
            setError('请输入待办内容');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/todos/parse', { text: aiText });
            const todos = response.data || [];
            if (todos.length === 0) {
                setError('未识别到任何待办事项，请尝试其他描述');
            } else {
                setParsedTodos(todos);
                setShowAiResult(true);
            }
        } catch (err) {
            setError('解析失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const handleDeleteAiTodo = (index) => {
        setParsedTodos(parsedTodos.filter((_, i) => i !== index));
    };

    const handleConfirmAiTodos = async () => {
        if (parsedTodos.length === 0) {
            setError('没有待办事项可添加');
            return;
        }
        setLoading(true);
        try {
            await api.post('/todos/batch', { todos: parsedTodos });
            handleClose();
            setTimeout(() => window.location.reload(), 300);
        } catch (err) {
            setError('添加失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    // 图片上传 OCR
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const worker = await createWorker('chi_sim');
            const { data: { text: ocrText } } = await worker.recognize(file);
            await worker.terminate();
            setAiText(ocrText);
        } catch (err) {
            setError('OCR识别失败：' + err.message);
        }
        setLoading(false);
    };

    return (
        <>
            {/* 浮动按钮 - 居中显示 */}
            <div style={{
                position: 'fixed',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999
            }}>
                <button onClick={() => setShowModal(true)} style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(56, 161, 105, 0.4)',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.boxShadow = '0 6px 20px rgba(56, 161, 105, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 12px rgba(56, 161, 105, 0.4)';
                    }}>
                    ✨
                </button>
            </div>

            {/* 模态框 */}
            {showModal && (
                <div onClick={handleClose} style={{
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
                    <div onClick={(e) => e.stopPropagation()} style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#2d3748' }}>✨ 添加待办</h2>

                        <Tabs activeTab={showAiResult ? 'ai' : 'direct'} onTabChange={() => {}} />

                        {/* AI解析结果页面 */}
                        {showAiResult ? (
                            <>
                                <h4 style={{ color: '#38a169', margin: '0 0 12px 0' }}>
                                    🤖 解析完成，共识别 <strong>{parsedTodos.length}</strong> 个代办
                                </h4>
                                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
                                    请确认以下待办事项，可以删除不需要的项：
                                </p>
                                <div style={{ marginBottom: '16px', maxHeight: '250px', overflowY: 'auto' }}>
                                    {parsedTodos.map((todo, index) => (
                                        <div key={index} style={{
                                            background: '#f7fafc',
                                            padding: '12px',
                                            marginBottom: '8px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>
                                                    {todo.content}
                                                </p>
                                                <div style={{ fontSize: '12px', color: '#718096' }}>
                                                    📁 {todo.category || '其他'} | 📅 {todo.due_date || '未设置'}
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteAiTodo(index)} style={{
                                                background: '#fc8181',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                marginLeft: '12px'
                                            }}>
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => { setShowAiResult(false); setParsedTodos([]); }} style={{
                                        background: '#cbd5e0',
                                        color: '#2d3748',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 20px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}>
                                        ✏️ 重新编辑
                                    </button>
                                    <button onClick={handleConfirmAiTodos} disabled={loading || parsedTodos.length === 0} style={{
                                        background: (loading || parsedTodos.length === 0) ? '#a0aec0' : '#38a169',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 20px',
                                        cursor: (loading || parsedTodos.length === 0) ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}>
                                        {loading ? '⏳...' : `✅ 确认添加 ${parsedTodos.length} 项`}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* 直接添加 */}
                                <textarea
                                    value={directText}
                                    onChange={(e) => setDirectText(e.target.value)}
                                    placeholder="直接输入待办内容..."
                                    rows={2}
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
                                        value={directCategory}
                                        onChange={(e) => setDirectCategory(e.target.value)}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '14px'
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
                                        value={directDueDate}
                                        onChange={(e) => setDirectDueDate(e.target.value)}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '20px' }}>
                                    <button
                                        onClick={handleDirectAdd}
                                        disabled={loading}
                                        style={{
                                            padding: '10px 24px',
                                            background: loading ? '#a0aec0' : '#38a169',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {loading ? '⏳...' : '✅ 直接添加'}
                                    </button>
                                </div>

                                {/* 分隔线 */}
                                <div style={{ borderTop: '1px dashed #e2e8f0', marginBottom: '20px' }} />

                                {/* AI解析 */}
                                <h4 style={{ margin: '0 0 12px 0', color: '#2d3748' }}>🤖 AI 智能解析</h4>
                                <textarea
                                    value={aiText}
                                    onChange={(e) => setAiText(e.target.value)}
                                    placeholder="输入待办相关文本，AI会自动提取待办事项..."
                                    rows={3}
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
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                    <label style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        background: '#f7fafc',
                                        border: '1px solid #cbd5e0',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}>
                                        📸 上传截图
                                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '20px' }}>
                                    <button
                                        onClick={handleAiParse}
                                        disabled={loading}
                                        style={{
                                            padding: '10px 24px',
                                            background: loading ? '#a0aec0' : '#38a169',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {loading ? '⏳ 解析中...' : '🔍 智能解析'}
                                    </button>
                                </div>

                                {/* 分隔线 */}
                                <div style={{ borderTop: '1px dashed #e2e8f0', marginBottom: '20px' }} />

                                {/* 其他代办来源 */}
                                <h4 style={{ margin: '0 0 12px 0', color: '#2d3748' }}>📥 其他代办来源</h4>
                                <p style={{ color: '#718096', fontSize: '13px', marginBottom: '16px' }}>
                                    点击以下按钮同步对应账号的待办事项（功能开发中）
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                    <button
                                        disabled
                                        style={{
                                            padding: '16px 12px',
                                            background: '#f7fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            cursor: 'not-allowed',
                                            fontSize: '14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <span style={{ fontSize: '24px' }}>💬</span>
                                        <span style={{ color: '#718096' }}>微信</span>
                                        <span style={{ fontSize: '10px', color: '#a0aec0' }}>开发中</span>
                                    </button>
                                    <button
                                        disabled
                                        style={{
                                            padding: '16px 12px',
                                            background: '#f7fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            cursor: 'not-allowed',
                                            fontSize: '14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <span style={{ fontSize: '24px' }}>🏢</span>
                                        <span style={{ color: '#718096' }}>企业微信</span>
                                        <span style={{ fontSize: '10px', color: '#a0aec0' }}>开发中</span>
                                    </button>
                                    <button
                                        disabled
                                        style={{
                                            padding: '16px 12px',
                                            background: '#f7fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            cursor: 'not-allowed',
                                            fontSize: '14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <span style={{ fontSize: '24px' }}>✈️</span>
                                        <span style={{ color: '#718096' }}>飞书</span>
                                        <span style={{ fontSize: '10px', color: '#a0aec0' }}>开发中</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {error && (
                            <div style={{
                                background: '#fed7d7',
                                color: '#c53030',
                                padding: '12px',
                                borderRadius: '8px',
                                marginTop: '16px',
                                fontSize: '14px'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button onClick={handleClose} style={{
                                background: '#cbd5e0',
                                color: '#2d3748',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 24px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}>
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// 简单的 Tabs 组件（占位）
const Tabs = ({ activeTab, onTabChange }) => null;

export default FloatingAddButton;
