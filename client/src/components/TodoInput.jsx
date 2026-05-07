import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import api from '../services/api';

const TodoInput = () => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedTodos, setParsedTodos] = useState([]);
    const [showParsedList, setShowParsedList] = useState(false);

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
            setShowParsedList(true);
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
        setLoading(true);
        try {
            // 待办已在解析时保存到数据库，刷新列表
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err) {
            setError('确认失败：' + err.message);
        }
        setLoading(false);
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
            {!showParsedList ? (
                <>
                    <h3 style={{ marginTop: 0, color: '#2d3748' }}>分析待办</h3>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="输入待办内容或上传截图"
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '16px',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit',
                            marginBottom: '12px'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
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
                            {loading ? '⏳ 解析中...' : '🔍 解析待办'}
                        </button>
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
                </>
            ) : (
                <>
                    <h3 style={{ marginTop: 0, color: '#2d3748' }}>
                        ✅ 解析成功，共识别 <span style={{ color: '#38a169', fontWeight: 'bold' }}>{parsedTodos.length}</span> 个代办
                    </h3>
                    <div style={{ marginBottom: '16px' }}>
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
                                        📁 {todo.category || '其他'} | 📅 {todo.due_date || '未设置'} | 📊 置信度 {(todo.confidence * 100).toFixed(0)}%
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
                        <button onClick={() => {
                            setShowParsedList(false);
                            setParsedTodos([]);
                        }} style={{
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
                        <button onClick={handleConfirmTodos} disabled={loading} style={{
                            background: loading ? '#a0aec0' : '#38a169',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            {loading ? '⏳ 确认中...' : '✅ 确认添加'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TodoInput;