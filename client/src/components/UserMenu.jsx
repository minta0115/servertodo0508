import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const UserMenu = ({ onOpenSettings }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setShowMenu(false);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{
                background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </button>

            {showMenu && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    minWidth: '200px',
                    zIndex: 1000
                }}>
                    <div style={{
                        padding: '12px',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '14px',
                        color: '#718096'
                    }}>
                        📧 {user?.email}
                    </div>
                    <button onClick={() => {
                        if (onOpenSettings) onOpenSettings();
                        setShowMenu(false);
                    }} style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#2d3748',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f7fafc'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}>
                        ⚙️ 设置
                    </button>
                    <button onClick={() => {
                        alert('切换账号功能敬请期待！');
                        setShowMenu(false);
                    }} style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#2d3748',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f7fafc'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}>
                        🔄 切换账号
                    </button>
                    <button onClick={handleLogout} style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#e53e3e',
                        borderTop: '1px solid #e2e8f0',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#fed7d7'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}>
                        🚪 退出登录
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
