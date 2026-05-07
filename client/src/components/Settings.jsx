import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Settings = () => {
    const [provider, setProvider] = useState('nvidia');

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

    const updateProvider = async () => {
        try {
            await api.put('/settings', { preferred_provider: provider });
            alert('设置已更新');
        } catch (error) {
            alert('Error updating settings');
        }
    };

    return (
        <div>
            <h2>设置</h2>
            <label>
                AI 提供商:
                <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                    <option value="nvidia">NVIDIA</option>
                    <option value="minimax">MiniMax</option>
                </select>
            </label>
            <button onClick={updateProvider}>保存</button>
        </div>
    );
};

export default Settings;