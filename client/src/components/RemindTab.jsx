import React, { useEffect, useState } from 'react';
import api from '../services/api';

const RemindTab = ({ isMobile = false, onAction }) => {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [reminderMinutes, setReminderMinutes] = useState(30);
    const [notificationPermission, setNotificationPermission] = useState('default');

    useEffect(() => {
        loadSettings();
        fetchTodos();
    }, []);

    // 加载设置
    const loadSettings = () => {
        const saved = localStorage.getItem('remindSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            setNotificationsEnabled(settings.enabled || false);
            setReminderMinutes(settings.minutes || 30);
        }
        if (window.Notification) {
            setNotificationPermission(Notification.permission);
        }
    };

    const saveSettings = (enabled, minutes) => {
        localStorage.setItem('remindSettings', JSON.stringify({
            enabled,
            minutes
        }));
    };

    const fetchTodos = async () => {
        try {
            const response = await api.get('/todos');
            setTodos(response.data || []);
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
        setLoading(false);
    };

    const requestNotificationPermission = () => {
        if (window.Notification) {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    alert('已开启通知权限！');
                } else if (permission === 'denied') {
                    alert('通知权限被拒绝，请在浏览器设置中开启');
                }
            });
        }
    };

    const toggleNotifications = () => {
        if (!notificationsEnabled) {
            // 开启通知
            if (notificationPermission !== 'granted') {
                requestNotificationPermission();
                return;
            }
            setNotificationsEnabled(true);
            saveSettings(true, reminderMinutes);
        } else {
            // 关闭通知
            setNotificationsEnabled(false);
            saveSettings(false, reminderMinutes);
        }
    };

    // 计算即将到期和已过期的任务
    const getSoonTasks = () => {
        const now = new Date();
        const soon = new Date(now.getTime() + reminderMinutes * 60000);
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

    const handleMinutesChange = (e) => {
        const val = parseInt(e.target.value) || 30;
        setReminderMinutes(val);
        if (notificationsEnabled) {
            saveSettings(true, val);
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

            {/* 通知设置卡片 */}
            <div style={{
                background: 'white',
                borderRadius: isMobile ? '12px' : '14px',
                padding: isMobile ? '12px' : '16px',
                marginBottom: isMobile ? '12px' : '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
                <div style={{
                    fontSize: isMobile ? '14px' : '15px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '12px'
                }}>
                    🔔 通知设置
                </div>

                {/* 开启/关闭通知 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                }}>
                    <div>
                        <div style={{ fontSize: '13px', color: '#334155', marginBottom: '2px' }}>
                            浏览器提醒
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {notificationsEnabled ? '已开启' : '已关闭'}
                        </div>
                    </div>
                    <button
                        onClick={toggleNotifications}
                        style={{
                            padding: '6px 16px',
                            background: notificationsEnabled ? '#38a169' : '#e2e8f0',
                            border: 'none',
                            borderRadius: '20px',
                            color: notificationsEnabled ? 'white' : '#475569',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {notificationsEnabled ? '✓ 已开启' : '开启通知'}
                    </button>
                </div>

                {/* 提醒时间设置 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    background: '#f8fafc',
                    borderRadius: '10px'
                }}>
                    <div>
                        <div style={{ fontSize: '13px', color: '#334155', marginBottom: '2px' }}>
                            提前提醒时间
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            到期前多久提醒你
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                            value={reminderMinutes}
                            onChange={handleMinutesChange}
                            disabled={!notificationsEnabled}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '13px',
                                background: notificationsEnabled ? 'white' : '#f1f5f9',
                                cursor: notificationsEnabled ? 'pointer' : 'not-allowed'
                            }}
                        >
                            <option value="5">5分钟</option>
                            <option value="10">10分钟</option>
                            <option value="15">15分钟</option>
                            <option value="30">30分钟</option>
                            <option value="60">1小时</option>
                            <option value="120">2小时</option>
                            <option value="1440">1天</option>
                        </select>
                    </div>
                </div>

                {notificationPermission === 'denied' && (
                    <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        background: '#fef3c7',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#92400e'
                    }}>
                        ⚠️ 通知权限被拒绝，请在浏览器设置中允许通知
                    </div>
                )}
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