# Security Review Checklist

Use this checklist when reviewing code for security concerns.

## Authentication & Authorization
- [ ] Authentication is required for all protected endpoints
- [ ] Authorization checks are in place (role-based or permission-based)
- [ ] Session management is secure (httpOnly, secure, SameSite cookies)
- [ ] Password storage uses bcrypt/argon2 with appropriate cost factors

## Input Handling
- [ ] All user input is validated on the server side
- [ ] SQL queries use parameterized statements (no string concatenation)
- [ ] File uploads are validated (type, size, content)
- [ ] Path traversal attacks are prevented
- [ ] XSS prevention is in place (output encoding, CSP headers)

## Data Protection
- [ ] Sensitive data is encrypted at rest
- [ ] HTTPS is enforced for all communications
- [ ] PII is handled according to privacy requirements
- [ ] Logs do not contain sensitive data (passwords, tokens, PII)

## API Security
- [ ] Rate limiting is configured
- [ ] CORS is properly configured (not wildcard in production)
- [ ] API keys and tokens are not exposed in URLs
- [ ] Error responses do not expose internal system details

## Dependencies
- [ ] No known vulnerabilities in dependencies (`npm audit`)
- [ ] Dependencies are pinned to specific versions
- [ ] No unnecessary dependencies included

## Secrets Management
- [ ] No hardcoded credentials in source code
- [ ] Secrets are stored in environment variables or a secrets manager
- [ ] `.env` files are gitignored
- [ ] API keys have minimal required permissions
