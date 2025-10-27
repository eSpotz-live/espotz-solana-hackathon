# Espotz Solana - External Services & Infrastructure Requirements

---

## Executive Summary

**Minimum to Launch MVP:** $0-50/month (using free tiers + 1 paid service)
**Recommended Production:** $100-200/month + $5,000-15,000 one-time audit
**You DO NOT Need:** Your own Solana validator, oracle services, custom node infrastructure

---

## TIER 1: CRITICAL SERVICES (Cannot function without these)

### 1. RPC Provider - REQUIRED

**What It Does:**
- Gateway to Solana blockchain
- Submits your transactions
- Reads blockchain state
- Essential for every blockchain operation

**Recommended: Helius** (Solana-specialized)

```
Free Tier:
├─ Up to 100 requests/month
├─ Good for: Testing, development
└─ Cost: $0

$20/month:
├─ Up to 100K requests/month
├─ Includes: Webhooks, DAS API
├─ Good for: MVP production
└─ Cost: $20

$50+/month:
├─ Unlimited requests
├─ Priority support
├─ Good for: High-traffic production
└─ Cost: $50+
```

**Alternatives:**
- **QuickNode**: $0-40/month (also good)
- **Alchemy**: $0-50/month (more general blockchain)
- **Triton**: $10-100/month (RPC redundancy/failover)

**Decision:** Use Helius for MVP, can switch later if needed

**Estimated Cost:**
```
MVP Phase (Devnet testing): FREE
Production Phase (Mainnet): $20-50/month
```

**Load Estimate for 1,000 Players:**
```
Daily RPC Calls:
├─ Tournament creation: 25
├─ Player registrations: 200
├─ Frontend state queries: 5,000
├─ Result submissions: 5
├─ Prize distributions: 50
└─ Total: ~5,280 calls/day

Monthly: ~160K calls
Helius $20 tier includes: 100K/month (INSUFFICIENT)
Upgrade needed: $50/month tier for headroom
```

---

### 2. Frontend Hosting - REQUIRED

**What It Does:**
- Serves your React dApp to users globally
- Provides HTTPS/SSL
- Handles deployments
- Required for users to access platform

**Recommended: Vercel** (built for React/Next.js)

```
Free Tier:
├─ Unlimited deployments
├─ Global CDN
├─ HTTPS included
└─ Cost: $0

Pro Tier ($20/month):
├─ Better analytics
├─ Priority support
├─ Advanced features
└─ Cost: $20

Enterprise: Custom pricing
```

**Alternatives:**
- **Netlify**: $0-100/month (equally good)
- **Cloudflare Pages**: $0-200/month (most economical)

**Decision:** Start with Vercel free, upgrade if needed

**Estimated Cost:**
```
MVP Phase: FREE (Vercel free tier sufficient)
Production Phase: $20/month (or stick with free)
```

---

### 3. Domain Name - REQUIRED (for production)

**What It Does:**
- Custom URL for your platform (e.g., espotz.com)
- Professional appearance
- Required for production users

**Providers:**
- **Namecheap**: $0.98-$10.98/year
- **GoDaddy**: $2.99-$17.99/year
- **Google Domains**: $12/year

**Decision:** Buy when launching to production

**Estimated Cost:**
```
MVP Phase: $0 (skip, use Vercel preview URL)
Production Phase: $10-15/year
```

---

## TIER 2: ESSENTIAL FOR PRODUCTION

### 4. Smart Contract Audit - MANDATORY BEFORE MAINNET

**What It Does:**
- Professional security review of smart contract
- Identifies vulnerabilities
- Ensures fund safety
- **Cannot launch without this**

**Reputable Firms:**
```
Soteria (Solana-specialized):
├─ Cost: $5,000-10,000
├─ Timeline: 2-4 weeks
└─ Recommended

OtterSec:
├─ Cost: $8,000-20,000
├─ Timeline: 3-4 weeks
└─ Very thorough

SlowMist:
├─ Cost: $5,000-15,000
├─ Timeline: 2-4 weeks
└─ Good value

Trail of Bits:
├─ Cost: $10,000-30,000
├─ Timeline: 4-6 weeks
└─ Most thorough
```

**Decision:** Essential investment, cannot skip

**Estimated Cost:**
```
MVP Phase: $0 (not on mainnet yet)
Before Production: $5,000-15,000 (one-time)
```

---

### 5. Monitoring & Error Tracking - HIGHLY RECOMMENDED

**What It Does:**
- Alerts when smart contracts fail
- Captures frontend errors
- Monitors user experience
- Critical for operations

**Recommended: Sentry**

```
Free Tier:
├─ 5K events/month
├─ Basic error tracking
└─ Cost: $0

Pro Tier ($29/month):
├─ Unlimited events
├─ Performance monitoring
├─ Better support
└─ Cost: $29

Team Tier ($99+/month):
├─ Advanced features
├─ Team collaboration
└─ Cost: $99+
```

**Alternatives:**
- **LogRocket**: $99-299/month (includes session replay)
- **Datadog**: $15-100/month (APM + logs)

**Decision:** Use Sentry free tier initially, upgrade for production

**Estimated Cost:**
```
MVP Phase: $0 (free tier)
Production Phase: $29-50/month
```

---

## TIER 3: RECOMMENDED FOR GROWTH

### 6. Analytics - TRACK USER BEHAVIOR

**What It Does:**
- Understand how users interact with platform
- Identify drop-off points
- Measure feature adoption

**Options:**

```
Google Analytics (RECOMMENDED):
├─ Cost: Free forever
├─ Features: Page views, user flow, conversions
└─ Best for: Starting out

Mixpanel ($25-100/month):
├─ Cost: Paid with free trial
├─ Features: Custom events, gaming metrics
└─ Best for: Deep behavior analysis

Amplitude ($50-200/month):
├─ Cost: Paid
├─ Features: Cohort analysis, retention
└─ Best for: Advanced analytics
```

**Decision:** Start with Google Analytics (free), upgrade later if needed

**Estimated Cost:**
```
MVP Phase: $0 (Google Analytics)
Production Phase: $0-50/month (stay with GA or upgrade)
```

---

### 7. Email & Notifications - ENHANCE UX

**What It Does:**
- Send tournament updates to players
- Registration confirmations
- Prize claim notifications
- Result announcements

**Options:**

```
SendGrid (RECOMMENDED):
├─ Free: 100 emails/day
├─ Paid: $20-120/month
└─ Best for: Transactional emails

Firebase Cloud Messaging:
├─ Cost: Free (on Firebase)
├─ Push notifications
└─ Best for: Mobile notifications

Twilio SMS:
├─ Cost: $0.0075 per SMS
├─ SMS alerts
└─ Best for: Critical notifications
```

**Decision:** SendGrid for email, optional for MVP

**Estimated Cost:**
```
MVP Phase: $0 (skip email notifications)
Production Phase: $20-50/month (SendGrid paid)
```

---

## TIER 4: OPTIONAL - BUILD LATER

### 8. Backend API Server (Optional)

**When You Need It:**
- Storing tournament metadata (images, descriptions)
- Sending automated emails
- Complex queries for dashboards
- User authentication/profiles
- Historical data analysis

**When You DON'T Need It:**
- MVP phase (use blockchain for everything)
- Simple tournament platform
- Data fits in blockchain accounts

**Options if Needed:**

```
Railway ($5-100/month):
├─ Simple Node.js deployment
├─ Built-in PostgreSQL
└─ Good for: Rapid prototyping

Render ($7-100/month):
├─ Easy to use
├─ Good performance
└─ Good for: Serious projects

Fly.io ($0-500/month):
├─ Global infrastructure
├─ Low latency
└─ Good for: High-performance needs

AWS EC2 ($5-100/month):
├─ Maximum control
├─ Scalable
└─ Good for: Complex needs
```

**Decision:** Skip for MVP, add if needed later

**Estimated Cost:**
```
MVP Phase: $0 (not needed)
Later Phase: $10-50/month (if added)
```

---

### 9. Database (If Custom Backend)

**When Needed:**
- If you build custom backend API
- For storing tournament metadata
- For off-chain player profiles
- For analytics/historical data

**Options if Needed:**

```
Supabase (PostgreSQL):
├─ Free: 500MB, 1 project
├─ Paid: $25-200/month
└─ Best for: Quick setup

Railway (PostgreSQL):
├─ Cost: $5-100/month
├─ Included with backend
└─ Best for: Simple projects

AWS RDS (PostgreSQL):
├─ Cost: $10-100/month
├─ Maximum flexibility
└─ Best for: Complex data

Firebase Firestore:
├─ Cost: $0-100/month
├─ No SQL, document-based
└─ Best for: Real-time features
```

**Decision:** Skip for MVP, add if custom backend added

**Estimated Cost:**
```
MVP Phase: $0 (not needed)
Later Phase: $0-50/month (if added)
```

---

## WHAT YOU DO NOT NEED

### ❌ Your Own Solana Validator/Node Infrastructure

**Why not:**
```
Cost: $5,000-10,000/month
Maintenance: Requires DevOps expertise
Complexity: 256GB RAM, high bandwidth needed
Reliability: RPC provider more reliable

What you get instead:
├─ Helius provides: Professional validator infrastructure
├─ Uptime: 99.99% SLA
├─ Support: 24/7 engineering support
├─ Cost: $20-50/month
└─ Result: Better reliability for less money
```

### ❌ Oracle Service (Switchboard, etc.)

**Why not:**
```
Aptos architecture needed oracle for:
├─ AI stream analysis
├─ Automatic result extraction
└─ Decentralized result validation

Solana architecture uses:
├─ Tournament operator submits results directly
├─ No oracle needed
├─ Lower cost + simpler architecture
└─ Full transparency via on-chain events
```

### ❌ Custom Indexer (for MVP)

**Why not:**
```
What Helius provides:
├─ Pre-indexed tournament data
├─ Can query all tournaments
├─ DAS API for complex queries
└─ No additional cost

When to build custom indexer:
├─ Need advanced leaderboards
├─ Complex cross-tournament analytics
├─ Custom player statistics
└─ Timeline: Build in Phase 2 if needed
```

---

## COST SUMMARY BY PHASE

### MVP Phase (Weeks 1-4)

```
┌─────────────────────────────────┬───────┐
│ Service                         │ Cost  │
├─────────────────────────────────┼───────┤
│ RPC (Helius free tier)          │ $0    │
│ Frontend hosting (Vercel free)  │ $0    │
│ Development tools (GitHub, etc) │ $0    │
├─────────────────────────────────┼───────┤
│ TOTAL MONTHLY                   │ $0    │
└─────────────────────────────────┴───────┘

Development on Solana Devnet (no real costs)
```

### Pre-Production Phase (Weeks 4-6)

```
┌─────────────────────────────────┬──────────┐
│ Service                         │ Cost     │
├─────────────────────────────────┼──────────┤
│ Smart Contract Audit            │ $5-15K   │
│ Domain Name                     │ $10/year │
│ RPC upgrade (Helius)            │ $20/mo   │
├─────────────────────────────────┼──────────┤
│ TOTAL ONE-TIME                  │ $5-15K   │
│ TOTAL MONTHLY                   │ $20/mo   │
└─────────────────────────────────┴──────────┘

Before Solana Mainnet launch
```

### Production Phase (Month 2+)

```
┌─────────────────────────────────┬────────────┐
│ Service                         │ Cost       │
├─────────────────────────────────┼────────────┤
│ RPC (Helius $50 tier)           │ $50/mo     │
│ Frontend (Vercel or free)       │ $0-20/mo   │
│ Monitoring (Sentry)             │ $25/mo     │
│ Analytics (Google)              │ $0/mo      │
│ Email (SendGrid optional)       │ $0-20/mo   │
│ Domain                          │ $1/mo*     │
├─────────────────────────────────┼────────────┤
│ TOTAL MONTHLY (BASE)            │ $76/mo     │
│ WITH EMAIL & FRONTEND           │ $96-116/mo │
│ WITH ADVANCED OPTIONS           │ $150+/mo   │
└─────────────────────────────────┴────────────┘

*Pro-rated annually ($10-15/year)

This is sustainable for:
- 1,000+ monthly active players
- 100+ concurrent tournaments
- Professional monitoring & support
```

---

## PROCUREMENT TIMELINE

### Week 1: Development Setup
```
□ Create Helius account (free tier)
  └─ https://www.helius.dev
  └─ Get free RPC endpoint

□ Deploy to Vercel (free)
  └─ https://vercel.com
  └─ Connect GitHub repository

□ Create GitHub repository
  └─ https://github.com
  └─ Free private repos

Cost: $0
Time: 30 minutes
```

### Week 2-4: Development
```
□ Develop smart contract on devnet
□ Develop React frontend
□ Test with free RPC tier
□ No external costs during development

Cost: $0
Time: 4 weeks
```

### Week 4-5: Pre-Mainnet
```
□ Hire audit firm (if not already done)
  └─ Book now: Soteria, OtterSec, SlowMist
  └─ Timeline: 2-4 weeks

□ Upgrade Helius to $20 tier
  └─ Add credit card
  └─ Enable webhooks

□ Buy domain name
  └─ Namecheap or GoDaddy
  └─ Point DNS to Vercel

Cost: $5-15K (audit) + $20 (RPC) + $10 (domain)
Time: Parallel with audit
```

### Week 5+: Mainnet Launch
```
□ Deploy smart contract to mainnet
  └─ Cost: ~$500 for deployment transaction

□ Set program authority (multisig recommended)
  └─ Secure upgrade authority

□ Launch frontend against mainnet
  └─ Update RPC endpoints to mainnet Helius

□ Add Sentry monitoring
  └─ https://sentry.io
  └─ Initialize in React app

□ Setup Google Analytics
  └─ Free forever
  └─ Track user behavior

Cost: $500 (deployment) + $20-50 (RPC) + $25 (Sentry)
Time: 1-2 days
```

### Month 2+: Operations
```
□ Monitor RPC usage
  └─ Upgrade if approaching limits

□ Monitor transaction costs
  └─ Optimize if exceeding budget

□ Add more services as needed
  └─ Email notifications
  └─ Advanced analytics

Cost: $75-150+/month
Time: Ongoing
```

---

## SERVICE PRIORITIZATION MATRIX

```
                    CRITICAL TO LAUNCH
                           ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
    RPC Provider    Frontend Hosting    Blockchain
    (Helius)       (Vercel)            (Solana)

                  BUILD/TEST PHASE
                           ↓
                    $0 cost (free tiers)
                    4 weeks development


                  BEFORE MAINNET
                           ↓
        ┌────────────────────────────────────┐
        ↓                                    ↓
    Smart Contract Audit          Domain Name
    ($5-15K, 2-4 weeks)          ($10/year)


                  PRODUCTION
                           ↓
        ┌────────────────────────────────────┐
        ↓                 ↓                  ↓
    Monitoring      Analytics        Optional Email
    (Sentry)        (Google)         (SendGrid)
    $25/mo          $0/mo            $0-20/mo
```

---

## DECISION CHECKLIST

### Before Development Start
- [ ] Do we have Solana CLI installed?
- [ ] Can we deploy to devnet?
- [ ] Is Helius account created (free tier)?

### Before MVP Release
- [ ] Is Vercel frontend set up?
- [ ] Does frontend connect to RPC?
- [ ] Can we create/register/distribute on devnet?

### Before Mainnet Launch
- [ ] Is smart contract audit COMPLETE?
- [ ] Is domain name purchased?
- [ ] Is Helius upgraded to paid tier?
- [ ] Is program authority set to multisig?
- [ ] Is Sentry integrated?

### Launch Day
- [ ] Deploy contract to mainnet
- [ ] Update frontend RPC endpoints
- [ ] Launch frontend
- [ ] Monitor error tracking
- [ ] Test end-to-end flow

### First Week Operations
- [ ] Monitor transaction success rate
- [ ] Check RPC usage vs quota
- [ ] Review error logs in Sentry
- [ ] Verify all tournaments created successfully

---

## FAQ

**Q: Do I need to run my own Solana node?**
A: No. Helius or other RPC providers handle this. Cost would be $5K-10K/month if you did it yourself.

**Q: What if Helius goes down?**
A: You can use multiple RPC providers in parallel (Helius + QuickNode) for redundancy. But they rarely go down (99.99% uptime).

**Q: Can I use the free tier for production?**
A: Not recommended. Free tier has low rate limits. $20-50/month provides headroom and enables webhooks.

**Q: Do I need a backend server?**
A: Not for MVP. Everything can live on blockchain. Add backend later if needed for complex features.

**Q: What's the smart contract audit?**
A: Professional security review (2-4 weeks). Finds vulnerabilities. MANDATORY before handling real user money on mainnet.

**Q: Can I skip the audit?**
A: Not if handling real USDC. Required for user safety and legal protection.

**Q: What about legal/compliance services?**
A: Depends on your jurisdiction. Consult a lawyer about gambling regulations and KYC/AML requirements. Budget $2,000-10,000 if needed.

**Q: When should I hire DevOps?**
A: For production, might benefit from 1-2 days/week of DevOps for monitoring setup. Not critical if you use Vercel + Helius.

---

## RECOMMENDED SERVICE SELECTION

### For Maximum Cost Efficiency:
```
├─ RPC: Helius $20/mo (free tier for dev)
├─ Frontend: Vercel free tier
├─ Analytics: Google Analytics free
├─ Monitoring: Sentry free tier (upgrade later)
└─ Total: $20/mo for production
```

### For Reliability & Professional Setup:
```
├─ RPC: Helius $50/mo (headroom)
├─ Frontend: Vercel $20/mo (analytics)
├─ Monitoring: Sentry $29/mo (full features)
├─ Analytics: Google Analytics free
├─ Email: SendGrid free tier (100/day)
└─ Total: $99/mo
```

### For Enterprise/Serious Launch:
```
├─ RPC: Helius $50/mo + QuickNode $20/mo (redundancy)
├─ Frontend: Vercel $50/mo (advanced)
├─ Monitoring: Sentry $99/mo (team)
├─ Analytics: Mixpanel $50/mo (advanced)
├─ Email: SendGrid $50/mo (unlimited)
├─ Backend: Railway $20/mo (if needed)
└─ Total: $289/mo
```

---

## FINAL SUMMARY

**You Need:**
1. ✅ RPC Provider (Helius recommended)
2. ✅ Frontend Hosting (Vercel recommended)
3. ✅ Domain Name (for production)
4. ✅ Smart Contract Audit (MANDATORY)
5. ✅ Monitoring (Sentry for production)

**You Don't Need:**
1. ❌ Your own Solana validator
2. ❌ Oracle service
3. ❌ Custom indexer (for MVP)
4. ❌ Complex backend (for MVP)

**Minimum Cost:**
- MVP: $0 (free tiers)
- Production: $100-150/month + $5-15K audit (one-time)

**Best Timeline:**
- Week 1: Setup free services
- Week 2-4: Build & test on devnet
- Week 4-5: Audit + prepare mainnet
- Week 5+: Launch mainnet + production services

