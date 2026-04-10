# Apex Chem (Pty) Ltd — Platform Overview

### Presenter Guide & App Walkthrough

---

## 🏢 About Apex Chem

**Apex Chem (Pty) Ltd** — Established 2022, Umbogintwini, KwaZulu-Natal

Apex Chem is a waste-to-energy company specialising in the collection, processing, and recycling of waste oils from vegetable origin. Our core focus areas include:

- **Used Cooking Oil (UCO)** — collected from restaurants, fast food outlets, and food manufacturers
- **Gum Oil** — a by-product of vegetable oil refining
- **Winterized Oil** — removed during the winterization process of vegetable oils
- **Acid Oils** — generated during the neutralisation stage of vegetable oil refining

Our digital platform connects every part of the supply chain — from the customer who generates the waste, to the driver who collects it, to the aggregator who processes it, all managed through a centralised admin dashboard.

**Core Values:**
- Waste-to-Energy Solutions
- ESG Waste Management
- Zero Waste to Landfill
- ISCC Accredited
- Circular Economy

---

## 🌐 Platform Architecture

Our ecosystem consists of **5 interconnected applications**:

| App | Purpose | Users |
|-----|---------|-------|
| **Website** | Public-facing company site | General public, potential clients |
| **Customer App** | Client portal for pickups & compliance | Restaurants, factories, food producers |
| **Driver App** | Field collection management | Apex collection drivers |
| **Admin Panel** | Central operations dashboard | Apex management & admin staff |
| **Aggregator Depot** | Processing & quality control | Depot/aggregator operators |

---

## 1. 🌍 Company Website

**URL:** [apexchemicals.co.za](https://apexchemicals.co.za)

### What It Does
The website is the public face of Apex Chem. It introduces the company, explains our services, and provides download links to all our apps.

### Key Sections
- **Hero Banner** — Company tagline and call to action
- **Services Overview** — Four core services:
  1. Vegetable-Origin Waste Oil Collection (UCO, gum oil, winterized oil, acid oils)
  2. Waste Oil Recycling & Processing
  3. Environmental Compliance
  4. Circular Economy
- **Industry Ribbon** — Highlights: Waste-to-Energy, ESG Waste Management, Zero Waste to Landfill, ISCC Accredited, Circular Economy
- **App Download Section** — Cards linking to each app (Customer, Driver, Admin, Aggregator)
- **Footer** — Company contact details and navigation

### Talking Points
> "This is where new clients first discover us. They can learn about our services and immediately access any of our apps from the download section."

---

## 2. 📱 Customer App

**Stack:** React + TypeScript (modern web app)

### What It Does
The Customer App is a self-service portal for our clients — restaurants, food manufacturers, refineries, and any business that generates vegetable-origin waste oils (UCO, gum oil, winterized oil, acid oils). Customers can request pickups, track their collection history, and handle compliance paperwork.

### Key Features

#### Dashboard
- Overview of recent collections
- Quick stats on total oil collected
- Upcoming pickup schedule

#### Request a Pickup
- Select bins registered to their account
- **Manual bin entry** for unregistered bins (serial number, bin type, urgency level)
- Urgency options: Normal, Urgent, Scheduled
- Add notes for the driver

#### My Collections
- Full history of all oil pickups
- Volume collected per visit
- Status tracking (Pending → In Progress → Completed)

#### Certificates
- Access environmental compliance certificates
- Download as PDF

#### SARS Waste Disposal Declaration
- Full compliance form for South African Revenue Service
- Company information (name, registration, VAT, tax reference)
- Waste disposal volumes and values
- Reporting period selection
- Digital declaration and submission

#### ISCC Sustainability Declaration
- International Sustainability & Carbon Certification form
- Certificate details and validity
- Site information with GPS coordinates
  - Feedstock type and volume (UCO, gum oil, winterized oil, acid oil, etc.)
- GHG emission values
- Sustainability compliance checkboxes
- Audit tracking

### Talking Points
> "Customers log in, request a pickup with one tap, and we handle the rest. They also have direct access to SARS and ISCC compliance forms — no more paperwork headaches."

---

## 3. 🚛 Driver App

**Stack:** HTML/CSS/JavaScript (mobile-friendly web app)

### What It Does
The Driver App is the field tool for our collection drivers. They receive job assignments, navigate to client sites, record oil collections, and upload supporting documentation — all from their phone or tablet.

### Key Features

#### Job Dashboard
- List of assigned jobs with status indicators
- Filter by: All, Completed, Pending Verification, Verified
- Each filter shows relevant messaging when empty

#### Job Detail View
- Client name and address
- Bin information (serial number, type, location)
- Map integration for navigation
- Collection form to record volumes

#### Oil Collection Form
- Select bin being collected
- Record volume (litres) and oil type (UCO, gum oil, winterized oil, acid oil)
- Take photos of collection
- **Payment slip upload** — photograph or upload proof of payment
- **Supporting documents upload** — upload any additional documents:
  - Images, PDFs, Word docs, Excel files, text/CSV
  - Drag-and-drop support
  - Non-image files display with document icon and filename
- Submit collection for verification

#### My Jobs / Collection History
- View all past and current jobs
- Dynamic status-based empty states:
  - "All Jobs" → "No jobs assigned yet"
  - "Completed" → "No completed collections yet"
  - "Pending" → "No collections awaiting verification"
  - "Verified" → "No verified collections yet"

#### Bottom Navigation
- Persistent navigation bar visible on both mobile and desktop
- On desktop: centred with max-width for clean appearance
- Tabs: Dashboard, Jobs, Map, Profile

### Talking Points
> "Drivers see exactly where to go, what to collect, and can upload all their documentation on the spot. Management can track every collection in real time."

---

## 4. 🛡️ Admin Panel

**URL:** [apex-admin-panel-pi.vercel.app](https://apex-admin-panel-pi.vercel.app)  
**Stack:** HTML/CSS/JavaScript (dark theme dashboard)

### What It Does
The Admin Panel is the nerve centre of Apex Chem's operations. Management uses it to verify driver/customer registrations, manage bins, track collections, and oversee the entire supply chain.

### Key Features

#### User Verification (Pending Verifications)
- Review new driver and customer registrations
- Approve or reject with one click
- View submitted documents and ID information
- **Verification History** — toggle between Approved and Rejected users
  - Shows name, email, role, and date of decision
  - Combined view across both drivers and customers

#### Bin Management
- Add new bins to the system
- Bin types available:
  - Standard (120L)
  - Large (240L)
  - Industrial (1000L IBC)
  - Drum (210L)
  - Storage Tank
  - Other (manual entry for custom types)
- Assign bins to clients
- Set collection frequency:
  - Daily, Weekly, Twice Weekly, Bi-weekly, Monthly, Quarterly, On-demand
- QR code generation for each bin
- Search and filter bins

#### Collection Management
- **Colour-coded statistics dashboard:**
  - 🟢 Green — Collections Today
  - 🔵 Blue — This Week
  - 🟣 Purple — This Month
  - 🟡 Amber — Pending Verification
- View and verify individual collections
- Approve or flag collections for review

#### Navigation Design
- Colour-coded tab system:
  - 🟡 Amber border — Pending Verifications
  - 🔵 Blue border — Collections
  - 🟣 Purple border — High Aggregators
- Hover effects and active state indicators
- Clean dark theme throughout

### Talking Points
> "From one dashboard, we can see everything — who's registered, what's been collected today, which bins need servicing, and verify every single collection. The colour coding makes it instant to spot what needs attention."

---

## 5. 🏭 Aggregator Depot

**Stack:** HTML/CSS/JavaScript (dark theme web app)

### What It Does
The Aggregator Depot app is for our processing facilities. Once vegetable-origin waste oils are collected by drivers, they arrive at the depot where they're sampled, tested for quality (FFA, moisture, density), stored, and prepared for sale as biodiesel feedstock. This app manages that entire inbound process.

### Key Features

#### Receive Section
- **QR Scanner** — Scan bin QR codes on arrival to log receipt
- **Receive Oil** — Record incoming oil volumes from drivers
- **Sample Collection** — Log quality control samples:
  - Sample size and unit (ml or litres)
  - Type of test: Standard, FFA, Moisture, Density, Full Panel, Custom
  - Sample reference number
  - Notes

#### Test Results
- Record laboratory test results:
  - **FFA %** (Free Fatty Acid)
  - **M&I %** (Moisture & Impurities)
  - **Density** (kg/L)
  - **Temperature** (°C)
- Test reference number for traceability
- Notes field

#### Store Section
- **Store Bins** — Track bin storage locations
- **Purchase Orders** — Create and manage POs:
  - PO number, supplier, volume
  - Price per litre with **automatic total calculation**
  - PO date and notes
- **Invoice Generation** — Generate professional invoices:
  - Auto-populated from PO data
  - Includes test results
  - Company header and details
  - Opens in print-ready format

### Talking Points
> "When oil arrives at the depot, we scan it in, take samples, run quality tests, and the system tracks everything. Purchase orders auto-calculate totals, and we can generate invoices with one click."

---

## 🔄 How It All Connects

```
Customer requests pickup
        ↓
Admin assigns job to driver
        ↓
Driver collects oil & uploads docs
        ↓
Admin verifies collection
        ↓
Oil arrives at Aggregator Depot
        ↓
Depot: Sample → Test → Store → Sell
        ↓
Customer receives certificates & compliance docs
```

### The Full Cycle
1. **Customer** logs in and requests a pickup
2. **Admin** sees the request and assigns it to a driver
3. **Driver** receives the job, navigates to the site, collects the oil, photographs everything, and uploads supporting documents
4. **Admin** reviews and verifies the collection
5. Oil is delivered to the **Aggregator Depot**
6. Depot staff scan the bin in, take samples, and run quality tests (FFA, moisture, density) on each oil type
7. Results are logged, purchase orders are created, and invoices are generated
8. **Customer** can access their collection history, certificates, and submit SARS/ISCC compliance forms

---

## 🔐 Security & Access

| App | Authentication | Access Level |
|-----|---------------|--------------|
| Website | None (public) | Open |
| Customer App | Email + Password | Verified customers only |
| Driver App | Email + Password | Verified drivers only |
| Admin Panel | Email + Password | Admin role required |
| Aggregator | Email + Password | Depot staff only |

All apps use **Supabase** for authentication and data storage with row-level security policies.

---

## 📊 Technology Stack

| Component | Technology |
|-----------|-----------|
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Website | HTML/CSS/JS |
| Customer App | React 18 + TypeScript + Vite |
| Driver App | HTML/CSS/JS |
| Admin Panel | HTML/CSS/JS |
| Aggregator Depot | HTML/CSS/JS |
| Hosting | Vercel (all apps) |
| Source Control | GitHub |

---

## 📞 Contact & Support

**Apex Chem (Pty) Ltd**  
Website: [apexchemicals.co.za](https://apexchemicals.co.za)

---

*This document serves as a presentation guide for demonstrating the Apex Chem digital platform. Each section can be used as a talking point while navigating the live applications.*
