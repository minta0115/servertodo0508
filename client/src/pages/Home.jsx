import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TodoListTab from '../components/TodoList';
import Settings from '../components/Settings';
import OverviewTab from '../components/OverviewTab';
import WeekViewTab from '../components/WeekViewTab';
import AddTab from '../components/AddTab';
import RemindTab from '../components/RemindTab';
import CalendarTab from '../components/CalendarTab';
import UserMenu from '../components/UserMenu';

const TABS = [
    { id: 'overview', label: '📊 总览', icon: '📊' },
    { id: 'week', label: '📅 周视图', icon: '📅' },
    { id: 'list', label: '📋 清单', icon: '📋' },
    { id: 'add', label: '➕ 添加', icon: '➕' },
    { id: 'remind', label: '⏰ 提醒', icon: '⏰' }
];

const Home = () => {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [showSettings, setShowSettings] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [viewMode, setViewMode] = useState('pc'); // 'pc' | 'mobile'
    const [listFilter, setListFilter] = useState(null); // { date, extra }
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobileDevice(mobile);
            // Auto-switch to mobile view on small screens
            if (mobile && viewMode === 'pc') {
                setViewMode('mobile');
            }
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

    const isMobile = viewMode === 'mobile';
    const effectiveMobile = isMobile || isMobileDevice;

    // Tab navigation - for PC mode at top, mobile mode at bottom
    const renderTabNav = () => {
        const tabStyle = (isActive) => ({
            padding: effectiveMobile ? '8px 12px' : '10px 18px',
            border: 'none',
            background: isActive ? '#4f6af5' : '#f7fafc',
            color: isActive ? 'white' : '#2d3748',
            borderRadius: effectiveMobile ? '10px' : '12px',
            cursor: 'pointer',
            fontSize: effectiveMobile ? '13px' : '14px',
            fontWeight: '500',
            margin: '0 3px',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
        });

        if (effectiveMobile) {
            // Mobile: bottom fixed tab bar
            return (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.98)',
                    padding: '8px 4px',
                    paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
                    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                    zIndex: 100,
                    justifyContent: 'space-around'
                }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setListFilter(null);
                            }}
                            style={{
                                ...tabStyle(activeTab === tab.id),
                                flex: 1,
                                margin: '0 2px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '11px'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                            <span>{tab.label.replace(/^[^\s]+\s/, '')}</span>
                        </button>
                    ))}
                </div>
            );
        }

        // PC: top navigation bar
        return (
            <nav style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '8px',
                borderRadius: '16px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                flexWrap: 'wrap',
                gap: '4px'
            }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setListFilter(null);
                        }}
                        style={tabStyle(activeTab === tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        );
    };

    const containerStyle = effectiveMobile ? {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
        padding: '10px',
        paddingBottom: '90px'
    } : {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
        padding: '20px',
        paddingBottom: '40px'
    };

    const headerStyle = effectiveMobile ? {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '10px 14px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    } : {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '16px 20px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    };

    const contentStyle = effectiveMobile ? {
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        minHeight: '400px'
    } : {
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        minHeight: '500px'
    };

    const settingsStyle = effectiveMobile ? {
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

    // Handle navigation from other tabs to list with filter
    const handleNavigateToTodos = (filterType) => {
        if (filterType === 'all') {
            setListFilter(null);
        } else {
            setListFilter({ date: null, extra: filterType });
        }
        setActiveTab('list');
    };

    const handleWeekDayClick = (date) => {
        setListFilter({ date, extra: null });
        setActiveTab('list');
    };

    const handleFilterClear = () => {
        setListFilter(null);
    };

    const handleTodoAdded = () => {
        setRefreshKey(k => k + 1);
    };

    return (
        <div style={containerStyle}>
            {/* 顶部栏 */}
            <header style={headerStyle}>
                <h1 style={{ margin: 0, color: '#1e293b', fontSize: effectiveMobile ? '1.1rem' : '1.3rem' }}>
                    🧠 TodoAI
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* PC/手机模式切换 */}
                    <button
                        onClick={() => setViewMode(v => v === 'pc' ? 'mobile' : 'pc')}
                        style={{
                            padding: effectiveMobile ? '5px 10px' : '6px 14px',
                            background: viewMode === 'pc' ? '#4f6af5' : '#38a169',
                            color: 'white',
                            border: 'none',
                            borderRadius: effectiveMobile ? '8px' : '12px',
                            fontSize: effectiveMobile ? '11px' : '13px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        {viewMode === 'pc' ? '📱 手机' : '💻 PC'}
                    </button>
                    <UserMenu onOpenSettings={() => setShowSettings(true)} isMobile={effectiveMobile} />
                </div>
            </header>

            {/* Tab 导航 */}
            {renderTabNav()}

            {/* 内容区域 */}
            <div style={contentStyle} key={refreshKey}>
                {activeTab === 'overview' && (
                    <OverviewTab
                        isMobile={effectiveMobile}
                        onNavigateToTodos={handleNavigateToTodos}
                        onNavigateToList={() => setActiveTab('list')}
                    />
                )}
                {activeTab === 'week' && (
                    <WeekViewTab
                        isMobile={effectiveMobile}
                        onDayClick={handleWeekDayClick}
                    />
                )}
                {activeTab === 'list' && (
                    <TodoListTab
                        isMobile={effectiveMobile}
                        filterDate={listFilter?.date}
                        extraFilter={listFilter?.extra}
                        onFilterClear={handleFilterClear}
                    />
                )}
                {activeTab === 'add' && (
                    <AddTab
                        isMobile={effectiveMobile}
                        onAdded={handleTodoAdded}
                    />
                )}
                {activeTab === 'remind' && (
                    <RemindTab
                        isMobile={effectiveMobile}
                        onAction={handleTodoAdded}
                    />
                )}
                {activeTab === 'calendar' && (
                    <CalendarTab
                        onJumpToTodos={() => setActiveTab('list')}
                        isMobile={effectiveMobile}
                    />
                )}
            </div>

            {/* 设置侧边栏 */}
            {showSettings && (
                <>
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 1000
                    }}
                    onClick={() => setShowSettings(false)} />
                    <div style={settingsStyle}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{ margin: 0, fontSize: effectiveMobile ? '1.1rem' : '1.25rem' }}>⚙️ 设置</h2>
                            <button onClick={() => setShowSettings(false)} style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer'
                            }}>×</button>
                        </div>
                        <Settings onClose={() => setShowSettings(false)} />
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;