import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DEFAULT_STRUCTURE = {
    '日常工作': ['客户经营', '过程与指标管理'],
    '个人学习': ['认证与体系化学习', '碎片化输入与补充学习'],
    '社交成长': ['社交成长'],
    '专项': ['专项']
};

const DirectionTab = ({ isMobile = false, onCategoryClick }) => {
    const [todos, setTodos] = useState([]);
    const [expandedDirs, setExpandedDirs] = useState({});
    const [directionStructure, setDirectionStructure] = useState(DEFAULT_STRUCTURE);

    useEffect(() => {
        fetchTodos();
        loadDirectionConfig();
    }, []);

    const fetchTodos = async () => {
        try {
            const response = await api.get('/todos');
            setTodos(response.data || []);
        } catch (error) {
            console.error('Error fetching todos');
        }
    };

    const loadDirectionConfig = () => {
        try {
            const saved = localStorage.getItem('todo_direction_config');
            if (saved) {
                const config = JSON.parse(saved);
                if (config.structure) {
                    setDirectionStructure(config.structure);
                }
            }
        } catch (e) {
            console.log('Using default direction structure');
        }
    };

    const toggleDir = (dir) => {
        setExpandedDirs(prev => ({ ...prev, [dir]: !prev[dir] }));
    };

    // Count todos by direction and subCategory
    const getCounts = () => {
        const counts = {};
        todos.filter(t => !t.deleted && !t.completed).forEach(todo => {
            const dir = todo.direction || '其他';
            const sub = todo.subCategory || '其他';
            if (!counts[dir]) counts[dir] = { _total: 0 };
            if (!counts[dir][sub]) counts[dir][sub] = 0;
            counts[dir]._total++;
            counts[dir][sub]++;
        });
        return counts;
    };

    const counts = getCounts();

    const getDirTotal = (dir) => {
        const dirCounts = counts[dir] || {};
        return Object.entries(dirCounts)
            .filter(([k]) => k !== '_total')
            .reduce((sum, [, c]) => sum + c, 0);
    };

    const getPendingCount = (dir) => {
        return todos.filter(t =>
            !t.deleted && !t.completed && (t.direction || '其他') === dir
        ).length;
    };

    const getPendingSubCount = (dir, sub) => {
        return todos.filter(t =>
            !t.deleted && !t.completed &&
            (t.direction || '其他') === dir &&
            (t.subCategory || '其他') === sub
        ).length;
    };

    return (
        <div style={{ padding: isMobile ? '10px' : '20px' }}>
            <div style={{
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: '650',
                marginBottom: isMobile ? '10px' : '14px',
                color: '#1e293b'
            }}>
                🧭 方向分类
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '10px' }}>
                {Object.entries(directionStructure).map(([dir, subCategories]) => {
                    const isExpanded = expandedDirs[dir];
                    const dirTotal = getPendingCount(dir);

                    return (
                        <div key={dir} style={{
                            background: 'white',
                            borderRadius: isMobile ? '12px' : '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            overflow: 'hidden'
                        }}>
                            {/* Direction header */}
                            <div
                                onClick={() => toggleDir(dir)}
                                style={{
                                    padding: isMobile ? '12px 14px' : '14px 18px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    background: isExpanded ? '#f0fff4' : '#f7fafc',
                                    borderBottom: isExpanded ? '1px solid #e9ecf2' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: isMobile ? '16px' : '18px' }}>
                                        {isExpanded ? '📂' : '📁'}
                                    </span>
                                    <span style={{
                                        fontWeight: '600',
                                        fontSize: isMobile ? '14px' : '15px',
                                        color: '#2d3748'
                                    }}>
                                        {dir}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        background: dirTotal > 0 ? '#4f6af5' : '#cbd5e0',
                                        color: 'white',
                                        padding: '2px 10px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {dirTotal}
                                    </span>
                                    <span style={{ color: '#718096', fontSize: '14px' }}>
                                        {isExpanded ? '▲' : '▼'}
                                    </span>
                                </div>
                            </div>

                            {/* SubCategories */}
                            {isExpanded && (
                                <div style={{ padding: '8px 0' }}>
                                    {subCategories.map(sub => {
                                        const subCount = getPendingSubCount(dir, sub);
                                        return (
                                            <div
                                                key={sub}
                                                onClick={() => onCategoryClick(dir, sub)}
                                                style={{
                                                    padding: isMobile ? '10px 14px 10px 40px' : '12px 18px 12px 50px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span style={{
                                                    fontSize: isMobile ? '13px' : '14px',
                                                    color: '#4a5568'
                                                }}>
                                                    ├─ {sub}
                                                </span>
                                                <span style={{
                                                    background: subCount > 0 ? '#eef2ff' : '#f3f4f6',
                                                    color: subCount > 0 ? '#4f6af5' : '#a0aec0',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: '600'
                                                }}>
                                                    {subCount}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DirectionTab;