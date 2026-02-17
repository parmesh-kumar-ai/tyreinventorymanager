import { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ShieldCheck, Mail } from 'lucide-react';

export default function LoginScreen() {
    const [authMode, setAuthMode] = useState<'options' | 'email-login' | 'email-signup'>('options');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState(''); // For Sign Up
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
            // Save token logic handled in App.tsx or useBackup via auth state
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (authMode === 'email-signup') {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (displayName) {
                    await updateProfile(userCredential.user, { displayName });
                }
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f8fafc',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div className="login-card" style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '1rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '420px',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white',
                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
                    }}>
                        <ShieldCheck size={36} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Tyre Manager</h1>
                    <p style={{ color: '#64748b', fontSize: '1rem' }}>Welcome to manage your inventory easily.</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        border: '1px solid #fecaca',
                        textAlign: 'left'
                    }}>
                        {error}
                    </div>
                )}



                {authMode === 'options' && (
                    <div className="auth-methods" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={handleGoogleLogin}
                            className="btn"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                padding: '0.875rem',
                                border: '1px solid #e2e8f0',
                                backgroundColor: 'white',
                                color: '#334155',
                                borderRadius: '0.75rem',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                            }}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                            Sign in with Google
                        </button>

                        <button
                            onClick={() => setAuthMode('email-login')}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', borderRadius: '0.75rem', padding: '0.875rem' }}
                        >
                            <Mail size={18} />
                            Sign in with Email
                        </button>



                        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                            Don't have an account?{' '}
                            <button
                                onClick={() => setAuthMode('email-signup')}
                                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                )}



                {(authMode === 'email-login' || authMode === 'email-signup') && (
                    <form onSubmit={handleEmailAuth} style={{ textAlign: 'left' }}>
                        {authMode === 'email-signup' && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Name / Shop Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your Name or Shop Name"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem', padding: '0.875rem', borderRadius: '0.75rem' }}
                        >
                            {loading ? 'Processing...' : (authMode === 'email-login' ? 'Sign In' : 'Create Account')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setAuthMode('options')}
                            className="btn btn-secondary"
                            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', borderRadius: '0.75rem' }}
                        >
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
