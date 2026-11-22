import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../utils/format';
import { authUrl, defaultLanding, safeNext } from '../utils/nav';

/** One screen, two tabs: "Login" and "Register" (both free). `next` = where the visitor was heading. */
function AuthScreen({ mode }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const isRegister = mode === 'register';

  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);

  // Already signed in (or just signed in): continue to the page they originally wanted
  if (user) return <Navigate to={next || defaultLanding(user)} replace />;

  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = isRegister ? await register(f) : await login(f.email, f.password);
      navigate(next || defaultLanding(u), { replace: true });
    } catch (err) {
      toast.error(errMsg(err, isRegister ? 'Could not create account' : 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  const tab = (active) => `flex-1 text-center py-2.5 rounded-lg text-sm font-bold transition ${active ? 'bg-navy-800 text-white' : 'text-navy-800 hover:bg-sky-soft'}`;

  return (
    <div className="container-t01 py-14 flex justify-center">
      <div className="card w-full max-w-md p-8">
        <div className="flex gap-2 bg-cream rounded-xl p-1.5 mb-6">
          <Link to={authUrl('login', next)} className={tab(!isRegister)} replace>Login</Link>
          <Link to={authUrl('register', next)} className={tab(isRegister)} replace>Register free</Link>
        </div>

        <h1 className="text-2xl font-extrabold">{isRegister ? 'Create your free account' : 'Welcome back'}</h1>
        <p className="text-navy-800/70 mt-1 mb-6">
          {next ? 'Sign in or register - you will go straight to the page you were opening.' : isRegister ? 'Takes less than a minute.' : 'Log in to continue.'}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {isRegister && <div><label className="label">Full name</label><input className="input" required autoComplete="name" {...bind('name')} /></div>}
          <div><label className="label">Email</label><input className="input" type="email" required autoComplete="email" {...bind('email')} /></div>
          {isRegister && (
            <div>
              <label className="label">Mobile number</label>
              <input className="input" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" title="10-digit Indian mobile number" required autoComplete="tel-national" placeholder="10-digit number (needed for payments)" {...bind('phone')} />
            </div>
          )}
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={isRegister ? 8 : undefined} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'At least 8 characters' : ''} {...bind('password')} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Login'}
          </button>
        </form>

        {!isRegister && <div className="text-sm mt-5"><Link to="/forgot-password" className="text-sky-brand font-semibold">Forgot password?</Link></div>}
      </div>
    </div>
  );
}

export const Login = () => <AuthScreen mode="login" />;
export const Register = () => <AuthScreen mode="register" />;
