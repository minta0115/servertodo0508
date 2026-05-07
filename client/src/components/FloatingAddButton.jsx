import React, { useState } from 'react';
import api from '../services/api';

const FloatingAddButton = () => {
    const [showModal, setShowModal] = useState(false);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAddTodo = async () => {
        if (!text.trim()) {
            setError('请输入待办内容');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.post('/todos/parse', { text });
            setText('');
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
                right: '30px',
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
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 6px 20px rgba(56, 161, 105, 0.6)';
            }}
            onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
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
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                    }}>
                        <h2 style={{ marginTop: 0, color: '#2d3748', marginBottom: '16px' }}>
                            ➕ 快速添加代办
                        </h2>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="输入待办内容..."
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
