import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';

const DEFAULT_STRUCTURE = {
    '日常工作': ['客户经营', '过程与指标管理'],
    '个人学习': ['认证与体系化学习', '碎片化输入与补充学习'],
    '社交成长': ['社交成长'],
    '专项': ['专项']
};

const TodoListTab = ({
    isMobile = false,
    filterDate = null,
    extraFilter = null,
    directionFilter = null,
    subCategoryFilter = null,
    onFilterClear = null
}) => {
    const [todos, setTodos] = useState([]);
    const [filter, setFilter] = useState('all');
    const [directionFilterState, setDirectionFilterState] = useState('all');
    const [showCompleted, setShowCompleted] = useState(false);
    const [loading, setLoading] = useState(false);
    const listRef = useRef(null);

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
        // Optimistic UI update - remove from pending list immediately
        const todoEl = document.getElementById(`todo-${id}`);
        if (todoEl) {
            todoEl.style.transition = 'all 0.3s';
            todoEl.style.opacity = '0';
            todoEl.style.transform = 'translateX(20px)';
            setTimeout(() => {
                todoEl.style.display = 'none';
            }, 300);
        }

        try {
            await api.put(`/todos/${id}`, { completed: true });
            // Update local state
            setTodos(prev => prev.map(t =>
                t.id === id ? { ...t, completed: true, completed_at: new Date().toISOString() } : t
            ));
        } catch (error) {
            alert('Error updating todo');
            fetchTodos(); // Revert on error
        }
    };

    const deleteTodo = async (id) => {
        const todo = todos.find(t => t.id === id);
        const todoContent = todo ? todo.content.substring(0, 20) : '';

        // Optimistic UI update
        const todoEl = document.getElementById(`todo-${id}`);
        if (todoEl) {
            todoEl.style.transition = 'all 0.3s';
            todoEl.style.opacity = '0';
            todoEl.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                todoEl.style.display = 'none';
            }, 300);
        }

        try {
            await api.delete(`/todos/${id}`);
            setTodos(prev => prev.filter(t => t.id !== id));

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
            fetchTodos();
        }
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

    // 日期过滤
    if (filterDate) {
        filteredTodos = filteredTodos.filter(t => t.due_date === filterDate);
    }

    // 方向+子类过滤（来自方向Tab）
    if (directionFilter && subCategoryFilter) {
        filteredTodos = filteredTodos.filter(t =>
            (t.direction || '其他') === directionFilter &&
            (t.subCategory || '其他') === subCategoryFilter
        );
    } else if (directionFilter) {
        filteredTodos = filteredTodos.filter(t =>
            (t.direction || '其他') === directionFilter
        );
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
    }

    // 状态过滤
    if (filter === 'completed') {
        filteredTodos = filteredTodos.filter(t => t.completed);
    } else if (filter === 'pending') {
        filteredTodos = filteredTodos.filter(t => !t.completed);
    }

    // 按创建时间升序排列（最早的最前）
    filteredTodos.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeA - timeB;
    });

    // 未完成和已完成的分离
    const pendingTodos = filteredTodos.filter(t => !t.completed);
    const completedTodos = filteredTodos.filter(t => t.completed);

    // 按方向>子类分组
    const groupByDirection = (todoList) => {
        const groups = {};
        todoList.forEach(todo => {
            const dir = todo.direction || '其他';
            const sub = todo.subCategory || '其他';
            const key = `${dir}__${sub}`;
            if (!groups[key]) {
                groups[key] = { direction: dir, subCategory: sub, items: [] };
            }
            groups[key].items.push(todo);
        });
        return Object.values(groups).sort((a, b) => {
            const dirOrder = Object.keys(DEFAULT_STRUCTURE);
            const aIdx = dirOrder.indexOf(a.direction);
            const bIdx = dirOrder.indexOf(b.direction);
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        });
    };

    const groupedPending = groupByDirection(pendingTodos);
    const groupedCompleted = groupByDirection(completedTodos);

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
    const showDirectionFilter = directionFilter && subCategoryFilter;
    const hasActiveFilter = showDateFilter || showDirectionFilter || extraFilter;

    // 构建过滤标签文字
    const getFilterLabel = () => {
        if (showDateFilter) return `📅 ${showDateFilter}`;
        if (extraFilter === 'high') return '⚡ 高优先级任务';
        if (extraFilter === 'overdue') return '❗ 已过期任务';
        if (extraFilter === 'completedToday') return '✅ 今日已完成';
        if (showDirectionFilter) return `🧭 ${directionFilter} › ${subCategoryFilter}`;
        return null;
    };

    const handleClearFilter = () => {
        if (onFilterClear) onFilterClear();
        else {
            // Default clear behavior
            setDirectionFilterState('all');
        }
    };

    // 渲染单个待办项
    const renderTodoItem = (todo, isCompleted = false) => {
        const reminder = getReminder(todo);
        const priorityBadge = getPriorityBadge(todo);

        const itemStyle = isMobile ? {
            background: isCompleted ? '#f7fafc' : 'white',
            borderRadius: '10px',
            padding: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            opacity: isCompleted ? 0.7 : 1,
            transition: 'all 0.3s'
        } : {
            background: isCompleted ? '#f7fafc' : 'white',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            opacity: isCompleted ? 0.7 : 1,
            transition: 'all 0.3s'
        };

        return (
            <div key={todo.id} id={`todo-${todo.id}`} style={itemStyle} className={isMobile ? 'todo-item-mobile' : ''}>
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
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            fontSize: isMobile ? '14px' : '15px',
                            wordBreak: 'break-word',
                            fontWeight: '500'
                        }}
                            dangerouslySetInnerHTML={{ __html: linkify(todo.content) }}
                        />
                        {priorityBadge}
                        {isCompleted && (
                            <span style={{ fontSize: '14px' }}>✅</span>
                        )}
                    </div>

                    {/* 方向/子类标签 */}
                    {(todo.direction || todo.subCategory) && (
                        <div style={{
                            display: 'inline-block',
                            background: '#eef2ff',
                            color: '#4f6af5',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            marginBottom: '8px',
                            marginRight: '8px'
                        }}>
                            {todo.direction || '其他'} › {todo.subCategory || '其他'}
                        </div>
                    )}

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
                {!isCompleted && (
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginLeft: isMobile ? 0 : '12px',
                        marginTop: isMobile ? '10px' : 0,
                        flexShrink: 0,
                        justifyContent: isMobile ? 'flex-end' : 'flex-start'
                    }}>
                        <button onClick={() => markComplete(todo.id)} style={{
                            background: '#38a169',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}>
                            ✓ 完成
                        </button>
                        <button onClick={() => deleteTodo(todo.id)} style={{
                            background: '#fc8181',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}>
                            🗑️ 删除
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // 渲染分组
    const renderGroup = (group, isCompleted = false) => (
        <div key={`${group.direction}__${group.subCategory}`} style={{ marginBottom: '16px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
                fontSize: isMobile ? '12px' : '13px',
                color: '#4f6af5',
                fontWeight: '600'
            }}>
                <span>📂</span>
                <span>{group.direction}</span>
                <span style={{ color: '#a0aec0' }}>›</span>
                <span>{group.subCategory}</span>
                <span style={{
                    background: '#eef2ff',
                    padding: '0 6px',
                    borderRadius: '8px',
                    fontSize: '11px'
                }}>
                    {group.items.length}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px' }}>
                {group.items.map(todo => renderTodoItem(todo, isCompleted))}
            </div>
        </div>
    );

    const hasAnyContent = pendingTodos.length > 0 || completedTodos.length > 0;

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }} className={isMobile ? 'content-area' : ''} ref={listRef}>
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
                    <span>{getFilterLabel()}</span>
                    <button
                        onClick={handleClearFilter}
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
            {!extraFilter && !filterDate && !showDirectionFilter && (
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

            {/* 待办列表 */}
            {!hasAnyContent ? (
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
                <div>
                    {/* 未完成列表 */}
                    {groupedPending.length > 0 && (
                        <div>
                            {groupedPending.map(group => renderGroup(group, false))}
                        </div>
                    )}

                    {/* 已完成区域 */}
                    {groupedCompleted.length > 0 && (
                        <div style={{
                            marginTop: '20px',
                            borderTop: '1px solid #e9ecf2',
                            paddingTop: '16px'
                        }}>
                            <div
                                onClick={() => setShowCompleted(!showCompleted)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    background: showCompleted ? '#f0fff4' : '#f7fafc',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    marginBottom: showCompleted ? '12px' : 0
                                }}
                            >
                                <span style={{
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    color: '#38a169'
                                }}>
                                    ✅ 已完成 ({completedTodos.length})
                                </span>
                                <span style={{ color: '#718096', fontSize: '14px' }}>
                                    {showCompleted ? '▲ 收起' : '▼ 展开'}
                                </span>
                            </div>

                            {showCompleted && (
                                <div>
                                    {groupedCompleted.map(group => renderGroup(group, true))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TodoListTab;