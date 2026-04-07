import { useState } from 'react';
import { Input } from '../components/UI/Input';
import { useAuthState, signOut } from '../lib/supabase';
import { cacheManager, getVersionInfo } from '../lib/cacheManager';
import { FiUser, FiShield, FiLogOut, FiEdit, FiRefreshCw, FiInfo, FiCheck } from 'react-icons/fi';

export function Account() {
  const { user } = useAuthState();
  const [isEditing, setIsEditing] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const versionInfo = getVersionInfo();

  const handleSave = () => {
    // Mock save
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-content">
          <h1 className="page__title">Account Settings</h1>
          <p className="page__subtitle">Manage your business account and contact preferences.</p>
        </div>
      </div>

      <div className="page__content">
        <div className="account-grid">
          {/* Profile Information */}
          <div className="account-card account-card--profile">
            <div className="account-card__header">
              <FiUser className="account-card__header-icon" />
              <h2 className="account-card__title">Profile Information</h2>
            </div>
            <div className="account-card__body">
              {isEditing ? (
                <div className="account-form">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    disabled
                    help="Email cannot be changed"
                  />
                  
                  <div className="account-form__actions">
                    <button className="btn btn--primary" onClick={handleSave}>
                      <FiCheck size={16} />
                      Save Changes
                    </button>
                    <button className="btn btn--secondary" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="account-profile">
                    <div className="account-profile__avatar">
                      <FiUser size={24} />
                    </div>
                    <div className="account-profile__info">
                      <h3 className="account-profile__name">{user?.name || 'No name set'}</h3>
                      <p className="account-profile__email">{user?.email}</p>
                    </div>
                  </div>

                  <div className="account-details">
                    <div className="account-detail-row">
                      <span className="account-detail-row__label">Role</span>
                      <span className="account-detail-row__value">
                        <span className="account-badge account-badge--neutral">
                          {user?.role?.toUpperCase() || 'USER'}
                        </span>
                      </span>
                    </div>
                    
                    <div className="account-detail-row">
                      <span className="account-detail-row__label">Member since</span>
                      <span className="account-detail-row__value">January 2024</span>
                    </div>
                  </div>

                  <button 
                    className="btn btn--secondary btn--full"
                    onClick={() => setIsEditing(true)}
                  >
                    <FiEdit size={16} />
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Organization Info */}
          <div className="account-card account-card--org">
            <div className="account-card__header">
              <FiShield className="account-card__header-icon account-card__header-icon--success" />
              <h2 className="account-card__title">Organization</h2>
            </div>
            <div className="account-card__body">
              <div className="account-org">
                <div className="account-org__avatar">
                  <FiShield size={24} />
                </div>
                <div className="account-org__info">
                  <h3 className="account-org__name">Apex Customer</h3>
                  <span className="account-badge account-badge--success">Premium Plan</span>
                </div>
              </div>

              <div className="account-stats">
                <div className="account-stat">
                  <span className="account-stat__value">247</span>
                  <span className="account-stat__label">Collections this year</span>
                </div>
                <div className="account-stat account-stat--success">
                  <span className="account-stat__value">12,450 kg</span>
                  <span className="account-stat__label">CO₂e Avoided</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="account-card account-card--actions">
            <div className="account-card__header">
              <FiShield className="account-card__header-icon" />
              <h2 className="account-card__title">Account Actions</h2>
            </div>
            <div className="account-card__body">
              <div className="account-action-list">
                <div className="account-action">
                  <div className="account-action__icon">
                    <FiShield size={18} />
                  </div>
                  <div className="account-action__content">
                    <h4 className="account-action__title">Change Password</h4>
                    <p className="account-action__desc">Update your account password</p>
                  </div>
                  <button className="btn btn--secondary btn--sm">
                    Change Password
                  </button>
                </div>

                <div className="account-action account-action--danger">
                  <div className="account-action__icon account-action__icon--danger">
                    <FiLogOut size={18} />
                  </div>
                  <div className="account-action__content">
                    <h4 className="account-action__title">Sign Out</h4>
                    <p className="account-action__desc">Sign out of your account</p>
                  </div>
                  <button className="btn btn--danger btn--sm" onClick={handleSignOut}>
                    <FiLogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* App Cache Management */}
          <div className="account-card account-card--cache">
            <div className="account-card__header">
              <FiRefreshCw className="account-card__header-icon" />
              <h2 className="account-card__title">App Cache & Debug</h2>
            </div>
            <div className="account-card__body">
              <div className="account-action-list">
                <div className="account-action">
                  <div className="account-action__icon">
                    <FiRefreshCw size={18} />
                  </div>
                  <div className="account-action__content">
                    <h4 className="account-action__title">Clear App Cache</h4>
                    <p className="account-action__desc">Fix loading issues by clearing all cached data</p>
                  </div>
                  <button 
                    className="btn btn--secondary btn--sm"
                    onClick={() => {
                      if (confirm('This will clear all app data and reload. Continue?')) {
                        cacheManager.manualCacheClear();
                      }
                    }}
                  >
                    <FiRefreshCw size={14} />
                    Clear Cache
                  </button>
                </div>

                <div className="account-action">
                  <div className="account-action__icon">
                    <FiInfo size={18} />
                  </div>
                  <div className="account-action__content">
                    <h4 className="account-action__title">App Version</h4>
                    <p className="account-action__desc">v{versionInfo.version}</p>
                  </div>
                  <button 
                    className="btn btn--ghost btn--sm"
                    onClick={() => setShowDebugInfo(!showDebugInfo)}
                  >
                    {showDebugInfo ? 'Hide' : 'Show'} Debug
                  </button>
                </div>
              </div>

              {showDebugInfo && (
                <div className="account-debug">
                  <h5 className="account-debug__title">Debug Information</h5>
                  <div className="account-debug__list">
                    <div className="account-debug__item">
                      <span className="account-debug__label">Version:</span>
                      <span className="account-debug__value">{versionInfo.version}</span>
                    </div>
                    <div className="account-debug__item">
                      <span className="account-debug__label">Build Time:</span>
                      <span className="account-debug__value">{new Date(versionInfo.buildTime).toLocaleString()}</span>
                    </div>
                    <div className="account-debug__item">
                      <span className="account-debug__label">Cached Version:</span>
                      <span className="account-debug__value">{versionInfo.cached || 'None'}</span>
                    </div>
                    <div className="account-debug__item">
                      <span className="account-debug__label">Stale Cache:</span>
                      <span className="account-debug__value">{versionInfo.stale ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  {versionInfo.stale && (
                    <div className="account-debug__warning">
                      ⚠️ Stale cache detected. Consider clearing cache for optimal performance.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}