Auth-Gated App Testing Playbook (Emergent Google Auth + email/password)

Email/password: POST /api/auth/register or /api/auth/login sets httpOnly cookie `session_token`.
See /app/memory/test_credentials.md for seeded accounts.

Google flow: /login → "Entrar com Google" → auth.emergentagent.com → back to {origin}/dashboard#session_id=...
→ frontend POST /api/auth/google {session_id} → cookie set.

Manual session for testing:
mongosh --eval "
use('app');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({user_id: userId, email: 'test.user.' + Date.now() + '@example.com', name: 'Test User', created_at: new Date()});
db.user_sessions.insertOne({user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now()+7*24*60*60*1000), created_at: new Date()});
print(sessionToken);
"
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/auth/me
Browser: add cookie session_token (httpOnly, secure, sameSite None) then open /dashboard.
