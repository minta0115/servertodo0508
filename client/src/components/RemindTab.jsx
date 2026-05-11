import React, { useEffect, useState } from 'react';
import api from '../services/api';

const RemindTab = ({ isMobile = false, onAction }) => {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodos();
        // 检查通知权限
        checkNotificationPermission();

        // 每分钟检查提醒
        const interval = setInterval(checkAndNotify, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchTodos = async () => {
        try {
            const response = await api.get('/todos');
            setTodos(response.data || []);
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
        setLoading(false);
    };

    const checkNotificationPermission = () => {
        if (window.Notification && Notification.permission === 'default') {
            // 还未请求过权限
        }
    };

    const requestNotificationPermission = () => {
        if (window.Notification && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    alert('已开启通知权限！');
                } else {
                    alert('通知权限被拒绝，请在浏览器设置中开启');
                }
            });
        } else if (Notification.permission === 'denied') {
            alert('通知权限被拒绝，请在浏览器设置中开启');
        } else if (Notification.permission === 'granted') {
            alert('通知权限已开启');
        }
    };

    const checkAndNotify = () => {
        if (window.Notification && Notification.permission !== 'granted') return;

        const now = new Date();
        const soon = new Date(now.getTime() + 30 * 60000);

        todos.filter(t => !t.completed && !t.deleted && t.due_date).forEach(task => {
            const dueTime = new Date(task.due_date + 'T23:59:59');

            // 30分钟内到期
            if (dueTime <= soon && dueTime > now) {
                if (window.Notification) {
                    new Notification('⏰ 任务即将到期', {
                        body: task.content,
                        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>'
                    });
                }
            }

            // 已过期
            if (dueTime < now) {
                if (window.Notification) {
                    new Notification('❗ 任务已过期', {
                        body: task.content,
                        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚨</text></svg>'
                    });
                }
            }
        });
    };

    // 计算即将到期（30分钟内）和已过期的任务
    const getSoonTasks = () => {
        const now = new Date();
        const soon = new Date(now.getTime() + 30 * 60000);
        return todos.filter(t => {
            if (t.completed || t.deleted || !t.due_date) return false;
            const due = new Date(t.due_date + 'T23:59:59');
            return due > now && due <= soon;
        });
    };

    const getOverdueTasks = () => {
        const now = new Date();
        return todos.filter(t => {
            if (t.completed || t.deleted || !t.due_date) return false;
            const due = new Date(t.due_date + 'T23:59:59');
            return due < now;
        });
    };

    const markComplete = async (id) => {
        try {
            await api.put(`/todos/${id}`, { completed: true });
            fetchTodos();
            if (onAction) onAction();
        } catch (error) {
            console.error('Error completing todo:', error);
        }
    };

    const soonTasks = getSoonTasks();
    const overdueTasks = getOverdueTasks();

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>加载中...</div>;
    }

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }}>
            {/* 标题 */}
            <div style={{
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: '650',
                marginBottom: isMobile ? '10px' : '16px',
                color: '#1e293b'
            }}>
                ⏰ 提醒中心
            </div>

            {/* 提醒说明卡片 */}
            <div style={{
                background: 'white',
                borderRadius: isMobile ? '12px' : '14px',
                padding: isMobile ? '12px' : '16px',
                marginBottom: isMobile ? '12px' : '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
                <p style={{
                    fontSize: isMobile ? '13px' : '14px',
                    color: '#334155',
                    margin: 0,
                    lineHeight: '1.6'
                }}>
                    📢 提醒说明：<br />
                    · 任务到期前30分钟会有浏览器通知<br />
                    · 过期任务会显示在下方<br />
                    · 请允许浏览器通知权限以获得最佳体验
                </p>
                <button
                    onClick={requestNotificationPermission}
                    style={{
                        marginTop: '10px',
                        padding: '6px 14px',
                        background: '#4f6af5',
                        border: 'none',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}
                >
                    🔔 开启通知
                </button>
            </div>

            {/* 已过期任务 */}
            {overdueTasks.length > 0 && (
                <>
                    <div style={{
                        fontSize: isMobile ? '14px' : '15px',
                        fontWeight: '650',
                        color: '#dc2626',
                        marginBottom: isMobile ? '8px' : '12px'
                    }}>
                        ❗ 已过期 ({overdueTasks.length})
                    </div>
                    {overdueTasks.map(task => (
                        <div
                            key={task.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#fee2e2',
                                borderRadius: isMobile ? '10px' : '12px',
                                padding: isMobile ? '10px' : '12px',
                                marginBottom: '8px'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: isMobile ? '13px' : '14px',
                                    color: '#7c2d12',
                                    marginBottom: '2px'
                                }}>
                                    {task.content}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#b45309'
                                }}>
                                    📅 截止：{task.due_date}
                                </div>
                            </div>
                            <button
                                onClick={() => markComplete(task.id)}
                                style={{
                                    padding: '6px 12px',
                                    background: '#38a169',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    marginLeft: '8px'
                                }}
                            >
                                ✅ 完成
                            </button>
                        </div>
                    ))}
                </>
            )}

            {/* 即将到期任务 */}
            {soonTasks.length > 0 && (
                <>
                    <div style={{
                        fontSize: isMobile ? '14px' : '15px',
                        fontWeight: '650',
                        color: '#d97706',
                        marginBottom: isMobile ? '8px' : '12px',
                        marginTop: overdueTasks.length > 0 ? (isMobile ? '12px' : '16px') : 0
                    }}>
                        ⏳ 即将到期 ({soonTasks.length})
                    </div>
                    {soonTasks.map(task => (
                        <div
                            key={task.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#fff9e6',
                                borderRadius: isMobile ? '10px' : '12px',
                                padding: isMobile ? '10px' : '12px',
                                marginBottom: '8px'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: isMobile ? '13px' : '14px',
                                    color: '#92400e',
                                    marginBottom: '2px'
                                }}>
                                    {task.content}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#b45309'
                                }}>
                                    📅 截止：{task.due_date}
                                </div>
                            </div>
                            <button
                                onClick={() => markComplete(task.id)}
                                style={{
                                    padding: '6px 12px',
                                    background: '#38a169',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    marginLeft: '8px'
                                }}
                            >
                                ✅ 完成
                            </button>
                        </div>
                    ))}
                </>
            )}

            {/* 无提醒任务 */}
            {overdueTasks.length === 0 && soonTasks.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: isMobile ? '30px' : '40px',
                    color: '#9ca3af',
                    fontSize: isMobile ? '13px' : '14px'
                }}>
                    ✨ 暂时没有需要提醒的任务
                </div>
            )}
        </div>
    );
};

export default RemindTab;