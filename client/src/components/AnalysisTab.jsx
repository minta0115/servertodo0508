import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AnalysisTab = () => {
    const [todos, setTodos] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        byCategory: {}
    });
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/todos');
                const todoList = response.data;
                setTodos(todoList);

                const total = todoList.length;
                const completed = todoList.filter(t => t.completed).length;
                const pending = total - completed;

                const now = new Date();
                let overdue = 0;
                const byCategory = {};

                todoList.forEach(t => {
                    // 分类统计
                    const category = t.category || '其他';
                    byCategory[category] = (byCategory[category] || 0) + 1;

                    // 如果已完成则跳过
                    if (t.completed) return;

                    // 检查截止时间
                    if (t.due_date) {
                        const dueDate = new Date(t.due_date);
                        const diff = (dueDate - now) / (1000 * 60 * 60 * 24);
                        if (diff < 0) {
                            overdue++;
                        }
                    }
                });

                setStats({ total, completed, pending, overdue, byCategory });
                generateSuggestions(todoList, { total, completed, pending, overdue, byCategory });
            } catch (error) {
                console.error('Error fetching todos:', error);
            }
        };
        fetchStats();
    }, []);

    const generateSuggestions = (todoList, stats) => {
        const suggestions = [];

        // 建议1: 完成率
        if (stats.total > 0) {
            const completeRate = Math.round((stats.completed / stats.total) * 100);
            if (completeRate === 100) {
                suggestions.push({
                    type: 'success',
                    icon: '🎉',
                    text: '太棒了！您已完成所有待办事项！'
                });
            } else if (completeRate >= 75) {
                suggestions.push({
                    type: 'success',
                    icon: '👏',
                    text: `完成率${completeRate}%，继续加油！`
                });
            } else if (completeRate >= 50) {
                suggestions.push({
                    type: 'info',
                    icon: '📈',
                    text: `已完成${completeRate}%的任务，加速推进还有${stats.pending}个待办`
                });
            } else {
                suggestions.push({
                    type: 'warning',
                    icon: '⏰',
                    text: `完成率仅${completeRate}%，建议制定计划尽快完成${stats.pending}个待办`
                });
            }
        }

        // 建议2: 逾期任务
        if (stats.overdue > 0) {
            suggestions.push({
                type: 'danger',
                icon: '🚨',
                text: `⚠️ 有${stats.overdue}个逾期任务，请立即处理！`
            });
        }

        // 建议3: 分类建议
        const categories = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
        if (categories.length > 0) {
            const topCategory = categories[0];
            suggestions.push({
                type: 'info',
                icon: '📂',
                text: `${topCategory[0]}类任务最多（${topCategory[1]}个），建议按优先级分类处理`
            });
        }

        // 建议4: 平衡建议
        if (stats.pending > 5) {
            suggestions.push({
                type: 'info',
                icon: '⚖️',
                text: `待办任务较多（${stats.pending}个），建议分解成更小的子任务`
            });
        } else if (stats.pending === 0 && stats.total > 0) {
            suggestions.push({
                type: 'success',
                icon: '✨',
                text: '完美！所有任务都已完成，来添加新任务继续前进吧！'
            });
        }

        // 建议5: 每日建议
        const completedToday = todoList.filter(t => {
            const createdDate = new Date(t.created_at).toDateString();
            const today = new Date().toDateString();
            return t.completed && createdDate === today;
        }).length;

        if (completedToday > 0) {
            suggestions.push({
                type: 'success',
                icon: '💪',
                text: `今天已完成${completedToday}个任务，保持这个势头！`
            });
        } else if (stats.pending > 0) {
            suggestions.push({
                type: 'info',
                icon: '📅',
                text: '今天还没有完成任务，建议从最重要的一个开始'
            });
        }

        setSuggestions(suggestions);
    };

    const StatCard = ({ label, value, color, size = 'normal' }) => (
        <div style={{
            background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
            border: `2px solid ${color}`,
            color: color,
            padding: size === 'small' ? '12px' : '20px',
            borderRadius: '12px',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: size === 'small' ? '12px' : '14px', opacity: 0.8 }}>
                {label}
            </div>
            <p style={{ fontSize: size === 'small' ? '24px' : '32px', margin: '8px 0 0 0', fontWeight: 'bold' }}>
                {value}
            </p>
        </div>
    );

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#2d3748' }}>📊 待办分析</h2>

            {/* 指标卡片 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
                marginBottom: '24px'
            }}>
                <StatCard label="总待办" value={stats.total} color="#38a169" size="small" />
                <StatCard label="已完成" value={stats.completed} color="#48bb78" size="small" />
                <StatCard label="待完成" value={stats.pending} color="#ed8936" size="small" />
                <StatCard label="逾期任务" value={stats.overdue} color="#f56565" size="small" />
            </div>

            {/* 完成率进度条 */}
            {stats.total > 0 && (
                <div style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>完成进度</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#38a169' }}>
                            {Math.round((stats.completed / stats.total) * 100)}%
                        </span>
                    </div>
                    <div style={{
                        height: '8px',
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #38a169 0%, #68d391 100%)',
                            width: `${(stats.completed / stats.total) * 100}%`,
                            transition: 'width 0.3s'
                        }}></div>
                    </div>
                </div>
            )}

            {/* AI建议 */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2d3748', fontSize: '16px' }}>
                    🤖 AI智能建议
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {suggestions.map((suggestion, index) => (
                        <div key={index} style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: suggestion.type === 'danger' ? '#fed7d7' :
                                       suggestion.type === 'warning' ? '#feebc8' :
                                       suggestion.type === 'success' ? '#c6f6d5' :
                                       '#bee3f8',
                            borderLeft: `4px solid ${
                                suggestion.type === 'danger' ? '#f56565' :
                                suggestion.type === 'warning' ? '#ed8936' :
                                suggestion.type === 'success' ? '#38a169' :
                                '#3182ce'
                            }`,
                            color: suggestion.type === 'danger' ? '#c53030' :
                                   suggestion.type === 'warning' ? '#7c2d12' :
                                   suggestion.type === 'success' ? '#22543d' :
                                   '#2c5282'
                        }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
                                <span style={{ fontSize: '16px' }}>{suggestion.icon}</span>
                                <span>{suggestion.text}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalysisTab;