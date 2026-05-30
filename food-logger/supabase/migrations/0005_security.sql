-- v1.5: Security hardening
-- The allowlist trigger function should only run as a trigger, never be callable
-- directly via PostgREST RPC. Revoke direct EXECUTE from exposed roles.
revoke execute on function public.enforce_email_allowlist() from anon, authenticated, public;
