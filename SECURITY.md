# Security Policy - Ronds Pocket

**Last Updated:** 2026-10-09

## Pelaporan Kerentanan Keamanan

Jika Anda menemukan kerentanan keamanan, mohon laporkan ke:
- **Email:** jajangworj@gmail.com
- **Prioritas:** Kerentanan kritis akan ditangani dalam 24 jam

Mohon **jangan** membuat issue publik untuk kerentanan keamanan sampai masalah tersebut diperbaiki.

---

## Praktik Keamanan yang Diterapkan

### 1. Authentication & Authorization ✅

- **JWT-based authentication** melalui Convex Auth
- **Role-based access control (RBAC):**
  - `owner`: Full control atas kantong
  - `partner`: Akses terbatas, hanya bisa edit data sendiri
- **Authorization checks** di setiap mutation:
  - `requireUserId()` - Memastikan user terautentikasi
  - `requireMember()` - Verifikasi membership di kantong
  - `requireOwner()` - Operasi owner-only
  - `requireOwnerOrCreator()` - Mencegah edit data orang lain

### 2. Input Validation & Sanitization ✅

- **Amount validation:**
  - Hanya angka finite yang valid
  - Minimum: > 0
  - Maximum: 1 triliun rupiah (mencegah overflow)
- **String sanitization:**
  - Semua input di-trim
  - Length limits: category (40), note (200), name (60)
  - HTML escaping untuk email content
- **No raw SQL queries** - Menggunakan Convex ORM dengan type safety

### 3. Rate Limiting ✅

- **Invite code redemption:**
  - Max 8 attempts per 15 menit
  - Automatic cleanup old attempts
  - Mencegah brute force attack
- **Invite code expiration:**
  - Default TTL: 7 hari
  - Owner dapat revoke kapan saja

### 4. Secrets Management 🔒

**Environment Variables yang Required:**
```bash
CONVEX_SITE_URL=          # Required untuk auth
VLY_INTEGRATION_KEY=      # Optional - email OTP
RESEND_API_KEY=           # Optional - feedback emails
GEMINI_API_KEY=           # Optional - AI features
```

**Best Practices:**
- ✅ Semua secrets di environment variables
- ✅ `.env.local` di gitignore
- ✅ `.env.keys` di gitignore (PENTING!)
- ✅ Error messages tidak mengekspos secrets
- ✅ Validasi keys dengan helper functions di `src/convex/env.ts`

### 5. XSS Protection ✅

- ✅ React auto-escaping untuk semua user input
- ✅ Minimal penggunaan `dangerouslySetInnerHTML` (hanya untuk chart styling)
- ✅ Tidak ada `eval()` atau `Function()` constructor
- ✅ HTML escaping manual untuk email content

### 6. Data Isolation ✅

- **Strict book-level isolation:**
  - Semua queries di-filter by `book_id`
  - Tidak ada data leakage antar books
  - Member verification sebelum akses data
- **Activity logging:**
  - Audit trail untuk semua perubahan
  - Stored server-side (tidak bisa dilewati)
  - Actor name disimpan sebagai snapshot

### 7. Cryptographic Security ✅

- **Invite codes:**
  - Generated dengan `crypto.getRandomValues()` (fallback ke Math.random)
  - Alphabet tanpa karakter ambigu (no I, O, 0, 1)
  - 8 karakter = ~34 bits entropy
- **OTP codes:**
  - 6 digit numerik
  - Generated dengan @oslojs/crypto
  - TTL 15 menit

---

## Dependencies Security

### Audit Terakhir: 2026-10-09

**Status:** ✅ **0 vulnerabilities**

**Packages Updated:**
- `@convex-dev/auth`: 0.0.90 → latest (fixed critical auth vulnerabilities)
- `axios`: 1.13.2 → latest (fixed ReDoS, prototype pollution, SSRF)
- `react-router`: 7.10.0 → latest (fixed CSRF bypass)
- `hono`: 4.10.7 → latest (fixed ReDoS, XSS, memo() disclosure)

**Maintenance:**
```bash
# Check for vulnerabilities
npm audit

# Update all packages
npm update

# Fix vulnerabilities automatically
npm audit fix
```

---

## Konfigurasi Production

### Environment Variables

**Required:**
```bash
CONVEX_SITE_URL=https://your-domain.com
NODE_ENV=production
```

**Optional (recommended):**
```bash
VLY_INTEGRATION_KEY=your-integration-key
RESEND_API_KEY=your-resend-key
GEMINI_API_KEY=your-gemini-key
```

### Deployment Checklist

- [ ] Semua environment variables di-set
- [ ] `.env.keys` tidak ter-commit ke repository
- [ ] `npm audit` menunjukkan 0 vulnerabilities
- [ ] Rate limiting aktif
- [ ] Error logging ke monitoring service
- [ ] HTTPS enforced
- [ ] Regular security audits scheduled

---

## Security Headers

Convex menangani security headers secara otomatis, termasuk:
- CORS policy
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options

Untuk custom HTTP routes, pastikan menambahkan header yang sesuai.

---

## Error Handling

### Development
Error messages bisa detail untuk debugging:
```typescript
"VLY_INTEGRATION_KEY is not set"
```

### Production
Error messages generic untuk user:
```typescript
"Layanan email sedang tidak tersedia. Silakan coba lagi nanti."
```

Server logs tetap mencatat detail error untuk debugging.

---

## Monitoring & Incident Response

### Log What Matters
- ✅ Failed authentication attempts
- ✅ Authorization failures
- ✅ API key validation errors
- ✅ Rate limit violations
- ✅ Unusual activity patterns

### Response Time
- **Critical:** < 24 jam
- **High:** < 72 jam
- **Medium:** < 1 minggu
- **Low:** Next release

---

## Security Roadmap

### Completed ✅
- [x] Dependency vulnerability fixes
- [x] Input validation & sanitization
- [x] Authorization layer
- [x] Rate limiting for invite codes
- [x] Secrets management
- [x] Error message sanitization

### Future Enhancements 🔮
- [ ] Two-factor authentication (2FA)
- [ ] Session timeout management
- [ ] IP-based rate limiting
- [ ] Automated security scanning in CI/CD
- [ ] Security incident response playbook
- [ ] Penetration testing
- [ ] GDPR compliance audit
- [ ] Data encryption at rest

---

## Compliance

### Data Privacy
- User data disimpan per-book dengan strict isolation
- Email hanya visible untuk book owner
- Activity logs untuk transparency
- User dapat leave book (data tetap tersimpan untuk audit)

### GDPR Considerations
- User consent untuk data collection (signup)
- Right to access data (query APIs)
- Right to erasure (belum implemented)
- Data portability (export features)

---

## Contact

**Security Issues:** jajangworj@gmail.com  
**General Support:** Via aplikasi (tombol Masukan)

---

*Dokumen ini diperbarui setiap kali ada perubahan signifikan pada praktik keamanan.*
