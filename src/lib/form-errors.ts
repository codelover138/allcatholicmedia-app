import { useCallback, useState } from 'react';

import { ApiError } from '@/lib/api-client';

export type FieldErrors = Record<string, string | undefined>;

/**
 * Minimal form-error state: per-field messages plus a form-level message. Client
 * checks set fields directly; a failed request is fanned out from the v1
 * `error.details` map (or shown as a form-level message when it has no field).
 */
export function useFormErrors(fieldMap?: Record<string, string>) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setFieldErrors({});
    setFormError(null);
  }, []);

  const setField = useCallback((name: string, message?: string) => {
    setFieldErrors((prev) => ({ ...prev, [name]: message }));
  }, []);

  const fromError = useCallback(
    (err: unknown, fallback = 'Something went wrong. Please try again.') => {
      if (err instanceof ApiError) {
        const details = err.details;
        if (details && Object.keys(details).length) {
          const next: FieldErrors = {};
          for (const [key, messages] of Object.entries(details)) {
            const mapped = fieldMap?.[key] ?? key;
            next[mapped] = messages?.[0];
          }
          setFieldErrors(next);
          // Keep a form-level line too when the message is not just "invalid data".
          setFormError(err.status === 422 ? null : err.message || fallback);
          return;
        }
        setFormError(err.message || fallback);
        return;
      }
      setFormError(fallback);
    },
    [fieldMap],
  );

  return { fieldErrors, formError, setField, setFormError, clear, fromError };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validators = {
  required: (v: string, label = 'This field') => (v.trim() ? undefined : `${label} is required.`),
  email: (v: string) => (EMAIL_RE.test(v.trim()) ? undefined : 'Enter a valid email address.'),
  min: (v: string, n: number, label = 'This field') =>
    v.length >= n ? undefined : `${label} must be at least ${n} characters.`,
  match: (a: string, b: string, msg = 'Passwords do not match.') => (a === b ? undefined : msg),
};
