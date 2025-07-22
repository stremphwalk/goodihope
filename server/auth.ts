import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

// Replace with your AWS Cognito User Pool information
const COGNITO_USER_POOL_ID = 'us-east-2_8JHg800Rm';
const COGNITO_REGION = 'us-east-2';
const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;

// Middleware for validating JWT tokens
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10, // Increased from 5 to 10
    cacheMaxEntries: 5, // Cache up to 5 keys
    cacheMaxAge: 600000, // Cache for 10 minutes (increased from default)
    jwksUri: `${COGNITO_ISSUER}/.well-known/jwks.json`,
    requestAgent: undefined, // Use default agent
    timeout: 5000, // 5 second timeout for JWKS requests
  }) as GetVerificationKey,

  // Validate the audience and the issuer.
  audience: '2ajlh70hd6rsk8hoc9ldvqnbtr', // Replace with your App Client ID
  issuer: COGNITO_ISSUER,
  algorithms: ['RS256'],
  requestProperty: 'auth', // Store decoded token in req.auth
}); 