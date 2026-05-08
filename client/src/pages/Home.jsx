import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TodoListTab from '../components/TodoList';
import Settings from '../components/Settings';
import AnalysisTab from '../components/AnalysisTab';
import CalendarTab from '../components/CalendarTab';
import UserMenu from '../components/UserMenu';
import FloatingAddButton from '../components/FloatingAddButton';

const Home = () => {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analysis');
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
    if (!user) return null;

    const tabStyle = (isActive) => ({
        padding: '12px 24px',
        border: 'none',
        background: isActive ? '#38a169' : '#f7fafc',
        color: isActive ? 'white' : '#2d3748',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        margin: '0 5px',
        transition: 'all 0.3s'
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
            padding: '20px',
            paddingBottom: '100px'
        }}>
            {/* 顶部栏 */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '20px',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
                <h1 style={{ margin: 0, color: '#2d3748' }}>✨ 智能待办</h1>
                <UserMenu onOpenSettings={() => setShowSettings(true)} />
            </header>

            {/* 标签导航 */}
            <nav style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '30px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '10px',
                borderRadius: '20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                flexWrap: 'wrap'
            }}>
                <button style={tabStyle(activeTab === 'analysis')} onClick={() => setActiveTab('analysis')}>
                    📊 分析
                </button>
                <button style={tabStyle(activeTab === 'calendar')} onClick={() => setActiveTab('calendar')}>
                    📅 日历
                </button>
                <button style={tabStyle(activeTab === 'todos')} onClick={() => setActiveTab('todos')}>
                    ✅ 清单
                </button>
            </nav>

            {/* 内容区域 */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                minHeight: '500px'
            }}>
                {activeTab === 'analysis' && <AnalysisTab />}
                {activeTab === 'calendar' && <CalendarTab onJumpToTodos={() => setActiveTab('todos')} />}
                {activeTab === 'todos' && <TodoListTab />}
            </div>

            {/* 设置侧边栏 */}
            {showSettings && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '400px',
                    height: '100vh',
                    background: 'white',
                    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
                    zIndex: 1001,
                    padding: '20px',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0 }}>⚙️ 设置</h2>
                        <button onClick={() => setShowSettings(false)} style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer'
                        }}>×</button>
                    </div>
                    <Settings onClose={() => setShowSettings(false)} />
                </div>
            )}
            {showSettings && (
                <div onClick={() => setShowSettings(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.3)',
                    zIndex: 1000
                }} />
            )}

            {/* 浮动添加按钮 */}
            <FloatingAddButton />
        </div>
    );
};

export default Home;