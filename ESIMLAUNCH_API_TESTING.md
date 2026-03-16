# Using Voyage with esimlaunch API (Easy Way merchant flow)

For **Easy Way** merchants, each gets a full stack (Voyage frontend + Voyage backend on Railway/Render with their own Postgres, Clerk, Stripe, Resend). The only change from “Voyage → eSIM Access” is: **the Voyage backend calls esimlaunch API instead of eSIM Access.**

- **Voyage frontend** → **Voyage backend** (unchanged; frontend still talks to its own backend).
- **Voyage backend** → **esimlaunch API** (with merchant API key) → eSIM Access.

So you still deploy a **backend** for each merchant; that backend uses **your** API instead of eSIM Access.

---

## Voyage backend configuration for esimlaunch

In the **Voyage backend** `.env` (or Railway/Render env vars), set:

```env
ESIM_PROVIDER=esimlaunch
ESIMLAUNCH_API_BASE=https://api.esimlaunch.com
ESIMLAUNCH_API_KEY=<merchant API key from esimlaunch dashboard>
```

Leave `ESIM_ACCESS_CODE` and `ESIM_SECRET_KEY` empty (or omit them) when using esimlaunch. The backend will use the esimlaunch client and send `Authorization: Bearer <ESIMLAUNCH_API_KEY>` to your API.

---

## Flow

1. **esimlaunch** runs once (your dashboard + API); you create a merchant and issue an API key for them.
2. For each **Easy Way** merchant you deploy:
   - **Voyage frontend** (e.g. Vercel) with `NEXT_PUBLIC_API_URL` = that merchant’s Voyage backend URL.
   - **Voyage backend** (e.g. Railway) with its own DB, Clerk, Stripe, Resend, and the env above (`ESIM_PROVIDER=esimlaunch`, `ESIMLAUNCH_API_BASE`, `ESIMLAUNCH_API_KEY`).
3. The Voyage backend serves the frontend and handles Stripe/orders; eSIM operations (packages, order, query, suspend, topup) go to esimlaunch API.

---

## Local testing (Voyage + esimlaunch)

1. **Start esimlaunch backend** (port 3000):
   ```bash
   cd backend && npm start
   ```
2. **Start Voyage** (frontend + backend):
   ```bash
   cd "CLONED SITE/Voyage"
   npm run dev
   ```
   Frontend on 3000, Voyage backend on 3001.
3. In **Voyage backend** `.env` set `ESIM_PROVIDER=esimlaunch`, `ESIMLAUNCH_API_BASE=http://localhost:3000`, `ESIMLAUNCH_API_KEY=<your test merchant API key>`.
4. Set **Voyage frontend** `NEXT_PUBLIC_API_URL=http://localhost:3001/api` so it talks to the Voyage backend.
5. Open the Voyage site; countries/plans/orders will come from Voyage backend → esimlaunch API.

---

## Advanced Way

**Advanced Way** merchants do **not** get a built site. They only get an API key and use esimlaunch endpoints directly (`/api/v1/packages`, `/api/v1/orders`, etc.) from their own systems. No Voyage stack.
