# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please create a security advisory by going to the repository's Security tab and clicking "Report a vulnerability". All security vulnerabilities will be promptly addressed.

Please do not report security vulnerabilities through public GitHub issues.

## Security Best Practices

When deploying this application:

1. **Environment Variables**
   - Never commit `.env` or `.env.local` files
   - Keep your API keys and secrets secure
   - Rotate credentials regularly
   - Use `.env.example` as a template

2. **Firebase Security**
   - Configure proper Firebase Security Rules
   - Restrict API key usage in Firebase Console
   - Enable only necessary authentication providers
   - Regular audit of security rules

3. **API Security**
   - Implement rate limiting
   - Use authentication for all API routes
   - Validate all input data
   - Keep dependencies updated

## Supported Versions

Only the latest version of the application is currently being supported with security updates.

## Dependencies

- Regularly update dependencies to their latest secure versions
- Run `npm audit` regularly to check for vulnerabilities
- Fix any reported vulnerabilities promptly 