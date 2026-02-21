import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold"><span className="text-primary">JEE</span>Mirror</h1>
          <p className="text-muted-foreground mt-2">Reset your password</p>
        </div>
        {sent ? (
          <div className="text-center space-y-4">
            <div className="rounded-lg bg-success/10 p-4 text-sm text-success">
              Check your email for a password reset link.
            </div>
            <Link to="/login" className="text-sm text-primary hover:underline">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button disabled={loading} type="submit"
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
