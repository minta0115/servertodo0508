import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AIAnalysisModal = ({ isMobile = false, onClose, rangeType = 'today' }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        initializeDates();
        fetchAnalysis();
    }, [rangeType]);

    const initializeDates = () => {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        if (rangeType === 'today') {
            setDateRange({ start: todayStr, end: todayStr });
        } else if (rangeType === 'week') {
            const day = today.getDay() || 7;
            const monday = new Date(today);
            monday.setDate(today.getDate() - day + 1);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            setDateRange({
                start: monday.toISOString().slice(0, 10),
                end: sunday.toISOString().slice(0, 10)
            });
        } else if (rangeType === 'custom') {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            setDateRange({
                start: weekAgo.toISOString().slice(0, 10),
                end: todayStr
            });
        }
    };

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const response = await api.get('/todos');
            const allTodos = response.data || [];

            const rangeTodos = allTodos.filter(t => {
                if (!t.created_at) return false;
                const created = t.created_at.slice(0, 10);
                return created >= dateRange.start && created <= dateRange.end;
            });

            const completedTodos = rangeTodos.filter(t => t.completed && !t.deleted);
            const deletedTodos = rangeTodos.filter(t => t.deleted);
            const pendingTodos = rangeTodos.filter(t => !t.completed && !t.deleted);

            // 构建AI分析数据
            const analysisData = {
                period: `${dateRange.start} 至 ${dateRange.end}`,
                totalCreated: rangeTodos.length,
                totalCompleted: completedTodos.length,
                totalDeleted: deletedTodos.length,
                totalPending: pendingTodos.length,
                completionRate: rangeTodos.length > 0 ? Math.round((completedTodos.length / rangeTodos.length) * 100) : 0,
                completedItems: completedTodos.map(t => ({
                    content: t.content,
                    category: t.category,
                    completedAt: t.completed_at || t.updated_at
                })),
                deletedItems: deletedTodos.map(t => ({
                    content: t.content,
                    category: t.category
                })),
                pendingItems: pendingTodos.map(t => ({
                    content: t.content,
                    category: t.category,
                    dueDate: t.due_date
                }))
            };

            // 生成分析报告
            const reportText = generateReport(analysisData);
            setReport({
                ...analysisData,
                aiReport: reportText,
                generatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error fetching analysis:', error);
            setReport({
                aiReport: '获取数据失败，请稍后重试',
                generatedAt: new Date().toISOString()
            });
        }
        setLoading(false);
    };

    const generateReport = (data) => {
        const lines = [];

        lines.push(`📊 **${data.period} 待办分析报告**\n`);
        lines.push(`━━━━━━━━━━━━━━━━━━━━\n`);

        lines.push(`📈 **数据概览**`);
        lines.push(`• 新建待办：${data.totalCreated} 项`);
        lines.push(`• 已完成：${data.totalCompleted} 项`);
        lines.push(`• 已删除：${data.totalDeleted} 项`);
        lines.push(`• 当前待完成：${data.totalPending} 项`);
        lines.push(`• 完成率：${data.completionRate}%\n`);

        if (data.completedItems.length > 0) {
            lines.push(`✅ **已完成清单** (${data.completedItems.length}项)`);
            data.completedItems.forEach((item, i) => {
                const date = item.completedAt ? item.completedAt.slice(0, 10) : '未知';
                lines.push(`  ${i + 1}. [${item.category}] ${item.content.substring(0, 30)}${item.content.length > 30 ? '...' : ''} (${date})`);
            });
            lines.push('');
        }

        if (data.pendingItems.length > 0) {
            lines.push(`⏳ **当前待办** (${data.pendingItems.length}项)`);
            data.pendingItems.forEach((item, i) => {
                lines.push(`  ${i + 1}. [${item.category}] ${item.content.substring(0, 30)}${item.content.length > 30 ? '...' : ''}${item.dueDate ? ` - 截止${item.dueDate}` : ''}`);
            });
            lines.push('');
        }

        // AI总结
        lines.push(`💡 **AI 分析总结**\n`);
        if (data.completionRate >= 80) {
            lines.push('🎉 完成率表现优异！继续保持良好的工作节奏。');
        } else if (data.completionRate >= 50) {
            lines.push('📈 完成率中等，建议优化待办管理策略。');
        } else if (data.totalCreated > 0 && data.completionRate < 50) {
            lines.push('⚠️ 完成率偏低，建议审视待办难度设置是否合理。');
        }

        if (data.pendingItems.length > 3) {
            lines.push(`\n📋 当前有 ${data.pendingItems.length} 项待办，建议按优先级排序处理。`);
        }

        return lines.join('\n');
    };

    const getRangeTitle = () => {
        if (rangeType === 'today') return '📅 今日分析';
        if (rangeType === 'week') return '📆 本周分析';
        return '📊 自定义分析';
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '10px' : '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: isMobile ? '16px 16px 0 0' : '20px',
                width: '100%',
                maxWidth: '700px',
                maxHeight: isMobile ? '90vh' : '85vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '14px 16px' : '16px 20px',
                    borderBottom: '1px solid #e9ecf2',
                    background: '#f8fafc'
                }}>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', color: '#1e293b' }}>
                        {getRangeTitle()}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={fetchAnalysis}
                            style={{
                                padding: '6px 14px',
                                background: '#4f6af5',
                                border: 'none',
                                borderRadius: '20px',
                                color: 'white',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 刷新
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '6px 14px',
                                background: '#e2e8f0',
                                border: 'none',
                                borderRadius: '20px',
                                color: '#475569',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            ✕ 关闭
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: isMobile ? '14px' : '20px'
                }}>
                    {loading ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#718096'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳ 分析中...</div>
                            <div>正在汇总待办数据并生成报告</div>
                        </div>
                    ) : report ? (
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.7' }}>
                            {report.aiReport.split('\n').map((line, i) => {
                                if (line.includes('**')) {
                                    const clean = line.replace(/\*\*/g, '');
                                    return (
                                        <div key={i} style={{
                                            fontWeight: '600',
                                            color: '#1e293b',
                                            fontSize: '15px',
                                            marginTop: i > 0 ? '16px' : '0'
                                        }}>
                                            {clean}
                                        </div>
                                    );
                                }
                                if (line.startsWith('•') || line.startsWith('  ')) {
                                    return (
                                        <div key={i} style={{
                                            color: '#475569',
                                            paddingLeft: line.startsWith('  ') ? '20px' : '0',
                                            marginTop: '4px'
                                        }}>
                                            {line}
                                        </div>
                                    );
                                }
                                if (line.includes('━')) {
                                    return <div key={i} style={{ color: '#e2e8f0', margin: '8px 0' }}>{line}</div>;
                                }
                                return (
                                    <div key={i} style={{ color: '#334155', marginTop: '4px' }}>
                                        {line}
                                    </div>
                                );
                            })}

                            {/* Generated timestamp */}
                            <div style={{
                                marginTop: '20px',
                                paddingTop: '12px',
                                borderTop: '1px solid #e9ecf2',
                                fontSize: '11px',
                                color: '#94a3b8',
                                textAlign: 'right'
                            }}>
                                报告生成时间：{new Date(report.generatedAt).toLocaleString('zh-CN')}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                            暂无数据
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAnalysisModal;