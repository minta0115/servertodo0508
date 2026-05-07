import React, { useEffect, useState } from 'react';
import api from '../services/api';

const CalendarTab = () => {
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

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add days of the month
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

    return (
        <div style={{ padding: '20px' }}>
            <h2>日历视图</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                    &lt; 上月
                </button>
                <h3>{currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月</h3>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                    下月 &gt;
                </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
                <thead>
                    <tr>
                        {dayNames.map(day => (
                            <th key={day} style={{ padding: '10px', background: '#f7fafc', border: '1px solid #e2e8f0' }}>{day}</th>
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
                                        padding: '10px',
                                        border: '1px solid #e2e8f0',
                                        height: '80px',
                                        verticalAlign: 'top',
                                        background: day ? 'white' : '#f7fafc'
                                    }}>
                                        {day && (
                                            <>
                                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{day}</div>
                                                {dayTodos.length > 0 && (
                                                    <div style={{
                                                        background: '#38a169',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: '20px',
                                                        height: '20px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px'
                                                    }}>
                                                        {dayTodos.length}
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