# 🔐 Your BookMate Authentication Credentials

**Date**: November 12, 2025  
**Status**: ✅ **ACTIVE**

---

## 📧 Your Production Account

**Email**: `shaun@siamoon.com`  
**Password**: `Shaun231!`

**Account Details**:
- 🆔 User ID: `8241429b-c546-4bbb-9236-a76847abdab3`
- 🔥 Firebase UID: `UTJR1afV2VdPjaEZOSqIx5olZ4x2`
- 👤 Name: Shaun Ducker
- 📊 Role: `user`
- ✅ Status: `active`
- 📅 Created: November 12, 2025

---

## 🔑 How to Login

### Web Application
1. Go to: http://localhost:3000/login (or https://accounting.siamoon.com/login in production)
2. Enter email: `shaun@siamoon.com`
3. Enter password: `Shaun231!`
4. Click "Sign In"

### API (Programmatic Access)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shaun@siamoon.com",
    "password": "Shaun231!"
  }'
```

**Response**: You'll receive:
- `accessToken` - Valid for 15 minutes
- `refreshToken` - Valid for 7 days
- User profile information

---

## 🔐 Security Features Enabled

- ✅ **Password Encryption**: Your password is hashed with bcrypt (never stored as plain text)
- ✅ **JWT Tokens**: Secure token-based authentication
- ✅ **Account Locking**: Account locks for 30 minutes after 5 failed login attempts
- ✅ **IP Tracking**: Login IP addresses are logged for security
- ✅ **Audit Logging**: All authentication events are tracked
- ✅ **Firebase Sync**: Your account is synced with Firebase for mobile app access

---

## 📱 Using with Mobile App

Your account works with both:
- 🌐 **Web App**: https://accounting.siamoon.com
- 📱 **Mobile App**: Use the same email/password

The Firebase UID (`UTJR1afV2VdPjaEZOSqIx5olZ4x2`) links your web and mobile accounts.

---

## 🔄 Token Management

### Access Token
- **Expires**: 15 minutes
- **Use**: Include in `Authorization: Bearer {token}` header for API requests

### Refresh Token
- **Expires**: 7 days
- **Use**: Get a new access token when it expires

### Refresh Example
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 🛡️ Security Tips

1. **Keep your password safe** - Don't share it
2. **Use different passwords** for different services
3. **Enable 2FA** when available (coming soon)
4. **Log out** when using shared computers

---

## 📊 Your Authentication Timeline

| Event | Date | Status |
|-------|------|--------|
| Account Created | Nov 12, 2025 07:59 | ✅ Success |
| First Login | Nov 12, 2025 07:59 | ✅ Success |
| Firebase Sync | Nov 12, 2025 07:59 | ✅ Success |

---

## 🔧 Need Help?

### Forgot Password?
Coming soon: Password reset via email

### Account Locked?
Wait 30 minutes or contact support

### Questions?
Your account is fully set up and ready to use!

---

**Status**: ✅ **READY TO USE**  
**Next Step**: Login page will be updated to use this authentication system
