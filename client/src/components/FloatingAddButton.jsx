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
    const [parsedTodos, setParsedTodos] = useState([]); // AI解析结果
    const [showConfirm, setShowConfirm] = useState(false); // 显示确认列表

    const handleParse = async () => {
        if (!text.trim()) {
            setError('请输入待办内容');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/todos/parse', { text });
            const todos = response.data || [];
            if (todos.length === 0) {
                setError('未识别到任何待办事项，请尝试其他描述');
                setLoading(false);
                return;
            }
            setParsedTodos(todos);
            setShowConfirm(true);
        } catch (err) {
            setError('解析失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const handleDeleteTodo = (index) => {
        setParsedTodos(parsedTodos.filter((_, i) => i !== index));
    };

    const handleConfirmAdd = async () => {
        if (parsedTodos.length === 0) {
            setError('没有待办事项可添加');
            return;
        }
        setLoading(true);
        try {
            await api.post('/todos/batch', { todos: parsedTodos });
            setText('');
            setParsedTodos([]);
            setShowConfirm(false);
            setShowModal(false);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err) {
            setError('添加失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const handleClose = () => {
        setShowModal(false);
        setText('');
        setParsedTodos([]);
        setShowConfirm(false);
        setError(null);
        setMode('direct');
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

            {/* 模态框背景 */}
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
                    {/* 模态框内容 */}
                    <div onClick={(e) => e.stopPropagation()} style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                    }}>
                        {!showConfirm ? (
                            <>
                                <h2 style={{ marginTop: 0, color: '#2d3748', marginBottom: '16px' }}>
                                    ✨ 添加待办事项
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
                                    <button onClick={handleClose} style={{
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
                                    {mode === 'direct' ? (
                                        <button
                                            onClick={async () => {
                                                if (!text.trim()) {
                                                    setError('请输入待办内容');
                                                    return;
                                                }
                                                setLoading(true);
                                                try {
                                                    await api.post('/todos/direct', {
                                                        content: text,
                                                        category: category,
                                                        due_date: dueDate || null
                                                    });
                                                    handleClose();
                                                    setTimeout(() => window.location.reload(), 500);
                                                } catch (err) {
                                                    setError('添加失败：' + (err.response?.data?.message || err.message));
                                                }
                                                setLoading(false);
                                            }}
                                            disabled={loading}
                                            style={{
                                                background: loading ? '#a0aec0' : '#38a169',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '10px 20px',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {loading ? '⏳ 添加中...' : '✅ 添加'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleParse}
                                            disabled={loading}
                                            style={{
                                                background: loading ? '#a0aec0' : '#38a169',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '10px 20px',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {loading ? '⏳ 解析中...' : '🔍 解析'}
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 style={{ marginTop: 0, color: '#2d3748', marginBottom: '16px' }}>
                                    🤖 AI解析完成，共识别 <span style={{ color: '#38a169' }}>{parsedTodos.length}</span> 个代办
                                </h2>
                                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
                                    请确认以下待办事项，可以删除不需要的项：
                                </p>

                                <div style={{ marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
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
                                            <button onClick={() => handleDeleteTodo(index)} style={{
                                                background: '#fc8181',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                marginLeft: '12px'
                                            }}>
                                                🗑️ 删除
                                            </button>
                                        </div>
                                    ))}
                                </div>

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
                                    <button onClick={() => { setShowConfirm(false); setParsedTodos([]); }} style={{
                                        background: '#cbd5e0',
                                        color: '#2d3748',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 20px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}>
                                        ✏️ 重新编辑
                                    </button>
                                    <button onClick={handleConfirmAdd} disabled={loading || parsedTodos.length === 0} style={{
                                        background: (loading || parsedTodos.length === 0) ? '#a0aec0' : '#38a169',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 20px',
                                        cursor: (loading || parsedTodos.length === 0) ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}>
                                        {loading ? '⏳ 添加中...' : `✅ 确认添加 ${parsedTodos.length} 项`}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingAddButton;
