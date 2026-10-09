# 🔑 Key Rotation Guide - URGENT ACTION REQUIRED

**Date:** 2026-10-09
**Status:** 🚨 **CRITICAL - `.env.keys` exposed in git history**

---

## ⚠️ What Happened?

File `.env.keys` yang berisi `DOTENV_PRIVATE_KEY_LOCAL` telah ter-commit ke git repository sejak commit pertama:

```
Commit: 1336296f79200eb9a4533f64b38ef2ba30468828
Date: 2026-09-30 18:48:15 +0000
Status: EXPOSED in git history
```

**Impact:** Siapapun dengan akses ke repository bisa membaca private key ini. Karena encryption key sudah exposed, lebih aman untuk **menghapus sistem enkripsi sepenuhnya** dan mengandalkan `.gitignore` yang sudah diperkuat.

---

## 🔥 Immediate Actions (DO NOW)

### Step 1: Remove Encryption System (RECOMMENDED)

Karena `.env.keys` sudah exposed, encryption jadi tidak berguna lagi. Lebih simple dan aman untuk menghapusnya:

```bash
# 1. Backup .env.keys (just in case)
Copy-Item .env.keys .env.keys.backup

# 2. Delete .env.keys permanently
Remove-Item .env.keys -Force

# 3. Verify it's in .gitignore (already done in security update)
Select-String -Path .gitignore -Pattern "\.env\.keys"
# Should show: .env.keys

# 4. Create new .env.local from template (without encryption)
Copy-Item .env.example .env.local
```

**Why remove encryption?**
- ✅ Simpler - no need to manage encryption keys
- ✅ Safer - exposed encryption is worse than no encryption
- ✅ Better - use proper secret managers in production (Convex env vars, Vercel env)
- ✅ Standard - `.gitignore` protection is industry standard for local dev

### Step 2: Rotate ALL API Keys

**PENTING:** Karena `.env.keys` sudah terekspos, asumsikan semua secrets juga bisa terekspos. Rotate semua API keys sekarang juga:

#### A. VLY Integration Key (untuk Email OTP)

1. Login ke **Freebuff/VLY Dashboard**: https://freebuff.com
2. Navigate ke Integration Keys atau API Keys section
3. **Revoke/Delete old key** (yang mungkin terekspos)
4. **Generate new integration key**
5. Copy key baru dan update `.env.local`:

```bash
VLY_INTEGRATION_KEY=vly_your_new_key_here
VLY_INTEGRATION_BASE_URL=https://integrations.vly.ai
VLY_CONVEX_AUTH_ISSUER=https://freebuff.com
```

#### B. Resend API Key (untuk Feedback Emails)

1. Login ke **Resend Dashboard**: https://resend.com/api-keys
2. Find your old API key
3. **Delete/Revoke old key**
4. Click **"Create API Key"**
5. Copy key baru dan update `.env.local`:

```bash
RESEND_API_KEY=re_your_new_key_here
FEEDBACK_INBOX=your-email@domain.com
FEEDBACK_FROM=noreply@yourdomain.com
```

#### C. Gemini API Key (untuk AI Composer)

1. Login ke **Google AI Studio**: https://aistudio.google.com/apikey
2. Find your existing API key
3. **Delete old key** (click trash icon)
4. Click **"Create API Key"**
5. Copy key baru dan update `.env.local`:

```bash
GEMINI_API_KEY=AIzaSy_your_new_key_here
```

#### D. Convex Environment Variables (Safe - No Action Needed)

Convex keys (VITE_CONVEX_URL, CONVEX_DEPLOYMENT) biasanya aman karena:
- Auto-generated per deployment
- Managed by Convex platform
- Not sensitive secrets

Tapi tetap verifikasi di: https://dashboard.convex.dev

```bash
# These are usually safe, but verify:
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_SITE_URL=http://localhost:5173
CONVEX_DEPLOYMENT=dev:your-deployment-name
```

### Step 3: Remove `.env.keys` from Git History

**⚠️ WARNING:** Ini akan rewrite git history. Backup dulu!

```bash
# Backup current state
git branch backup-before-cleanup

# Option 1: Using git filter-branch (classic method)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.keys" \
  --prune-empty --tag-name-filter cat -- --all

# Option 2: Using BFG Repo-Cleaner (faster, recommended)
# Download BFG: https://rpo.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env.keys
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Verify file removed from history
git log --all --full-history -- .env.keys
# Should return nothing

# Force push (if working with remote)
# git push origin --force --all
# git push origin --force --tags
```

### Step 4: Verify Gitignore (Already Done ✅)

`.gitignore` sudah diupdate dengan comprehensive security patterns termasuk `.env.keys`:

```bash
# Verify (should show multiple matches)
Select-String -Path .gitignore -Pattern "\.env"

# Output should include:
# .env.keys
# .env.local
# .env.*.local
# etc.
```

✅ **Already configured** - No action needed.

---

## ✅ Verification Checklist

After completing all steps:

- [ ] `.env.keys` deleted from local directory
- [ ] `.env.keys.backup` created (for reference only)
- [ ] New `.env.local` created from `.env.example`
- [ ] `VLY_INTEGRATION_KEY` rotated and updated
- [ ] `RESEND_API_KEY` rotated and updated
- [ ] `GEMINI_API_KEY` rotated and updated
- [ ] `.env.keys` removed from git history
- [ ] `.env.keys` confirmed in `.gitignore` (already done ✅)
- [ ] Application tested with new keys
- [ ] Old keys revoked/deleted from providers
- [ ] `.env.keys.backup` deleted after verification

---

## 🧪 Testing After Rotation

```bash
# 1. Verify .env.local exists and has all required variables
Test-Path .env.local

# 2. Start Convex development
npm run convex:dev

# 3. In another terminal, start dev server
npm run dev

# 4. Manual feature testing:
# ✅ Sign in with email OTP → tests VLY_INTEGRATION_KEY
# ✅ Submit feedback → tests RESEND_API_KEY  
# ✅ Try AI composer → tests GEMINI_API_KEY
# ✅ Navigate dashboard → tests basic functionality

# 5. Test build (optional)
npm run build
```

---

## 📝 Template: New `.env.local` (Without Encryption)

Copy dari `.env.example` dan isi dengan values yang baru:

```bash
# =============================================================================
# Ronds Pocket - Environment Variables (LOCAL DEVELOPMENT)
# =============================================================================

# -----------------------------------------------------------------------------
# Convex Configuration (REQUIRED)
# -----------------------------------------------------------------------------
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_SITE_URL=http://localhost:5173
CONVEX_DEPLOYMENT=dev:your-deployment-name

# -----------------------------------------------------------------------------
# VLY Integration (REQUIRED - Email OTP)
# -----------------------------------------------------------------------------
VLY_INTEGRATION_KEY=vly_new_key_here
VLY_INTEGRATION_BASE_URL=https://integrations.vly.ai
VLY_CONVEX_AUTH_ISSUER=https://freebuff.com

# -----------------------------------------------------------------------------
# Resend (OPTIONAL - Feedback Emails)
# -----------------------------------------------------------------------------
RESEND_API_KEY=re_new_key_here
FEEDBACK_INBOX=your-email@domain.com
FEEDBACK_FROM=noreply@yourdomain.com

# -----------------------------------------------------------------------------
# Gemini AI (OPTIONAL - AI Composer)
# -----------------------------------------------------------------------------
GEMINI_API_KEY=AIzaSy_new_key_here

# -----------------------------------------------------------------------------
# VLY Monitoring (OPTIONAL)
# -----------------------------------------------------------------------------
VITE_VLY_APP_ID=
VITE_VLY_MONITORING_URL=

# -----------------------------------------------------------------------------
# Environment
# -----------------------------------------------------------------------------
NODE_ENV=development
```

**No encryption needed!** Plain text in `.env.local` is safe because:
- ✅ `.env.local` is in `.gitignore` (protected)
- ✅ Only exists on your local machine
- ✅ Never committed to git
- ✅ Production uses proper secret managers (Convex env vars, Vercel env, etc)

---

## 📊 Security Impact Assessment

### Before Rotation (CRITICAL)
- 🔴 `.env.keys` exposed in git history
- 🔴 Encryption system compromised
- 🔴 All API keys potentially accessible
- 🔴 Git history contains sensitive data
- 🔴 Risk: Unauthorized access to services

### After Rotation (SECURE)
- ✅ Encryption system removed (simpler & safer)
- ✅ All API keys rotated with new values
- ✅ Old keys revoked at provider level
- ✅ `.env.keys` removed from git history
- ✅ `.env.local` protected by gitignore
- ✅ Production secrets use proper secret managers

---

## 🚨 If You've Already Pushed to Public Repository

**ADDITIONAL STEPS REQUIRED:**

1. **Assume breach** - All keys are compromised
2. **Rotate immediately** - Don't wait
3. **Monitor services** - Check for unusual activity
4. **Notify users** (if applicable) - Depends on exposure
5. **Consider repository re-creation** - If history can't be cleaned

### Check for Exposure

```bash
# If pushed to GitHub
gh api repos/:owner/:repo/commits --jq '.[].sha' | while read sha; do
  echo "Checking $sha..."
  gh api repos/:owner/:repo/git/trees/$sha?recursive=1 --jq '.tree[].path' | grep ".env.keys" && echo "FOUND in $sha"
done
```

---

## 📞 Need Help?

If you're uncertain about any step:

1. **Backup everything first**
2. **Document current state**
3. **Contact security team** (if working in team)
4. **Refer to SECURITY.md** for contact info

---

## 🔄 Going Forward (Prevent Future Exposure)

### Local Development ✅
1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use `.env.example`** as template - Already configured
3. **Keep secrets local** - No encryption needed for local dev
4. **Rotate keys regularly** - Every 6 months minimum

### Production Deployment ✅
1. **Use platform secret managers:**
   - Convex: Environment Variables in Dashboard
   - Vercel/Netlify: Environment Variables settings
   - AWS: Secrets Manager / Parameter Store
   - Never hardcode in production code

2. **Enable secret scanning:**
   - GitHub Secret Scanning (already configured)
   - TruffleHog in CI/CD (already configured)
   - Pre-commit hooks for sensitive files

3. **Automated security:**
   - Weekly npm audit (already configured)
   - Dependabot updates (already configured)
   - Monthly security reviews

### Team Best Practices ✅
1. **Onboarding checklist:**
   - Copy `.env.example` to `.env.local`
   - Get API keys from team lead
   - Never commit `.env.local`
   - Never share keys via chat/email

2. **Security training:**
   - Read `SECURITY.md`
   - Understand git history implications
   - Know how to rotate keys
   - Report security concerns immediately

---

## 📚 References

- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git-filter-branch manual](https://git-scm.com/docs/git-filter-branch)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Status:** 🔴 **ACTION REQUIRED**
**Priority:** 🚨 **CRITICAL**
**Estimated Time:** 20-30 minutes (simplified without encryption)

*Complete all steps before deploying to production.*
