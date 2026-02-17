import { useState, useRef } from 'react';
import { updateProfile, updateEmail, updatePassword, deleteUser, GoogleAuthProvider, linkWithPopup, signInWithPopup, getAuth, EmailAuthProvider, reauthenticateWithCredential, unlink, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { UploadCloud, DownloadCloud, FileDown, Trash2, UserCog, X, Save, AlertTriangle, FileUp, Unlink, LogOut } from 'lucide-react';
import { uploadToDrive, restoreFromDrive, listBackups } from '../services/backupService';
import type { useInventory } from '../hooks/useInventory';

interface AccountManagerProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    inventoryHook: ReturnType<typeof useInventory>;
}

// Simplified ProfileSection for debugging
function ProfileSection({ user, shopDetails, updateShopDetails, setLoading, setError, setMessage }: {
    user: User,
    shopDetails: { phone: string },
    updateShopDetails: (d: { phone: string }) => void,
    setLoading: (l: boolean) => void,
    setError: (e: string) => void,
    setMessage: (m: string) => void
}) {
    const [view, setView] = useState<'view' | 'change-email' | 'change-password'>('view');

    // Profile State
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [phone, setPhone] = useState(shopDetails.phone || '');

    // Sync phone state when prop changes (optional but good practice)
    // useEffect(() => setPhone(shopDetails.phone), [shopDetails.phone]);

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Change Email State
    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState(''); // Current password for email change

    const handleUpdateProfile = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            let msg = '';
            // Update Display Name if changed
            if (displayName.trim() && displayName !== user.displayName) {
                await updateProfile(user, { displayName: displayName });
                msg += 'Name updated. ';
            }

            // Update Phone if changed
            if (phone !== shopDetails.phone) {
                updateShopDetails({ phone });
                msg += 'Phone updated. ';
            }

            if (!msg) {
                msg = 'No changes to save.';
            }

            setMessage(msg);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            if (!user.email) throw new Error("No email associated with this account.");
            // Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);
            setMessage('Password updated successfully.');
            setView('view');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || 'Failed to update password. Check current password.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            if (!user.email) throw new Error("No email associated with this account.");
            // Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, emailPassword);
            await reauthenticateWithCredential(user, credential);

            await updateEmail(user, newEmail);
            setMessage('Email updated. You may need to verify it.');
            setView('view');
            setNewEmail('');
            setEmailPassword('');
        } catch (err: any) {
            setError(err.message || 'Failed to update email. Check password.');
        } finally {
            setLoading(false);
        }
    };

    if (view === 'view') {
        return (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>

                    {/* Display Name */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#64748b' }}>Display Name / Shop Name</label>
                        <div style={{ padding: '0.75rem', background: 'white', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                style={{ width: '100%', border: 'none', outline: 'none', fontWeight: 500, color: '#334155' }}
                                placeholder="Enter Shop Name"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#64748b' }}>Email Address</label>
                        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#334155' }}>
                            {user.email || 'No Email'}
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#64748b' }}>Phone Number</label>
                        <div style={{ padding: '0.75rem', background: 'white', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={{ width: '100%', border: 'none', outline: 'none', color: '#334155' }}
                                placeholder="Enter Phone Number"
                            />
                        </div>
                    </div>

                    {/* Save Button Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleUpdateProfile}
                            disabled={(displayName === (user.displayName || '') && phone === (shopDetails.phone || '')) || !displayName.trim()}
                            className="btn btn-primary"
                            style={{
                                opacity: (displayName === (user.displayName || '') && phone === (shopDetails.phone || '')) ? 0.5 : 1,
                                cursor: (displayName === (user.displayName || '') && phone === (shopDetails.phone || '')) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Changes
                        </button>
                    </div>

                    {/* Current Password Placeholder */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#64748b' }}>Current Password</label>
                        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ************
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                    <button onClick={() => setView('change-email')} className="btn" style={{ flex: 1, justifyContent: 'center', border: '1px solid #cbd5e1', color: '#334155' }}>
                        Change Email
                    </button>
                    <button onClick={() => setView('change-password')} className="btn" style={{ flex: 1, justifyContent: 'center', background: '#334155', color: 'white' }}>
                        Change Password
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'change-password') {
        return (
            <form onSubmit={handleChangePassword}>
                <button type="button" onClick={() => setView('view')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', color: '#64748b', marginBottom: '1rem', cursor: 'pointer' }}>
                    &larr; Back to Profile
                </button>
                <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Current Password</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="Enter current password" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Enter new password" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm new password" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
                    Update Password
                </button>
            </form>
        );
    }

    if (view === 'change-email') {
        return (
            <form onSubmit={handleChangeEmail}>
                <button type="button" onClick={() => setView('view')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', color: '#64748b', marginBottom: '1rem', cursor: 'pointer' }}>
                    &larr; Back to Profile
                </button>
                <h3 style={{ marginBottom: '1.5rem' }}>Change Email Address</h3>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>New Email Address</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required placeholder="new@example.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Current Password</label>
                    <input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} required placeholder="Required for verification" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
                    Update Email
                </button>
            </form>
        );
    }
    return null;
}

export default function AccountManager({ user, isOpen, onClose, inventoryHook }: AccountManagerProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'data' | 'danger'>('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => localStorage.getItem('autoBackupEnabled') === 'true');
    const [availableBackups, setAvailableBackups] = useState<any[]>([]);

    const fetchBackupsList = async () => {
        setLoading(true);
        const token = sessionStorage.getItem('google_access_token');
        if (!token) {
            setError('google_token_missing');
            setLoading(false);
            return;
        }
        const files = await listBackups(token);
        setAvailableBackups(files);
        setLoading(false);
    };

    if (!isOpen) return null;



    const handleLinkGoogle = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/drive.file');

            // Try to link first
            try {
                const result = await linkWithPopup(user, provider);
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential?.accessToken;
                if (token) {
                    sessionStorage.setItem('google_access_token', token);
                    setMessage('Google Account linked successfully! Cloud features enabled.');
                }
            } catch (linkError: any) {
                // If linking fails (e.g. account already exists), try sign in to get token
                if (linkError.code === 'auth/credential-already-in-use' || linkError.code === 'auth/email-already-in-use') {
                    const result = await signInWithPopup(getAuth(), provider);
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const token = credential?.accessToken;
                    if (token) {
                        sessionStorage.setItem('google_access_token', token);
                        setMessage('Signed in with Google. Cloud features ready.');
                    }
                } else {
                    throw linkError;
                }
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/popup-blocked') {
                setError('Popup blocked! Please allow popups for this site and try again.');
            } else {
                setError('Failed to link Google: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        if (!confirm('Are you sure you want to unlink your Google Account? This will disable cloud backups.')) return;
        setLoading(true);
        try {
            // Remove token
            sessionStorage.removeItem('google_access_token');

            // Attempt to unlink from Firebase if it's a linked provider
            const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
            if (googleProvider) {
                await unlink(user, 'google.com');
            }
            setMessage('Google Account unlinked.');
            // Force re-render or state update
        } catch (err: any) {
            setError('Failed to unlink: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setMessage('');
        setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n');
                // Expect Header: "Brand","Size","Quantity","Store"

                const newInventory: any[] = [];
                // Skip header row 0
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());

                    if (cols.length >= 4) {
                        const [brand, size, qtyStr, storeName] = cols;

                        // Find or Create Store ID
                        let storeId = inventoryHook.stores.find(s => s.name === storeName)?.id;
                        if (!storeId) {
                            storeId = inventoryHook.stores[0]?.id || 'store_1';
                        }

                        newInventory.push({
                            id: `csv-${Date.now()}-${i}`,
                            brand,
                            size,
                            quantity: parseInt(qtyStr) || 0,
                            storeId,
                        });
                    }
                }

                if (newInventory.length > 0) {
                    if (inventoryHook.importData) {
                        // Generate transactions for imported items
                        const newTransactions: any[] = newInventory.map(item => ({
                            id: crypto.randomUUID(),
                            tyreId: item.id,
                            type: 'IN',
                            quantity: item.quantity,
                            date: new Date().toISOString(),
                            storeId: item.storeId
                        }));

                        const backupData = {
                            inventory: newInventory,
                            stores: inventoryHook.stores,
                            transactions: newTransactions,
                            managedBrands: [...new Set([...inventoryHook.managedBrands, ...newInventory.map(i => i.brand)])],
                            timestamp: new Date().toISOString()
                        };
                        inventoryHook.importData(backupData);
                        setMessage(`Imported ${newInventory.length} items from CSV.`);
                    }
                } else {
                    setError('No valid data found in CSV.');
                }

            } catch (err: any) {
                setError('Failed to parse CSV: ' + err.message);
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleBackup = async () => {
        setLoading(true);
        setMessage('');
        setError('');
        const token = sessionStorage.getItem('google_access_token');
        if (!token) {
            setError('google_token_missing'); // Special flag to render button
            setLoading(false);
            return;
        }

        const result = await uploadToDrive(token, {
            inventory: inventoryHook.inventory,
            stores: inventoryHook.stores,
            transactions: inventoryHook.transactions,
            managedBrands: inventoryHook.managedBrands,
            warranties: inventoryHook.warranties,
            claims: inventoryHook.claims,
            timestamp: new Date().toISOString()
        });

        if (result.success) setMessage('Backup uploaded successfully!');
        else setError('Backup failed: ' + (result.error || 'Unknown error'));
        setLoading(false);
    };

    const handleRestore = async (fileId?: string) => {
        if (!confirm('WARNING: This will OVERWRITE your current local inventory with the data from Google Drive. Are you sure?')) return;

        setLoading(true);
        setMessage('');
        setError('');
        const token = sessionStorage.getItem('google_access_token');
        if (!token) {
            setError('google_token_missing');
            setLoading(false);
            return;
        }

        const data = await restoreFromDrive(token, fileId);
        if (data) {
            if (inventoryHook.importData) {
                inventoryHook.importData(data);
                setMessage('Data restored successfully!');
                // Close modal or refresh list if needed
            } else {
                setError('Import function missing from hook. Please contact developer.');
            }
        } else {
            setError('No backup found or failed to download.');
        }
        setLoading(false);
    };

    const handleExportCSV = () => {
        const headers = ['Brand', 'Size', 'Quantity', 'Store'];
        const rows = inventoryHook.inventory.map(item => {
            const store = inventoryHook.stores.find(s => s.id === item.storeId)?.name || 'Unknown Store';
            return [
                item.brand,
                item.size,
                item.quantity,
                store
            ].map(val => `"${val}"`).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'inventory_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMessage('CSV Exported!');
    };

    const handleDeleteAccount = async () => {
        if (!confirm('CRITICAL WARNING: This will permanently delete your account and ALL data. This cannot be undone. Are you sure?')) return;
        setLoading(true);
        try {
            await deleteUser(user);
        } catch (err: any) {
            setError(err.message || 'Failed to delete account. You may need to re-login.');
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        if (!confirm('Are you sure you want to sign out?')) return;
        try {
            await signOut(getAuth());
            onClose();
        } catch (err: any) {
            setError('Failed to sign out: ' + err.message);
        }
    };

    const isGoogleLinked = sessionStorage.getItem('google_access_token') || user.providerData.some(p => p.providerId === 'google.com');

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div className="modal-content" style={{
                background: 'white', borderRadius: '1rem', width: '90%', maxWidth: '600px',
                height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
                <div className="modal-header" style={{
                    padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserCog /> Manage Account
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                <div className="modal-tabs" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === 'profile' ? 'white' : 'transparent', fontWeight: activeTab === 'profile' ? 700 : 400, borderTop: activeTab === 'profile' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer' }}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === 'data' ? 'white' : 'transparent', fontWeight: activeTab === 'data' ? 700 : 400, borderTop: activeTab === 'data' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer' }}
                    >
                        Data & Cloud
                    </button>
                    <button
                        onClick={() => setActiveTab('danger')}
                        style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === 'danger' ? 'white' : 'transparent', fontWeight: activeTab === 'danger' ? 700 : 400, borderTop: activeTab === 'danger' ? '3px solid #ef4444' : '3px solid transparent', color: activeTab === 'danger' ? '#ef4444' : 'inherit', cursor: 'pointer' }}
                    >
                        Security
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                    {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{message}</div>}
                    {error === 'google_token_missing' ? (
                        <div style={{ background: '#fff7ed', color: '#9a3412', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #fed7aa' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Google Drive Access Required</p>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>To use cloud backup, you need to link a Google Account.</p>
                            <button onClick={handleLinkGoogle} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                                Link Google Account
                            </button>
                        </div>
                    ) : error ? (
                        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>
                    ) : null}

                    {activeTab === 'profile' && (
                        <ProfileSection
                            user={user}
                            shopDetails={(inventoryHook as any).shopDetails || { phone: '' }}
                            updateShopDetails={(inventoryHook as any).updateShopDetails || (() => { })}
                            setLoading={setLoading}
                            setError={setError}
                            setMessage={setMessage}
                        />
                    )}

                    {activeTab === 'data' && (
                        <div style={{ display: 'grid', gap: '1rem' }}>

                            {/* Cloud Section */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><UploadCloud size={20} color="var(--primary)" /> Cloud Sync</h3>
                                {isGoogleLinked ? (
                                    <>
                                        <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>Account linked. You can backup your inventory.</p>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Auto-Backup (Every 30 mins)</span>
                                            <button
                                                onClick={() => {
                                                    const newState = !autoBackupEnabled;
                                                    setAutoBackupEnabled(newState);
                                                    localStorage.setItem('autoBackupEnabled', String(newState));
                                                }}
                                                style={{
                                                    background: autoBackupEnabled ? '#10b981' : '#cbd5e1',
                                                    width: '44px', height: '24px', borderRadius: '12px', border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                                                }}
                                            >
                                                <div style={{
                                                    background: 'white', width: '20px', height: '20px', borderRadius: '50%', position: 'absolute', top: '2px', left: autoBackupEnabled ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                }} />
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={handleBackup} disabled={loading} className="btn" style={{ background: 'var(--primary)', color: 'white', flex: 1, justifyContent: 'center' }}>
                                                <UploadCloud size={18} style={{ marginRight: '0.5rem' }} /> Back Up Now
                                            </button>
                                            <button onClick={handleUnlinkGoogle} disabled={loading} className="btn" style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef4444', justifyContent: 'center' }} title="Unlink Google Account">
                                                <Unlink size={18} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>Link Google Drive to enable cloud backups.</p>
                                        <button onClick={handleLinkGoogle} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Link Google Account</button>
                                    </>
                                )}
                            </div>

                            {/* Restore Section */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><DownloadCloud size={20} color="#f59e0b" /> Restore Data</h3>
                                <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>Overwrites local data.</p>

                                {isGoogleLinked && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <button
                                            onClick={fetchBackupsList}
                                            disabled={loading}
                                            className="btn"
                                            style={{ background: '#f59e0b', border: 'none', color: 'white', width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}
                                        >
                                            Fetch Available Backups
                                        </button>

                                        {availableBackups.length > 0 && (
                                            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: '#f8fafc' }}>
                                                {availableBackups.map(file => (
                                                    <div
                                                        key={file.id}
                                                        onClick={() => handleRestore(file.id)}
                                                        style={{
                                                            padding: '0.75rem', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            transition: 'background 0.1s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <span>{new Date(file.createdTime || '').toLocaleString()}</span>
                                                        <DownloadCloud size={14} color="#64748b" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <div style={{ height: '1px', background: '#e2e8f0', flex: 1 }}></div>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>OR IMPORT FILE</span>
                                        <div style={{ height: '1px', background: '#e2e8f0', flex: 1 }}></div>
                                    </div>

                                    <button onClick={() => fileInputRef.current?.click()} className="btn" style={{ background: '#0d9488', color: 'white', width: '100%', justifyContent: 'center' }}>
                                        <FileUp size={18} style={{ marginRight: '0.5rem' }} /> Import CSV from PC
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept=".csv,.txt"
                                        onChange={handleImportCSV}
                                    />
                                </div>
                            </div>

                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6366f1' }}>
                                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                                    </svg>
                                    Sync History
                                </h3>
                                <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>Fix discrepancies between Stock Count and History.</p>
                                <button
                                    onClick={() => {
                                        if (inventoryHook.reconcileTransactions) {
                                            const count = inventoryHook.reconcileTransactions();
                                            if (count > 0) setMessage(`Fixed ${count} discrepancies in history.`);
                                            else setMessage('History is already in sync.');
                                        } else {
                                            setError('Update not applied yet. Please reload.');
                                        }
                                    }}
                                    className="btn"
                                    style={{ background: '#6366f1', color: 'white', width: '100%', justifyContent: 'center' }}
                                >
                                    Sync Now
                                </button>
                            </div>

                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><FileDown size={20} color="#10b981" /> Export CSV</h3>
                                <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>Download your inventory as a spreadsheet file.</p>
                                <button onClick={handleExportCSV} className="btn" style={{ background: '#10b981', color: 'white', width: '100%', justifyContent: 'center' }}>
                                    <FileDown size={18} style={{ marginRight: '0.5rem' }} /> Download CSV
                                </button>
                            </div>


                        </div>
                    )}

                    {activeTab === 'danger' && (
                        <>
                            <div style={{ border: '1px solid #cbd5e1', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><LogOut size={20} /> Sign Out</h3>
                                <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                    Sign out of your account on this device.
                                </p>
                                <button onClick={handleSignOut} className="btn" style={{ background: '#334155', color: 'white', width: '100%', justifyContent: 'center' }}>
                                    <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Sign Out
                                </button>
                            </div>

                            <div style={{ border: '1px solid #fee2e2', borderRadius: '0.75rem', padding: '1.5rem', background: '#fef2f2' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#b91c1c' }}><AlertTriangle size={20} /> Security</h3>
                                <p style={{ color: '#7f1d1d', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                    Deleting your account will partially remove your access.
                                    <br /><strong>Note:</strong> This action wipes your LOCAL data immediately.
                                    It permanently deletes your login authentication.
                                </p>
                                <button onClick={handleDeleteAccount} className="btn" style={{ background: '#ef4444', color: 'white', width: '100%', justifyContent: 'center' }}>
                                    <Trash2 size={18} style={{ marginRight: '0.5rem' }} /> Delete Account
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
