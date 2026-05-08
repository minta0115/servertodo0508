import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import api from '../services/api';

const TodoInput = () => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedTodos, setParsedTodos] = useState([]);
    const [showParsedList, setShowParsedList] = useState(false);

    // 直接添加相关状态
    const [directText, setDirectText] = useState('');
    const [directCategory, setDirectCategory] = useState('其他');
    const [directDueDate, setDirectDueDate] = useState('');

    const handleTextSubmit = async () => {
        if (!text.trim()) {
            setError('请输入待办内容');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/todos/parse', { text });
            setParsedTodos(response.data || []);
            if (response.data && response.data.length === 0) {
                setError('未识别到任何待办事项，请尝试其他描述');
            } else {
                setShowParsedList(true);
            }
            setText('');
        } catch (error) {
            console.error('Error details:', error);
            setError('解析失败：' + (error.response?.data?.message || error.message || '未知错误'));
            setShowParsedList(false);
        }
        setLoading(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const worker = await createWorker('chi_sim');
            const { data: { text: ocrText } } = await worker.recognize(file);
            await worker.terminate();
            setText(ocrText);
        } catch (err) {
            setError('OCR识别失败：' + err.message);
        }
        setLoading(false);
    };

    const handleDeleteTodo = (index) => {
        setParsedTodos(parsedTodos.filter((_, i) => i !== index));
    };

    const handleConfirmTodos = async () => {
        if (parsedTodos.length === 0) {
            setError('没有待办事项可添加');
            return;
        }
        setLoading(true);
        try {
            await api.post('/todos/batch', { todos: parsedTodos });
            setShowParsedList(false);
            setParsedTodos([]);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err) {
            setError('添加失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

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
            setDirectText('');
            setDirectDueDate('');
            setDirectCategory('其他');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err) {
            setError('添加失败：' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 代办分析部分 */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
                <h3 style={{ marginTop: 0, color: '#2d3748', marginBottom: '16px' }}>🤖 代办分析</h3>

                {!showParsedList ? (
                    <>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="输入待办相关内容，AI会自动分析提取待办事项..."
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
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <label style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                background: '#f7fafc',
                                border: '1px solid #cbd5e0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                📸 上传截图
                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            </label>
                            <button onClick={handleTextSubmit} disabled={loading} style={{
                                padding: '8px 16px',
                                background: loading ? '#a0aec0' : '#38a169',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                {loading ? '⏳ 解析中...' : '🔍 智能解析'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h4 style={{ margin: '0 0 12px 0', color: '#38a169' }}>
                            ✅ 解析完成，共识别 <span style={{ fontWeight: 'bold' }}>{parsedTodos.length}</span> 个代办
                        </h4>
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
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowParsedList(false); setParsedTodos([]); }} style={{
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
                            <button onClick={handleConfirmTodos} disabled={loading || parsedTodos.length === 0} style={{
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

                {error && (
                    <div style={{
                        background: '#fed7d7',
                        color: '#c53030',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}>
                        ⚠️ {error}
                    </div>
                )}
            </div>

            {/* 增加代办部分 */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
                <h3 style={{ marginTop: 0, color: '#2d3748', marginBottom: '16px' }}>➕ 增加代办</h3>

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
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        {loading ? '⏳ 添加中...' : '✅ 直接添加'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TodoInput;
