# 🏢 Suguna Supplier Portal — Cloud Edition

Modern, high-performance **Supplier Portal** for Suguna Logistics & Textmart POS, ready for 1-click deployment on **Render** connected to **Supabase Cloud Database**.

---

## 🚀 Features Included:
- **Supplier Authentication**: Mobile number login & email authentication.
- **Purchase Orders Hub**: PO accept/reject, PDF generator, items breakdown.
- **Advance Shipping Notice (ASN)**: LPN carton packaging, manifest, driver delivery pack generator.
- **Shipments Hub**: Live dispatch tracking, status transitions.
- **Purchase Returns**: RMA return logs & damage claims.
- **Notifications**: Real-time push alerts & activity feed.

---

## 🌐 Deploy to Render in 3 Steps:

1. **Connect Repository on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** -> **Web Service**.
   - Select your repository `https://github.com/Manoj2104/Supplier-potral.git`.

2. **Select Runtime**:
   - Environment: **Docker** (Automatically picks up `Dockerfile`).
   - Instance Type: **Free**.

3. **Configure Environment Variables (Supabase Database)**:
   Add the following Environment Variables in the Render Settings:

   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `APP_NAME` | `Suguna Supplier Portal` | Application Name |
   | `APP_ENV` | `production` | Production Mode |
   | `APP_KEY` | `base64:Rf51THet+CticDtUmOq9XJBaa9lDO9Y50bhx7Ds0NSI=` | Encryption Key |
   | `DB_CONNECTION` | `pgsql` | PostgreSQL for Supabase |
   | `DB_HOST` | `aws-0-ap-south-1.pooler.supabase.com` | Supabase DB Host |
   | `DB_PORT` | `6543` | Supabase Pooling Port |
   | `DB_DATABASE` | `postgres` | Database Name |
   | `DB_USERNAME` | `postgres.bfacggdnnajjqfvffhcw` | Supabase DB User |
   | `DB_PASSWORD` | `Your_Supabase_Database_Password` | Supabase DB Password |
   | `DB_SSLMODE` | `require` | SSL Encryption |

4. Click **Create Web Service**! Render will build and launch your Supplier Portal at `https://supplier-potral.onrender.com`.

---

## 🗄️ Database Import to Supabase:
- Import `pos_export.sql` into Supabase SQL Editor to populate all suppliers, products, and purchase orders.