import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
      <Link to="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>Your privacy is important to us. JEEMirror collects only the data necessary to provide you with our mistake tracking service.</p>
        <h2 className="text-lg font-semibold text-foreground">Data We Collect</h2>
        <p>We collect your name, email address, and the mistake data you log. This data is stored securely and is only accessible to you.</p>
        <h2 className="text-lg font-semibold text-foreground">How We Use Your Data</h2>
        <p>Your data is used solely to provide you with analytics and tracking features. We never share, sell, or distribute your personal data to third parties.</p>
        <h2 className="text-lg font-semibold text-foreground">Data Deletion</h2>
        <p>You can delete your account and all associated data at any time from the Settings page.</p>
        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>For any questions, contact avadhootkekan47@gmail.com.</p>
      </div>
    </div>
  );
}
