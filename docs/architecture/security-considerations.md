# Security Considerations

## Mobile App Security

1. **Code Obfuscation**:
   - Enable code obfuscation in Expo production builds
   - Remove console.log statements from production builds
   - Implement certificate pinning for future API calls

2. **Secure Storage**:
   - Use Expo SecureStore for sensitive data (future auth tokens)
   - Never store passwords or sensitive data in AsyncStorage
   - Implement proper keychain/keystore integration

3. **App Transport Security**:
   - Enforce HTTPS for all network requests
   - Implement certificate validation
   - Use proper Content Security Policy headers
