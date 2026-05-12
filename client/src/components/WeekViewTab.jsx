import React, { useEffect, useState } from 'react';
import api from '../services/api';

const WeekViewTab = ({ isMobile = false, onDayClick }) => {
    const [todos, setTodos] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const [hoveredDay, setHoveredDay] = useState(null);

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const response = await api.get('/todos');
            setTodos(response.data || []);
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
    };

    // 获取本周周一到周日的日期
    const getWeekDates = (offset = 0) => {
        const now = new Date();
        const day = now.getDay() || 7; // 周日=7
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + 1 + (offset * 7));

        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            week.push(d.toISOString().slice(0, 10));
        }
        return week;
    };

    const week = getWeekDates(weekOffset);
    const today = new Date().toISOString().slice(0, 10);

    // 统计每天的任务数
    const countMap = {};
    const todoMap = {}; // 存储每天的具体待办
    week.forEach(d => {
        countMap[d] = 0;
        todoMap[d] = [];
    });
    let unscheduled = 0;

    todos.filter(t => !t.deleted).forEach(t => {
        if (t.due_date && countMap.hasOwnProperty(t.due_date)) {
            countMap[t.due_date]++;
            todoMap[t.due_date].push(t);
        } else if (!t.due_date) {
            unscheduled++;
        }
    });

    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const weekLabel = `${week[0]} ~ ${week[6]}`;

    // 根据数量获取颜色样式
    const getDayStyle = (count, isToday, isHovered) => {
        const baseStyle = {
            flex: 1,
            background: 'white',
            borderRadius: isMobile ? '10px' : '12px',
            padding: isMobile ? '8px 4px' : '10px 4px',
            textAlign: 'center',
            fontSize: '13px',
            border: '1px solid #e9ecf2',
            cursor: count > 0 ? 'pointer' : 'default',
            transition: '0.2s',
            position: 'relative'
        };

        if (isToday) {
            return { ...baseStyle, background: '#dcfce7', borderColor: '#86efac' };
        }

        if (count === 0) return { ...baseStyle };
        if (count === 1) return { ...baseStyle, background: '#fef9c3' };
        if (count === 2) return { ...baseStyle, background: '#fed7aa' };
        if (count === 3) return { ...baseStyle, background: '#fecaca' };
        return { ...baseStyle, background: '#fca5a5', fontSize: '15px', fontWeight: '700' };
    };

    const getDayNumColor = (count) => {
        if (count === 0) return '#cbd5e1';
        if (count === 1) return '#f59e0b';
        if (count === 2) return '#f97316';
        return '#ef4444';
    };

    const handleDayClick = (date) => {
        const count = countMap[date];
        if (count > 0 && onDayClick) {
            onDayClick(date);
        }
    };

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }}>
            {/* 周导航 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: isMobile ? '8px' : '12px',
                gap: '8px'
            }}>
                <button
                    onClick={() => setWeekOffset(w => w - 1)}
                    style={{
                        background: '#4f6af5',
                        border: 'none',
                        color: 'white',
                        padding: isMobile ? '5px 10px' : '6px 12px',
                        borderRadius: '20px',
                        fontSize: isMobile ? '12px' : '14px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    ◀ 上周
                </button>
                <button
                    onClick={() => setWeekOffset(0)}
                    style={{
                        background: '#16a34a',
                        border: 'none',
                        color: 'white',
                        padding: isMobile ? '5px 10px' : '6px 12px',
                        borderRadius: '20px',
                        fontSize: isMobile ? '12px' : '14px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    本周
                </button>
                <button
                    onClick={() => setWeekOffset(w => w + 1)}
                    style={{
                        background: '#4f6af5',
                        border: 'none',
                        color: 'white',
                        padding: isMobile ? '5px 10px' : '6px 12px',
                        borderRadius: '20px',
                        fontSize: isMobile ? '12px' : '14px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    下周 ▶
                </button>
            </div>

            {/* 周日期范围 */}
            <div style={{
                textAlign: 'center',
                fontSize: isMobile ? '13px' : '14px',
                color: '#334155',
                marginBottom: isMobile ? '10px' : '14px'
            }}>
                {weekLabel}
            </div>

            {/* 周格子 */}
            <div style={{
                display: 'flex',
                gap: isMobile ? '5px' : '8px',
                marginBottom: isMobile ? '10px' : '16px'
            }}>
                {week.map((date, i) => {
                    const count = countMap[date];
                    const dayTodos = todoMap[date] || [];
                    const isToday = date === today;
                    const isHovered = hoveredDay === date;
                    const dayStyle = getDayStyle(count, isToday, isHovered);

                    return (
                        <div
                            key={date}
                            style={dayStyle}
                            onClick={() => handleDayClick(date)}
                            onMouseEnter={() => setHoveredDay(date)}
                            onMouseLeave={() => setHoveredDay(null)}
                        >
                            <div style={{
                                color: '#64748b',
                                marginBottom: isMobile ? '4px' : '6px',
                                fontSize: isMobile ? '11px' : '12px'
                            }}>
                                {dayNames[i]}
                            </div>
                            <div style={{
                                fontSize: isMobile ? '16px' : '18px',
                                fontWeight: '700',
                                color: getDayNumColor(count),
                                margin: '4px 0'
                            }}>
                                {count}
                            </div>
                            <div style={{
                                fontSize: '11px',
                                color: '#94a3b8'
                            }}>
                                {date.slice(5)}
                            </div>

                            {/* Hover tooltip */}
                            {isHovered && dayTodos.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    zIndex: 100,
                                    minWidth: '120px',
                                    maxWidth: '200px',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#1e293b',
                                        marginBottom: '6px',
                                        borderBottom: '1px solid #e9ecf2',
                                        paddingBottom: '4px'
                                    }}>
                                        📅 {date} 共{count}项
                                    </div>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                        {dayTodos.slice(0, 5).map((t, idx) => (
                                            <div key={idx} style={{
                                                fontSize: '11px',
                                                color: '#475569',
                                                marginBottom: '2px',
                                                padding: '2px 0',
                                                borderBottom: idx < dayTodos.length - 1 ? '1px dashed #f1f5f9' : 'none'
                                            }}>
                                                {t.completed ? '✅ ' : '⬜ '}{t.content.substring(0, 20)}{t.content.length > 20 ? '...' : ''}
                                            </div>
                                        ))}
                                        {dayTodos.length > 5 && (
                                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                                还有{dayTodos.length - 5}项...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Today indicator */}
                            {isToday && count === 0 && (
                                <div style={{
                                    fontSize: '10px',
                                    color: '#16a34a',
                                    marginTop: '4px'
                                }}>
                                    今日无待办
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 无截止日期提示 */}
            {unscheduled > 0 && (
                <div style={{
                    marginTop: '8px',
                    color: '#6b7280',
                    fontSize: isMobile ? '12px' : '13px'
                }}>
                    📌 无截止日期：{unscheduled}项
                </div>
            )}
        </div>
    );
};

export default WeekViewTab;