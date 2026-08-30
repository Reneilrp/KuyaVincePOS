# 🚀 Sunmi Multi-Branch Cloud POS & Handheld Ecosystem

An enterprise-ready, modular Point of Sale (POS) system engineered specifically for **Sunmi Android Handheld Terminals (V2/V2s/V2 Pro)** across **3 Physical Branches** (dynamically expandable), coupled with a **Real-Time Admin Laptop Web Dashboard**.

---

## 🌟 Key Architecture & Capabilities

```mermaid
graph TD
    subgraph "1. Physical Stores (Sunmi Android Terminals)"
        B1["🏢 Branch 1 (Downtown Flagship)<br/>SUNMI Handheld 01"] --> Cloud["☁️ Cloud Backend (Laravel 11 / MySQL)"]
        B2["🏢 Branch 2 (Mall Galleria)<br/>SUNMI Handheld 01"] --> Cloud
        B3["🏢 Branch 3 (Express Kiosk)<br/>SUNMI Handheld 01"] --> Cloud
    end

    subgraph "2. Admin Laptop Web Portal"
        Cloud --> Admin["💻 Admin Laptop Dashboard (React 18 / Tailwind)"]
        Admin --> A1["📊 Live 3-Branch Consolidated & Filtered Sales"]
        Admin --> A2["📦 Per-Branch Stock Matrix & Restock Flow"]
        Admin --> A3["👥 Staff Timeclock & Automated Payroll"]
        Admin --> A4["🖨️ Daily Z-Readings & A4 Audit Prints"]
        Admin --> A5["🔑 Dynamic Sunmi Terminal Provisioning"]
    end
```

---

## 📁 Repository Structure

* **[`backend/`](file:///home/pheinz/Sunmi-MultiBranch-POS/backend)**: PHP 8.3 / Laravel 11 Cloud REST API engine with multi-branch database schema, pessimistic inventory row locking (`lockForUpdate`), cashier PIN auth, timeclock tracking, payroll computations, and 58mm Z-report formatters.
* **[`pos-mobile/`](file:///home/pheinz/Sunmi-MultiBranch-POS/pos-mobile)**: Expo / React Native client optimized for low-memory (1GB-2GB RAM) Sunmi Handheld terminals with Hermes JS, `@shopify/flash-list`, Zustand state management, 58mm thermal receipt printing, and offline fallback queueing.
* **[`admin-web/`](file:///home/pheinz/Sunmi-MultiBranch-POS/admin-web)**: Modern React 18 + Tailwind CSS web dashboard for the business owner's laptop/desktop with live branch switching (`All Branches` vs `Branch 1/2/3`), date range filtering (`Today`, `Week`, `Month`), restocking, payroll generator, and thermal/A4 print views.

---

## 🧪 Testing & Verification

Run the full PHPUnit backend feature test suite:
```bash
cd backend
./vendor/bin/phpunit
```
*Tests verify:* Multi-branch data isolation, Sunmi device provisioning, atomic checkout deductions, restocking adjustments, cashier shifts & Z-readings, and staff payroll calculations.

---

## 🚀 Running the Applications

### 1. Launch Admin Web Dashboard (Laptop)
```bash
cd admin-web
npm run dev
```
Open `http://localhost:3000` in any browser on your laptop.

### 2. Launch Sunmi Handheld Mobile POS (Expo)
```bash
cd pos-mobile
npm run web   # Or: npx expo start --android
```
