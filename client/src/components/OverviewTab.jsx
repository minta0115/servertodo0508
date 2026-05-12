import React, { useEffect, useState } from 'react';
import api from '../services/api';
import AIAnalysisModal from './AIAnalysisModal';

const OverviewTab = ({ isMobile = false, onNavigateToList, onNavigateToTodos }) => {
    const [todos, setTodos] = useState([]);
    const [completedToday, setCompletedToday] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [analysisRange, setAnalysisRange] = useState('today');
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    useEffect(() => {
        fetchTodos();
    }, []);

    useEffect(() => {
        if (!loading && todos.length >= 0) {
            generateSuggestions();
        }
    }, [loading, todos]);

    const fetchTodos = async () => {
        try {
            const response = await api.get('/todos');
            const todoList = response.data || [];
            setTodos(todoList);

            const today = new Date().toDateString();
            const todayCompleted = todoList.filter(t =>
                t.completed && new Date(t.completed_at || t.updated_at).toDateString() === today
            ).length;
            setCompletedToday(todayCompleted);
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
        setLoading(false);
    };

    const generateSuggestions = () => {
        const pending = todos.filter(t => !t.completed && !t.deleted);
        if (pending.length === 0) {
            setSuggestions([{ type: 'success', icon: '🎉', text: '空空如也，去添加任务吧！' }]);
            return;
        }

        const newSuggestions = [];
        const now = new Date();

        // 按紧急程度和难度排序
        const sorted = [...pending].sort((a, b) => {
            // 优先看是否有逾期
            const aOverdue = a.due_date && new Date(a.due_date + 'T23:59:59') < now;
            const bOverdue = b.due_date && new Date(b.due_date + 'T23:59:59') < now;
            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;

            // 再看优先级
            if (a.priority === '高' && b.priority !== '高') return -1;
            if (b.priority === '高' && a.priority !== '高') return 1;

            // 看截止日期
            if (a.due_date && !b.due_date) return -1;
            if (b.due_date && !a.due_date) return 1;
            if (a.due_date && b.due_date) {
                return new Date(a.due_date) - new Date(b.due_date);
            }

            return 0;
        });

        // 生成建议
        const overdueItems = sorted.filter(t => t.due_date && new Date(t.due_date + 'T23:59:59') < now);
        const todayItems = sorted.filter(t => t.due_date && t.due_date === now.toISOString().slice(0, 10));
        const tomorrowItems = sorted.filter(t => {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            return t.due_date === tomorrow.toISOString().slice(0, 10);
        });
        const highPriorityItems = sorted.filter(t => t.priority === '高' && !overdueItems.includes(t));

        if (overdueItems.length > 0) {
            newSuggestions.push({
                type: 'danger',
                icon: '🚨',
                text: `${overdueItems.length}项已逾期，建议立即处理！`
            });
        }

        if (todayItems.length > 0) {
            newSuggestions.push({
                type: 'warning',
                icon: '⚡',
                text: `今日有${todayItems.length}项待办截止，加油完成！`
            });
        }

        if (highPriorityItems.length > 0 && newSuggestions.length < 2) {
            newSuggestions.push({
                type: 'info',
                icon: '📌',
                text: `${highPriorityItems.length}项高优先级任务建议优先处理`
            });
        }

        if (sorted.length > 5 && newSuggestions.length < 2) {
            newSuggestions.push({
                type: 'info',
                icon: '📋',
                text: `当前有${sorted.length}项待办，建议分批处理`
            });
        }

        if (newSuggestions.length === 0 && sorted.length > 0) {
            newSuggestions.push({
                type: 'success',
                icon: '✨',
                text: `当前有${sorted.length}项待办，保持节奏！`
            });
        }

        setSuggestions(newSuggestions);
    };

    const refreshSuggestions = () => {
        setSuggestionsLoading(true);
        setTimeout(() => {
            fetchTodos().then(() => {
                setSuggestionsLoading(false);
            });
        }, 500);
    };

    // 统计计算
    const stats = {
        total: todos.filter(t => !t.deleted).length,
        pending: todos.filter(t => !t.completed && !t.deleted).length,
        highPriority: todos.filter(t => !t.completed && !t.deleted && t.priority === '高').length,
        overdue: todos.filter(t => {
            if (t.completed || t.deleted || !t.due_date) return false;
            return new Date(t.due_date + 'T23:59:59') < new Date();
        }).length
    };

    // 分类统计
    const categories = {};
    todos.filter(t => !t.deleted).forEach(t => {
        const cat = t.category || '其他';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    // 最近完成的3条
    const recentCompleted = todos
        .filter(t => t.completed)
        .slice(-3)
        .reverse()
        .map(t => ({
            content: t.content,
            category: t.category,
            completedAt: t.completed_at || t.updated_at
        }));

    const cardStyle = isMobile ? {
        background: 'white',
        borderRadius: '14px',
        padding: '12px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    } : {
        background: 'white',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    };

    const statItemStyle = isMobile ? {
        background: '#f1f5f9',
        borderRadius: '14px',
        padding: '10px',
        flex: 1,
        textAlign: 'center',
        cursor: 'pointer',
        transition: '0.2s'
    } : {
        background: '#f1f5f9',
        borderRadius: '14px',
        padding: '12px',
        flex: 1,
        textAlign: 'center',
        cursor: 'pointer',
        transition: '0.2s'
    };

    const btnStyle = {
        padding: '6px 14px',
        background: '#4f6af5',
        border: 'none',
        borderRadius: '20px',
        color: 'white',
        fontSize: '12px',
        cursor: 'pointer',
        transition: '0.2s'
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>加载中...</div>;
    }

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }}>
            {/* 分析按钮区域 */}
            <div style={{
                display: 'flex',
                gap: isMobile ? '6px' : '10px',
                marginBottom: isMobile ? '12px' : '16px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => { setAnalysisRange('today'); setShowAnalysisModal(true); }}
                    style={btnStyle}
                >
                    📅 今日分析
                </button>
                <button
                    onClick={() => { setAnalysisRange('week'); setShowAnalysisModal(true); }}
                    style={btnStyle}
                >
                    📆 本周分析
                </button>
                <button
                    onClick={() => { setAnalysisRange('custom'); setShowAnalysisModal(true); }}
                    style={btnStyle}
                >
                    📊 自定义分析
                </button>
            </div>

            <div style={cardStyle}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isMobile ? '10px' : '12px'
                }}>
                    <div style={{
                        fontSize: isMobile ? '15px' : '16px',
                        fontWeight: '650',
                        color: '#1e293b'
                    }}>
                        📊 待办报告
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    gap: isMobile ? '8px' : '12px',
                    margin: isMobile ? '10px 0' : '12px 0'
                }}>
                    <div
                        style={statItemStyle}
                        onClick={() => onNavigateToTodos && onNavigateToTodos('all')}
                        className="stat-item-hover"
                    >
                        <div style={{
                            fontSize: isMobile ? '20px' : '22px',
                            fontWeight: '700',
                            color: '#1e293b'
                        }}>{stats.total}</div>
                        <div style={{
                            fontSize: isMobile ? '11px' : '12px',
                            color: '#64748b',
                            marginTop: '4px'
                        }}>剩余</div>
                    </div>
                    <div
                        style={statItemStyle}
                        onClick={() => onNavigateToTodos && onNavigateToTodos('completedToday')}
                        className="stat-item-hover"
                    >
                        <div style={{
                            fontSize: isMobile ? '20px' : '22px',
                            fontWeight: '700',
                            color: '#1e293b'
                        }}>{completedToday}</div>
                        <div style={{
                            fontSize: isMobile ? '11px' : '12px',
                            color: '#64748b',
                            marginTop: '4px'
                        }}>今日完成</div>
                    </div>
                    <div
                        style={statItemStyle}
                        onClick={() => onNavigateToTodos && onNavigateToTodos('high')}
                        className="stat-item-hover"
                    >
                        <div style={{
                            fontSize: isMobile ? '20px' : '22px',
                            fontWeight: '700',
                            color: '#1e293b'
                        }}>{stats.highPriority}</div>
                        <div style={{
                            fontSize: isMobile ? '11px' : '12px',
                            color: '#64748b',
                            marginTop: '4px'
                        }}>高优先</div>
                    </div>
                    <div
                        style={{
                            ...statItemStyle,
                            background: stats.overdue > 0 ? '#fee2e2' : '#f1f5f9'
                        }}
                        onClick={() => onNavigateToTodos && onNavigateToTodos('overdue')}
                        className="stat-item-hover"
                    >
                        <div style={{
                            fontSize: isMobile ? '20px' : '22px',
                            fontWeight: '700',
                            color: stats.overdue > 0 ? '#dc2626' : '#16a34a'
                        }}>{stats.overdue}</div>
                        <div style={{
                            fontSize: isMobile ? '11px' : '12px',
                            color: '#64748b',
                            marginTop: '4px'
                        }}>已过期</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Object.entries(categories).map(([cat, count]) => (
                        <span key={cat} style={{
                            background: '#eef2ff',
                            borderRadius: '20px',
                            padding: '2px 10px',
                            fontSize: isMobile ? '12px' : '13px',
                            color: '#4f6af5'
                        }}>
                            {cat} {count}
                        </span>
                    ))}
                </div>
            </div>

            {/* AI 建议区域 */}
            <div style={cardStyle}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isMobile ? '8px' : '10px'
                }}>
                    <div style={{
                        fontSize: isMobile ? '14px' : '15px',
                        fontWeight: '650',
                        color: '#1e293b'
                    }}>
                        💡 针对未完成代办的建议
                    </div>
                    <button
                        onClick={refreshSuggestions}
                        disabled={suggestionsLoading}
                        style={{
                            padding: '4px 10px',
                            background: '#4f6af5',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '11px',
                            cursor: suggestionsLoading ? 'not-allowed' : 'pointer',
                            opacity: suggestionsLoading ? 0.6 : 1
                        }}
                    >
                        {suggestionsLoading ? '⏳ 刷新中...' : '🔄 刷新'}
                    </button>
                </div>
                {suggestionsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                        分析中...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {suggestions.map((s, idx) => (
                            <div key={idx} style={{
                                padding: isMobile ? '10px 12px' : '12px 14px',
                                borderRadius: '10px',
                                background: s.type === 'danger' ? '#fee2e2' :
                                           s.type === 'warning' ? '#fef3c7' :
                                           s.type === 'success' ? '#dcfce7' : '#eef2ff',
                                color: s.type === 'danger' ? '#991b1b' :
                                       s.type === 'warning' ? '#92400e' :
                                       s.type === 'success' ? '#166534' : '#1e40af',
                                fontSize: isMobile ? '12px' : '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '16px' }}>{s.icon}</span>
                                <span>{s.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 最近完成 */}
            {recentCompleted.length > 0 && (
                <div style={cardStyle}>
                    <div style={{
                        fontSize: isMobile ? '15px' : '16px',
                        fontWeight: '650',
                        marginBottom: '8px',
                        color: '#1e293b'
                    }}>
                        ✅ 最近完成
                    </div>
                    {recentCompleted.map((item, idx) => (
                        <div key={idx} style={{
                            fontSize: isMobile ? '12px' : '13px',
                            color: '#16a34a',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span>✓</span>
                            <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: isMobile ? '200px' : '300px'
                            }}>
                                {item.content.split('\n')[0]}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>{item.category}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* 分析Modal */}
            {showAnalysisModal && (
                <AIAnalysisModal
                    isMobile={isMobile}
                    onClose={() => setShowAnalysisModal(false)}
                    rangeType={analysisRange}
                />
            )}
        </div>
    );
};

export default OverviewTab;