import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const { login, register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isRegister) {
                await register(email, password, name);
            } else {
                await login(email, password);
            }
            navigate('/');
        } catch (error) {
            console.error('Auth error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
            alert('Error: ' + errorMessage);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #68d391 0%, #9ae6b4 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h2 style={{
                    color: '#2d3748',
                    marginBottom: '30px',
                    fontSize: '28px',
                    fontWeight: '600'
                }}>{isRegister ? '注册' : '登录'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {isRegister && (
                        <input
                            type="text"
                            placeholder="姓名"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{
                                padding: '15px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontSize: '16px',
                                background: '#f7fafc'
                            }}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="邮箱"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '16px',
                            background: '#f7fafc'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '16px',
                            background: '#f7fafc'
                        }}
                    />
                    <button type="submit" style={{
                        padding: '15px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}>{isRegister ? '注册' : '登录'}</button>
                </form>
                <button onClick={() => setIsRegister(!isRegister)} style={{
                    marginTop: '20px',
                    background: 'none',
                    border: 'none',
                    color: '#38a169',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                }}>
                    {isRegister ? '已有账户？登录' : '需要账户？注册'}
                </button>
            </div>
        </div>
    );
};

export default Login;