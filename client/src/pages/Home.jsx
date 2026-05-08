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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
    if (!user) return null;

    const tabStyle = (isActive) => ({
        padding: isMobile ? '8px 16px' : '12px 24px',
        border: 'none',
        background: isActive ? '#38a169' : '#f7fafc',
        color: isActive ? 'white' : '#2d3748',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: isMobile ? '14px' : '16px',
        fontWeight: '500',
        margin: '0 5px',
        transition: 'all 0.3s'
    });

    const containerStyle = isMobile ? {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
        padding: '10px',
        paddingBottom: '100px'
    } : {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
        padding: '20px',
        paddingBottom: '100px'
    };

    const headerStyle = isMobile ? {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 15px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    } : {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    };

    const navStyle = isMobile ? {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '15px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '8px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        flexWrap: 'wrap',
        gap: '5px'
    } : {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '10px',
        borderRadius: '20px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        flexWrap: 'wrap'
    };

    const contentStyle = isMobile ? {
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: '15px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        minHeight: '300px'
    } : {
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        minHeight: '500px'
    };

    const settingsStyle = isMobile ? {
        position: 'fixed',
        top: 'auto',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '85vh',
        background: 'white',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1001,
        padding: '15px',
        overflowY: 'auto',
        borderRadius: '16px 16px 0 0'
    } : {
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
    };

    return (
        <div style={containerStyle} className={isMobile ? 'home-container' : ''}>
            {/* 顶部栏 */}
            <header style={headerStyle} className={isMobile ? 'header-mobile' : ''}>
                <h1 style={{ margin: 0, color: '#2d3748', fontSize: isMobile ? '1.1rem' : '1.5rem' }}>✨ 智能待办</h1>
                <UserMenu onOpenSettings={() => setShowSettings(true)} isMobile={isMobile} />
            </header>

            {/* 标签导航 */}
            <nav style={navStyle} className={isMobile ? 'tab-nav-mobile' : ''}>
                <button style={tabStyle(activeTab === 'analysis')} onClick={() => setActiveTab('analysis')} className={isMobile ? 'tab-btn-mobile' : ''}>
                    📊 分析
                </button>
                <button style={tabStyle(activeTab === 'calendar')} onClick={() => setActiveTab('calendar')} className={isMobile ? 'tab-btn-mobile' : ''}>
                    📅 日历
                </button>
                <button style={tabStyle(activeTab === 'todos')} onClick={() => setActiveTab('todos')} className={isMobile ? 'tab-btn-mobile' : ''}>
                    ✅ 清单
                </button>
            </nav>

            {/* 内容区域 */}
            <div style={contentStyle} className={isMobile ? 'content-area' : ''}>
                {activeTab === 'analysis' && <AnalysisTab isMobile={isMobile} />}
                {activeTab === 'calendar' && <CalendarTab onJumpToTodos={() => setActiveTab('todos')} isMobile={isMobile} />}
                {activeTab === 'todos' && <TodoListTab isMobile={isMobile} />}
            </div>

            {/* 设置侧边栏 */}
            {showSettings && (
                <div style={settingsStyle} className={isMobile ? 'settings-sidebar' : ''}>
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
            <FloatingAddButton isMobile={isMobile} />
        </div>
    );
};

export default Home;