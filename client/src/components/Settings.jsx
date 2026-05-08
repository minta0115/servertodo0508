import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Settings = () => {
    const [provider, setProvider] = useState('nvidia');
    const [apiKey, setApiKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setProvider(response.data.preferred_provider || 'nvidia');
        } catch (error) {
            console.error('Error fetching settings');
        }
    };

    const updateSettings = async () => {
        setSaving(true);
        setMessage('');
        try {
            await api.put('/settings', { preferred_provider: provider });
            setMessage('设置已保存');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('保存失败');
        }
        setSaving(false);
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748' }}>
                    🤖 AI 提供商
                </label>
                <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                    }}
                >
                    <option value="nvidia">NVIDIA (Llama)</option>
                    <option value="minimax">MiniMax</option>
                    <option value="kimi">Kimi (Moonshot)</option>
                </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748' }}>
                    🔑 API Key（可选）
                </label>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="使用系统默认密钥"
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                    }}
                />
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                    设置后将使用您自己的 API Key
                </p>
            </div>

            {message && (
                <div style={{
                    background: message.includes('失败') ? '#fed7d7' : '#c6f6d5',
                    color: message.includes('失败') ? '#c53030' : '#2f855a',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px'
                }}>
                    {message}
                </div>
            )}

            <button
                onClick={updateSettings}
                disabled={saving}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: saving ? '#a0aec0' : '#38a169',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                }}
            >
                {saving ? '保存中...' : '💾 保存设置'}
            </button>

            <div style={{ marginTop: '32px', padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>ℹ️ 说明</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#718096' }}>
                    <li>默认使用系统 API Key</li>
                    <li>设置自己的 API Key 后，将优先使用您的 Key</li>
                    <li>NVIDIA API 支持 Llama 3.1 等模型</li>
                </ul>
            </div>
        </div>
    );
};

export default Settings;
