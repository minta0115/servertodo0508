import React, { useEffect, useState } from 'react';
import api from '../services/api';

const OverviewTab = ({ isMobile = false, onNavigateToList, onNavigateToTodos }) => {
    const [todos, setTodos] = useState([]);
    const [completedToday, setCompletedToday] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const response = await api.get('/todos');
            const todoList = response.data || [];
            setTodos(todoList);

            // 计算今日完成
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

    // AI建议
    const suggestions = [];
    if (stats.overdue > 0) {
        suggestions.push({ type: 'danger', icon: '❗', text: `${stats.overdue}项任务已过期，请尽快处理。` });
    }
    if (stats.highPriority > 0) {
        suggestions.push({ type: 'warning', icon: '⚡', text: `${stats.highPriority}项高优先级任务建议优先处理。` });
    }
    if (stats.total === 0) {
        suggestions.push({ type: 'success', icon: '🎉', text: '空空如也，去添加任务吧！' });
    }

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

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>加载中...</div>;
    }

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }}>
            <div style={cardStyle}>
                <div style={{
                    fontSize: isMobile ? '15px' : '16px',
                    fontWeight: '650',
                    marginBottom: isMobile ? '10px' : '12px',
                    color: '#1e293b'
                }}>
                    📊 待办报告
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

            {suggestions.length > 0 && (
                <div style={{
                    background: '#eef2ff',
                    borderRadius: isMobile ? '14px' : '14px',
                    padding: isMobile ? '10px 14px' : '12px 16px',
                    color: '#334155',
                    fontSize: isMobile ? '13px' : '14px',
                    marginBottom: isMobile ? '12px' : '16px'
                }}>
                    💡 {suggestions.map(s => s.icon + ' ' + s.text).join(' ')}
                </div>
            )}

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
        </div>
    );
};

export default OverviewTab;