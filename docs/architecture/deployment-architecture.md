# Deployment Architecture

## Build Configuration

**Development Build:**
```bash
# Local development
expo start --clear

# Development build for testing
eas build --profile development --platform all
```

**Production Build:**
```bash
# Production build
eas build --profile production --platform all

# Submit to app stores
eas submit --platform all
```

## App Store Configuration

**iOS Configuration (app.json):**
```json
{
  "expo": {
    "name": "Health Dashboard",
    "slug": "health-dashboard",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.yourcompany.healthdashboard",
      "buildNumber": "1",
      "requireFullScreen": true,
      "userInterfaceStyle": "automatic"
    },
    "android": {
      "package": "com.yourcompany.healthdashboard",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#10B981"
      }
    }
  }
}
```
