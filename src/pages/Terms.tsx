import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
      <Link to="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>By using JEEMirror, you agree to the following terms.</p>
        <h2 className="text-lg font-semibold text-foreground">Service</h2>
        <p>JEEMirror provides a mistake tracking and analytics tool for JEE exam preparation. We offer a 7-day free trial followed by paid subscription plans.</p>
        <h2 className="text-lg font-semibold text-foreground">Payments</h2>
        <p>Payments are processed via UPI and manually verified. Premium access is granted within 2 hours of payment verification.</p>
        <h2 className="text-lg font-semibold text-foreground">Cancellation</h2>
        <p>You may cancel your subscription at any time. No refunds are provided for partial billing periods.</p>
        <h2 className="text-lg font-semibold text-foreground">Liability</h2>
        <p>JEEMirror is provided "as is" without warranties. We are not liable for any damages arising from use of the service.</p>
        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>For questions, reach out to avadhootkekan47@gmail.com.</p>
      </div>
    </div>
  );
}
