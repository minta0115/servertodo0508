import React, { useEffect, useState } from 'react';
import api from '../services/api';

const TodoListTab = ({
    isMobile = false,
    filterDate = null,
    extraFilter = null,
    onFilterClear = null
}) => {
    const [todos, setTodos] = useState([]);
    const [filter, setFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTodos();
    }, [filterDate, extraFilter]);

    const fetchTodos = async () => {
        try {
            const response = await api.get('/todos');
            setTodos(response.data || []);
        } catch (error) {
            console.error('Error fetching todos');
        }
    };

    const markComplete = async (id) => {
        setLoading(true);
        try {
            await api.put(`/todos/${id}`, { completed: true });
            fetchTodos();
        } catch (error) {
            alert('Error updating todo');
        }
        setLoading(false);
    };

    const deleteTodo = async (id) => {
        // Find the todo first to show feedback
        const todo = todos.find(t => t.id === id);
        const todoContent = todo ? todo.content.substring(0, 20) : '';

        setLoading(true);
        try {
            await api.put(`/todos/${id}`, { deleted: true });
            fetchTodos();
            // Show success feedback
            const feedback = document.createElement('div');
            feedback.textContent = `🗑 已删除「${todoContent}...」`;
            feedback.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#38a169;color:white;padding:12px 24px;border-radius:8px;font-size:14px;z-index:9999;animation:fadeIn 0.3s';
            document.body.appendChild(feedback);
            setTimeout(() => {
                feedback.style.animation = 'fadeOut 0.3s';
                setTimeout(() => document.body.removeChild(feedback), 300);
            }, 2000);
        } catch (error) {
            alert('Error deleting todo');
        }
        setLoading(false);
    };

    const getReminder = (todo) => {
        if (!todo.due_date) return null;
        const due = new Date(todo.due_date);
        const now = new Date();
        const diff = (due - now) / (1000 * 60 * 60 * 24);

        if (todo.completed || todo.deleted) return null;

        if (diff < 0) {
            return { icon: '🚨', text: '已逾期', color: '#f56565', bg: '#fed7d7' };
        } else if (diff === 0) {
            return { icon: '⚡', text: '今天截止', color: '#ed8936', bg: '#feebc8' };
        } else if (diff <= 1) {
            return { icon: '⏰', text: '明天截止', color: '#d69e2e', bg: '#feebc8' };
        } else if (diff <= 3) {
            return { icon: '📅', text: `${Math.ceil(diff)}天后截止`, color: '#f6ad55', bg: '#feebc8' };
        } else if (diff <= 7) {
            return { icon: '📌', text: `${Math.ceil(diff)}天后截止`, color: '#38a169', bg: '#c6f6d5' };
        }
        return null;
    };

    const getPriorityBadge = (todo) => {
        if (todo.completed || todo.deleted) return null;
        if (todo.priority === '高') {
            return <span style={{
                color: '#dc2626',
                background: '#fee2e2',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                marginLeft: '6px'
            }}>高</span>;
        }
        if (todo.priority === '低') {
            return <span style={{
                color: '#6b7280',
                background: '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                marginLeft: '6px'
            }}>低</span>;
        }
        return null;
    };

    // 过滤逻辑
    let filteredTodos = todos.filter(t => !t.deleted);

    // 日期过滤（来自周视图）
    if (filterDate) {
        filteredTodos = filteredTodos.filter(t => t.due_date === filterDate);
    }

    // 特殊过滤（来自总览统计）
    if (extraFilter === 'high') {
        filteredTodos = filteredTodos.filter(t => t.priority === '高' && !t.completed);
    } else if (extraFilter === 'overdue') {
        const now = new Date();
        filteredTodos = filteredTodos.filter(t => {
            if (!t.due_date || t.completed) return false;
            return new Date(t.due_date + 'T23:59:59') < now;
        });
    } else if (extraFilter === 'completedToday') {
        const today = new Date().toDateString();
        filteredTodos = filteredTodos.filter(t => {
            return t.completed && new Date(t.completed_at || t.updated_at).toDateString() === today;
        });
        filter === 'all'; // 重置状态过滤
    } else if (filter === 'completed') {
        filteredTodos = filteredTodos.filter(t => t.completed);
    } else if (filter === 'pending') {
        filteredTodos = filteredTodos.filter(t => !t.completed);
    }

    // 分类过滤
    if (categoryFilter !== 'all') {
        filteredTodos = filteredTodos.filter(t => t.category === categoryFilter);
    }

    // 获取所有分类
    const categories = ['全部', ...new Set(todos.filter(t => !t.deleted).map(t => t.category || '其他'))];

    const stats = {
        total: todos.filter(t => !t.deleted).length,
        completed: todos.filter(t => t.completed && !t.deleted).length,
        pending: todos.filter(t => !t.completed && !t.deleted).length
    };

    // 链接格式化
    const linkify = (text) => {
        return text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color:#4f6af5;text-decoration:underline;">$1</a>');
    };

    // 显示过滤器标签
    const showDateFilter = filterDate;
    const showExtraFilter = extraFilter;
    const hasActiveFilter = showDateFilter || showExtraFilter;

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }} className={isMobile ? 'content-area' : ''}>
            {/* 过滤标签提示 */}
            {hasActiveFilter && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: '#eef2ff',
                    borderRadius: '8px',
                    fontSize: isMobile ? '12px' : '13px'
                }}>
                    <span>
                        {showDateFilter && `📅 ${showDateFilter}`}
                        {showExtraFilter === 'high' && '⚡ 高优先级任务'}
                        {showExtraFilter === 'overdue' && '❗ 已过期任务'}
                        {showExtraFilter === 'completedToday' && '✅ 今日已完成'}
                    </span>
                    <button
                        onClick={() => {
                            if (onFilterClear) onFilterClear();
                        }}
                        style={{
                            border: 'none',
                            background: '#4f6af5',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            cursor: 'pointer'
                        }}
                    >
                        清除
                    </button>
                </div>
            )}

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMobile ? '12px' : '20px',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                <h2 style={{ margin: 0, color: '#2d3748', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                    📋 待办清单
                </h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                        padding: '4px 10px',
                        background: '#f0fff4',
                        borderRadius: '20px',
                        fontSize: isMobile ? '11px' : '12px',
                        color: '#38a169'
                    }}>
                        总计: {stats.total}
                    </span>
                    <span style={{
                        padding: '4px 10px',
                        background: '#c6f6d5',
                        borderRadius: '20px',
                        fontSize: isMobile ? '11px' : '12px',
                        color: '#22543d'
                    }}>
                        完成: {stats.completed}
                    </span>
                    <span style={{
                        padding: '4px 10px',
                        background: '#feebc8',
                        borderRadius: '20px',
                        fontSize: isMobile ? '11px' : '12px',
                        color: '#7c2d12'
                    }}>
                        待完成: {stats.pending}
                    </span>
                </div>
            </div>

            {/* 过滤标签 - 状态（仅在没有特殊过滤时显示） */}
            {!extraFilter && !filterDate && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button onClick={() => setFilter('all')} style={{
                        padding: '8px 16px',
                        background: filter === 'all' ? '#38a169' : '#f7fafc',
                        color: filter === 'all' ? 'white' : '#2d3748',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        全部
                    </button>
                    <button onClick={() => setFilter('pending')} style={{
                        padding: '8px 16px',
                        background: filter === 'pending' ? '#38a169' : '#f7fafc',
                        color: filter === 'pending' ? 'white' : '#2d3748',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        待完成
                    </button>
                    <button onClick={() => setFilter('completed')} style={{
                        padding: '8px 16px',
                        background: filter === 'completed' ? '#38a169' : '#f7fafc',
                        color: filter === 'completed' ? 'white' : '#2d3748',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        已完成
                    </button>
                </div>
            )}

            {/* 过滤标签 - 分类 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat === '全部' ? 'all' : cat)}
                        style={{
                            padding: '6px 12px',
                            background: (cat === '全部' ? categoryFilter === 'all' : categoryFilter === cat) ? '#38a169' : '#f7fafc',
                            color: (cat === '全部' ? categoryFilter === 'all' : categoryFilter === cat) ? 'white' : '#718096',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* 待办列表 */}
            {filteredTodos.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#718096',
                    background: '#f7fafc',
                    borderRadius: '12px',
                    fontSize: '14px'
                }}>
                    {extraFilter === 'completedToday' ? '📭 暂无已完成任务' :
                     extraFilter === 'overdue' ? '🎉 没有过期任务！' :
                     filter === 'completed' ? '📭 暂无已完成任务' :
                     filter === 'pending' ? '🎉 所有任务都已完成！' :
                     '📭 暂无待办事项'}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
                    {filteredTodos.map(todo => {
                        const reminder = getReminder(todo);
                        const priorityBadge = getPriorityBadge(todo);

                        const itemStyle = isMobile ? {
                            background: todo.completed ? '#f7fafc' : 'white',
                            borderRadius: '10px',
                            padding: '12px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            opacity: todo.completed ? 0.6 : 1,
                            transition: 'all 0.3s'
                        } : {
                            background: todo.completed ? '#f7fafc' : 'white',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            opacity: todo.completed ? 0.6 : 1,
                            transition: 'all 0.3s'
                        };

                        return (
                            <div key={todo.id} style={itemStyle} className={isMobile ? 'todo-item-mobile' : ''}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: isMobile ? '6px' : '8px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <h3 style={{
                                            margin: 0,
                                            color: '#2d3748',
                                            textDecoration: todo.completed ? 'line-through' : 'none',
                                            fontSize: isMobile ? '14px' : '16px',
                                            wordBreak: 'break-word',
                                            fontWeight: '500'
                                        }}
                                            dangerouslySetInnerHTML={{ __html: linkify(todo.content) }}
                                        />
                                        {priorityBadge}
                                        {todo.completed && (
                                            <span style={{ fontSize: '14px' }}>✅</span>
                                        )}
                                    </div>

                                    {/* 提醒信息 */}
                                    {reminder && (
                                        <div style={{
                                            display: 'inline-block',
                                            background: reminder.bg,
                                            color: reminder.color,
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: isMobile ? '11px' : '13px',
                                            fontWeight: '500',
                                            marginBottom: '8px',
                                            marginRight: '8px'
                                        }}>
                                            {reminder.icon} {reminder.text}
                                        </div>
                                    )}

                                    {/* 元数据 */}
                                    <div style={{
                                        display: 'flex',
                                        gap: isMobile ? '8px' : '16px',
                                        fontSize: isMobile ? '11px' : '13px',
                                        color: '#718096',
                                        flexWrap: 'wrap'
                                    }} className={isMobile ? 'todo-meta-mobile' : ''}>
                                        <span>📁 {todo.category || '其他'}</span>
                                        {todo.due_date && (
                                            <span>⏱️ 截止: {todo.due_date}</span>
                                        )}
                                        {todo.time_estimate && (
                                            <span>⏳ 预估: {todo.time_estimate}</span>
                                        )}
                                    </div>
                                </div>

                                {/* 操作按钮 */}
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginLeft: isMobile ? 0 : '12px',
                                    marginTop: isMobile ? '10px' : 0,
                                    flexShrink: 0,
                                    justifyContent: isMobile ? 'flex-end' : 'flex-start'
                                }}>
                                    {!todo.completed && (
                                        <button onClick={() => markComplete(todo.id)} disabled={loading} style={{
                                            background: '#38a169',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            ✓ 完成
                                        </button>
                                    )}
                                    <button onClick={() => deleteTodo(todo.id)} disabled={loading} style={{
                                        background: '#fc8181',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 12px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}>
                                        🗑️ 删除
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TodoListTab;