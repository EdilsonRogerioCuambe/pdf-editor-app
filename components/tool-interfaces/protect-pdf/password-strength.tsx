import { PasswordStrength } from './types';

export function calculatePasswordStrength(password: string): PasswordStrength {
  let strength = 0;
  const feedback: string[] = [];

  if (!password) {
    return {
      strength: 0,
      level: 'Weak',
      color: '#ef4444',
      feedback: ['Enter a password']
    };
  }

  // Length scoring
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 20;
  if (password.length >= 16) strength += 10;

  // Character variety
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/[0-9]/.test(password)) strength += 10;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 20;

  // Feedback generation
  if (password.length < 8) {
    feedback.push('Password too short (min 8 characters)');
  } else if (password.length < 12) {
    feedback.push('Consider using 12+ characters');
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Add special characters (!@#$%^&*)');
  }

  // Determine level and color
  let level: PasswordStrength['level'] = 'Weak';
  let color = '#ef4444';

  if (strength >= 80) {
    level = 'Very Strong';
    color = '#10b981';
  } else if (strength >= 60) {
    level = 'Strong';
    color = '#3b82f6';
  } else if (strength >= 40) {
    level = 'Medium';
    color = '#f59e0b';
  }

  return { strength, level, color, feedback };
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const result = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${result.strength}%`,
              backgroundColor: result.color
            }}
          />
        </div>
        <span
          className="text-sm font-medium"
          style={{ color: result.color }}
        >
          {result.level}
        </span>
      </div>

      {result.feedback.length > 0 && (
        <ul className="text-xs text-gray-600 space-y-1">
          {result.feedback.map((tip, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="text-gray-400">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
