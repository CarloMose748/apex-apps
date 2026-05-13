# Apex Admin Panel — User Manual

**Version:** 1.0  
**Last Updated:** May 2026  
**App URL:** [apex-admin-panel-pi.vercel.app](https://apex-admin-panel-pi.vercel.app)

---

## Table of Contents

1. [What is the Admin Panel?](#1-what-is-the-admin-panel)
2. [Getting Started](#2-getting-started)
   - [Logging In](#logging-in)
   - [Navigation Overview](#navigation-overview)
3. [Dashboard](#3-dashboard)
4. [Pending Verifications](#4-pending-verifications)
   - [Approving a Driver](#approving-a-driver)
   - [Approving a Customer](#approving-a-customer)
   - [Approving a Depot Manager](#approving-a-depot-manager)
   - [Rejecting a Registration](#rejecting-a-registration)
   - [Verification History](#verification-history)
5. [Drivers](#5-drivers)
6. [Collections](#6-collections)
7. [Bins Management](#7-bins-management)
   - [Adding a New Bin](#adding-a-new-bin)
   - [QR Codes](#qr-codes)
8. [Smart Bins](#8-smart-bins)
9. [Carbon Credits](#9-carbon-credits)
10. [Aggregator Depot](#10-aggregator-depot)
11. [Depot QR Codes](#11-depot-qr-codes)
12. [Search](#12-search)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. What is the Admin Panel?

The Admin Panel is the central operations dashboard for Apex Chem management and admin staff. From here you can:

- Approve or reject registrations from drivers, customers, and depot managers
- Monitor all waste oil collections across the fleet
- Manage bins assigned to client sites
- View and verify collection records
- Track carbon credits
- Oversee aggregator depot data
- Search for any user across the platform

The panel is a **dark-theme web dashboard** optimised for desktop but accessible on mobile via a scrollable navigation bar.

---

## 2. Getting Started

### Logging In

1. Go to [apex-admin-panel-pi.vercel.app](https://apex-admin-panel-pi.vercel.app)
2. You will be redirected to the login screen
3. Enter your **admin email** and **password**
4. Click **Sign In**

> Only accounts in the `admins` table with `status = active` and the appropriate role can access the Admin Panel.

### Navigation Overview

The navigation bar at the top of the screen contains the following sections:

| Tab | Colour Indicator | Purpose |
|-----|-----------------|---------|
| **Dashboard** | — | Overview of platform activity |
| **Pending Verifications** | 🟡 Amber | New registrations awaiting approval |
| **Drivers** | — | All registered drivers |
| **Smart Bins** | — | IoT/smart bin monitoring |
| **Collections** | 🔵 Blue | Oil collection records |
| **Carbon Credits** | 🟢 Green | Environmental credits ledger |
| **Bins Management** | — | Assign and manage client bins |
| **Aggregator Depot** | 🟣 Purple | Depot intake and storage data |
| **Depot QR Codes** | — | QR code management for depots |

On mobile, the navigation scrolls horizontally.

---

## 3. Dashboard

The dashboard gives you an at-a-glance overview of the entire platform.

### Metrics Shown

- **Pending Verifications** — total count of unprocessed registrations
- **Drivers Pending / Approved / Rejected** — breakdown by status
- **Customers Pending / Approved / Rejected** — breakdown by status
- **Collections Today / This Week / This Month** — volume of collections
- **Pending Collection Verification** — collections submitted by drivers not yet signed off

### App Source Overview

A set of cards shows how many records are live in each part of the platform (driver jobs, customer collections, depot bins, etc.) so you can see exactly where data is coming from.

---

## 4. Pending Verifications

This is the most important section for onboarding new users. All three types of registrations appear here:

### Approving a Driver

1. Click **Pending Verifications** in the navigation (amber tab)
2. Scroll to **Pending Drivers**
3. You will see a table with:
   - Name, email, phone
   - Vehicle type and registration
   - ID document buttons (Front / Back) — click to view the uploaded ID photo
   - Registration date
4. To approve:
   - Click the green **Approve** button
   - A confirmation modal will appear — add optional notes if needed
   - Click **Confirm**
5. The driver can now log into the Driver App

### Approving a Customer

1. Go to **Pending Verifications**
2. Scroll to **Pending Customers**
3. The table shows: name, email, phone, business name, registration date
4. Click **Approve** to activate the customer's portal access
5. Click **View** to see full business details before deciding

### Approving a Depot Manager

1. Go to **Pending Verifications**
2. Scroll to **Pending Depot Managers**
3. The table shows: name, email, registration date
4. Click **Approve** to activate their Aggregator Depot app access

> Until you approve a depot manager, they will see "Your account is pending approval" when they try to log into the Depot app.

### Rejecting a Registration

1. Click the red **Reject** button next to the user
2. The rejection modal will open — you can add a reason in the notes field
3. Click **Confirm**

Rejected users cannot log in. You can review rejected users in the Verification History section.

### Verification History

Below the pending lists you will find a **Verification History** section:

- Click **Approved** to see all approvals with dates and admin who approved
- Click **Rejected** to see all rejections with notes
- This history covers drivers, customers, and depot managers

---

## 5. Drivers

The Drivers section shows all registered drivers and their current status.

- **Filter by status** — Active, Pending, Rejected, Paused
- **View driver details** — click any row to see full profile, vehicle info, and ID documents
- **Pause a driver** — temporarily suspend access without fully rejecting
- **Resume a driver** — reactivate a paused driver

---

## 6. Collections

The Collections section displays all oil collection records submitted by drivers.

### Stats at the Top

| Metric | Timeframe |
|--------|-----------|
| 🟢 Collections Today | Today |
| 🔵 This Week | Last 7 days |
| 🟣 This Month | Current month |
| 🟡 Pending Verification | Awaiting your sign-off |

### Verifying a Collection

When a driver submits a completed collection, it appears here with status *Pending Verification*:

1. Click the collection row to open the full record
2. Review:
   - Volume collected (litres/kg)
   - Oil type
   - Photos uploaded by the driver
   - Payment slip (if applicable)
   - Supporting documents
3. Click **Verify** to approve the collection
4. Click **Flag** to mark it for review or request more info from the driver

Once verified, a certificate is generated for the customer.

---

## 7. Bins Management

### Adding a New Bin

Bins are physical containers placed at client sites for waste oil collection.

1. Click **Bins Management** in the navigation
2. Click **Add New Bin**
3. Fill in:
   - **Customer** — select from the approved customer list
   - **Bin serial number** — unique identifier (e.g. BIN-2026-001)
   - **Bin type** — Standard (120L), Large (240L), Industrial IBC (1000L), Drum (210L), Storage Tank, or Other
   - **Bin size** — auto-fills based on type, or enter custom size
   - **Location notes** — where the bin is placed on the client's premises
   - **Collection frequency** — Daily, Weekly, Twice Weekly, Bi-weekly, Monthly, Quarterly, or On-demand
   - **Special instructions** — any notes for the driver
4. Click **Assign Bin**

The bin is now linked to the customer and will appear in their portal and driver jobs.

### QR Codes

Each bin can have a QR code generated for quick identification in the field:

1. In Bins Management, find the bin you want
2. Click **Generate QR**
3. Click **Download PNG** to save the QR code image
4. Print and attach to the physical bin

Drivers and depot staff can scan this QR code to instantly identify the bin during collections.

---

## 8. Smart Bins

The Smart Bins section is for monitoring IoT-connected bins (if installed). This shows real-time fill levels, sensor data, and alerts for bins that are close to full and require urgent collection.

---

## 9. Carbon Credits

The Carbon Credits Ledger tracks environmental credits earned through verified waste oil collections.

- Each verified collection generates carbon credit entries based on the volume and oil type
- The ledger shows credits earned per customer, per collection period
- Filter by customer email or date range to generate reports
- Carbon credit values are calculated using the GHG emission savings from diverting waste oil to biodiesel feedstock

---

## 10. Aggregator Depot

The Aggregator Depot section shows data flowing in from the Depot Management App — useful for management to see the processing pipeline without logging into the depot app directly.

Tabs inside this section:
- **Bins** — bins currently at the depot
- **Branches** — depot branch locations
- **Events** — intake/receive events (oil arriving at depot)
- **Locations** — storage locations within the depot

Use the filter dropdown to narrow data by depot location or date.

---

## 11. Depot QR Codes

Manage QR codes for aggregator depot companies. Each QR code represents a unique company identifier (e.g. IBC01, IBC02).

- **Generate QR** — create a new QR code for a company
- **Download** — save the QR code image for printing
- These codes are scanned by depot staff when receiving oil from drivers

---

## 12. Search

Use the **Search** section (accessible from the navigation) to find any user across the platform.

**Search filters:**
- **User type** — Driver or Customer
- **Status** — All, Pending, Approved, Rejected, Under Review
- **Query** — name, email, or phone number

Results show a table with full user details and action buttons to approve, reject, view, or manage.

---

## 13. Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot log in | Ensure your account is in the `admins` table with `status = active`. Contact IT |
| No pending users showing | Check the database — registrations should appear automatically within seconds of signup |
| Collections not showing | Drivers must submit the collection from the Driver App for it to appear here |
| Bin not showing in driver app | After adding a bin, allow a few minutes and have the driver refresh their jobs list |
| Verification buttons greyed out | Ensure you are logged in with a full admin account (not a read-only role) |
| QR code not downloading | Try a different browser or disable pop-up blockers |

---

**Support:** info@apexchemicals.co.za | +27 72 898 4328  
**Address:** 1 Lodestar Avenue, AECI Industrial Complex, Umbogintwini, 4126, KwaZulu-Natal
