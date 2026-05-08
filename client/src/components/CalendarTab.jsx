import React, { useEffect, useState } from 'react';
import api from '../services/api';

const CalendarTab = ({ onJumpToTodos, isMobile = false }) => {
    const [todos, setTodos] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const response = await api.get('/todos');
                setTodos(response.data);
            } catch (error) {
                console.error('Error fetching todos:', error);
            }
        };
        fetchTodos();
    }, []);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(i);
        }

        return days;
    };

    const getTodosForDay = (day) => {
        if (!day) return [];
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return todos.filter(t => t.created_at.startsWith(dateStr));
    };

    const days = getDaysInMonth(currentMonth);
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }} className={isMobile ? 'calendar-container' : ''}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>日历视图</h2>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMobile ? '12px' : '20px',
                flexWrap: 'wrap',
                gap: '10px'
            }} className={isMobile ? 'calendar-header' : ''}>
                <button
                    onClick={handlePrevMonth}
                    style={{
                        padding: isMobile ? '8px 14px' : '10px 20px',
                        background: '#b2f5ea',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: '500',
                        color: '#2d3748'
                    }}
                >
                    ◀ 上月
                </button>
                <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem' }}>{currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月</h3>
                <button
                    onClick={handleNextMonth}
                    style={{
                        padding: isMobile ? '8px 14px' : '10px 20px',
                        background: '#b2f5ea',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: '500',
                        color: '#2d3748'
                    }}
                >
                    下月 ▶
                </button>
            </div>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                borderRadius: isMobile ? '8px' : '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
            }} className={isMobile ? 'calendar-grid-mobile' : ''}>
                <thead>
                    <tr>
                        {dayNames.map(day => (
                            <th key={day} style={{
                                padding: isMobile ? '6px' : '10px',
                                background: '#f7fafc',
                                border: '1px solid #e2e8f0',
                                fontSize: isMobile ? '11px' : '14px'
                            }}>{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
                        <tr key={weekIndex}>
                            {Array.from({ length: 7 }, (_, dayIndex) => {
                                const day = days[weekIndex * 7 + dayIndex];
                                const dayTodos = getTodosForDay(day);
                                return (
                                    <td key={dayIndex} style={{
                                        padding: isMobile ? '4px' : '10px',
                                        border: '1px solid #e2e8f0',
                                        height: isMobile ? '50px' : '80px',
                                        verticalAlign: 'top',
                                        background: day ? 'white' : '#f7fafc'
                                    }} className={isMobile ? 'calendar-day-mobile' : ''}>
                                        {day && (
                                            <>
                                                <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: isMobile ? '12px' : '14px' }}>{day}</div>
                                                {dayTodos.length > 0 && (
                                                    <div
                                                        onClick={() => onJumpToTodos && onJumpToTodos()}
                                                        style={{
                                                            background: '#38a169',
                                                            color: 'white',
                                                            borderRadius: '12px',
                                                            padding: isMobile ? '2px 6px' : '4px 10px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: isMobile ? '10px' : '12px',
                                                            cursor: 'pointer',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = '#2f855a'}
                                                        onMouseLeave={(e) => e.target.style.background = '#38a169'}
                                                    >
                                                        📋 {dayTodos.length}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CalendarTab;
