# Apex Aggregator Depot App — User Manual

**Version:** 1.0  
**Last Updated:** May 2026  
**App URL:** [apex-aggregator.vercel.app](https://apex-aggregator.vercel.app)

---

## Table of Contents

1. [What is the Depot App?](#1-what-is-the-depot-app)
2. [Getting Started](#2-getting-started)
   - [Registering as a Depot Manager](#registering-as-a-depot-manager)
   - [Pending Account Approval](#pending-account-approval)
   - [Logging In](#logging-in)
   - [Navigation Overview](#navigation-overview)
3. [Receive](#3-receive)
   - [Scanning a QR Code](#scanning-a-qr-code)
   - [Receiving Oil Manually](#receiving-oil-manually)
4. [Sample Collection](#4-sample-collection)
   - [Logging a Sample](#logging-a-sample)
5. [Test Results](#5-test-results)
   - [Entering Test Results](#entering-test-results)
6. [Store](#6-store)
   - [Storing Received Oil](#storing-received-oil)
   - [Creating a Purchase Order](#creating-a-purchase-order)
7. [History](#7-history)
   - [Sample History](#sample-history)
   - [Test Results History](#test-results-history)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What is the Depot App?

The Apex Aggregator Depot App is used by depot managers and operators to:

- **Receive** waste oil from drivers and suppliers
- **Take samples** and log physical properties of incoming batches
- **Record test results** from laboratory analysis (FFA, moisture, density)
- **Store** oil in classified storage locations
- **Raise purchase orders** for oil purchases from drivers or collectors
- **Generate invoices** for processed batches

The app is designed for use at the aggregator depot facility. A stable internet connection is needed for data to sync in real time.

---

## 2. Getting Started

### Registering as a Depot Manager

1. Go to [apex-aggregator.vercel.app](https://apex-aggregator.vercel.app)
2. Click **Sign Up**
3. Fill in:
   - Full name
   - Email address
   - Password (minimum 8 characters)
4. Click **Create Account**

Your registration will be submitted for **admin approval**. You will see a confirmation message:

> "Registration submitted! Your account is pending approval from an admin."

You **cannot log in** until the admin approves your account.

> **Note:** Do not create multiple accounts if approval takes time. Contact the Apex admin team at info@apexchemicals.co.za to follow up.

### Pending Account Approval

After registering:

1. The Apex admin team will be notified of your application
2. They will review it from the admin panel
3. Once approved, you will be able to log in
4. If rejected, you will see an error message on the login screen explaining the status

### Logging In

1. Go to [apex-aggregator.vercel.app](https://apex-aggregator.vercel.app)
2. Enter your registered email and password
3. Click **Sign In**

If your account is still pending approval you will see:

> "Your account is pending approval. Please wait for admin verification."

Once approved, you will be taken to the main depot dashboard.

### Navigation Overview

The depot app has a bottom navigation bar with the following sections:

| Tab | Purpose |
|-----|---------|
| **Receive** | Log incoming oil from drivers/suppliers |
| **Sample** | Take and log oil samples |
| **Test Results** | Enter lab test results for samples |
| **Store** | Assign oil to storage + create purchase orders |
| **History** | View past samples and test results |

---

## 3. Receive

The Receive section is where you log oil arriving at the depot — whether from a driver collecting from a client site or a direct delivery.

### Scanning a QR Code

Most Apex drivers and collection bins have QR codes. Scanning them automatically fills in the batch information:

1. Go to **Receive**
2. Click **Scan QR Code**
3. Allow camera access when prompted
4. Point the camera at the driver's QR code or bin QR code
5. The system will automatically populate:
   - Company / source name
   - Reference number
   - Estimated volume

Verify the details and confirm receipt.

### Receiving Oil Manually

If no QR code is available:

1. Go to **Receive** → click **Receive Oil**
2. Fill in the form:
   - **Source** — select company name or driver name from the dropdown
   - **Volume (L)** — litres received
   - **Oil type** — Used Cooking Oil (UCO), Waste Engine Oil, Other
   - **Date and time** — auto-filled with current timestamp
   - **Reference number** — invoice or waybill number (optional)
   - **Notes** — any additional observations (colour, smell, contamination)
3. Click **Log Intake**

The intake event is saved and appears in the History section.

---

## 4. Sample Collection

After receiving a batch, you should take a physical sample for quality testing. This section logs the sample details before it goes to the lab.

### Logging a Sample

1. Go to **Sample**
2. Fill in the sample form:

| Field | Description |
|-------|-------------|
| **Sample size** | Amount of sample taken (numeric value) |
| **Unit** | ml (Millilitres) — default; or g (Grams) / kg (Kilograms) |
| **Test type** | Select from: FFA Analysis, Moisture & Impurities, Full Quality Panel, or Other |
| **Reference** | A unique code or number for this sample batch (e.g. SAM-2026-001) |
| **Notes** | Any visual observations or handling instructions for the lab |

3. Click **Log Sample**

The sample is saved and linked to the intake batch. You will see it in **Sample History**.

> **Tip:** Always use a consistent reference numbering system (e.g. SAM-YYYYMM-###) so test results can be matched to samples easily.

---

## 5. Test Results

Once the laboratory completes analysis, enter the results here. These are linked to the corresponding sample reference.

### Entering Test Results

1. Go to **Test Results**
2. Fill in:

| Field | Unit | Description |
|-------|------|-------------|
| **FFA %** | Percentage (%) | Free Fatty Acid content — indicates oil quality |
| **M&I %** | Percentage (%) | Moisture and Impurities content |
| **Density** | kg/L | Oil density at test temperature |
| **Temperature** | °C | Temperature at which density was measured |
| **Test reference** | — | The sample reference number this result belongs to (must match a logged sample) |

3. Click **Save Test Results**

Once saved, the result appears in **Test Results History** and can be retrieved for invoicing, compliance, or reporting.

### Interpreting Results

| Measurement | Acceptable Range (UCO) |
|-------------|----------------------|
| FFA % | Below 5% is ideal; up to 10% is processable |
| M&I % | Below 1% preferred |
| Density | Typically 0.88–0.92 kg/L |

> These are general guidelines. Actual acceptance thresholds depend on your refinery or biodiesel processor's requirements.

---

## 6. Store

### Storing Received Oil

Once oil has been received and sampled, assign it to a storage location within the depot.

1. Go to **Store**
2. Click **Store Bins** or the storage assignment section
3. Select the batch from the list of received intakes
4. Choose a **storage bin or tank** from the available inventory
5. Confirm the volume being stored
6. Click **Store**

The storage record is created and the bin's fill level is updated.

### Creating a Purchase Order

When the depot is purchasing oil from a driver, collector, or supplier:

1. Go to **Store** → **Purchase Orders**
2. Click **New Purchase Order**
3. Fill in:

| Field | Description |
|-------|-------------|
| **PO number** | Auto-generated or enter manually (e.g. PO-2026-042) |
| **Supplier** | Name of the driver, collector, or company |
| **Volume (L)** | Total litres being purchased |
| **Price per litre** | Rate agreed per litre (ZAR) |
| **Total** | Auto-calculated: Volume × Price per litre |
| **Date** | Date of purchase (defaults to today) |

4. Click **Save Purchase Order**
5. Click **Generate Invoice** to create a downloadable invoice document for the supplier

---

## 7. History

### Sample History

View all previously logged samples:

1. Go to **History**
2. Select the **Samples** tab
3. The table shows:
   - Sample date
   - Reference number
   - Test type
   - Sample size and unit
   - Notes
4. Click any row to see the full sample details

### Test Results History

View all lab results that have been entered:

1. Tap the **Test Results** tab inside History
2. The table shows:
   - Result date
   - Test reference (linked to sample)
   - FFA %
   - M&I %
   - Density
   - Temperature
3. Use the date filter to narrow the view by period

---

## 8. Troubleshooting

| Problem | Solution |
|---------|----------|
| Account stuck on "pending approval" | Contact info@apexchemicals.co.za — the admin team may not have seen your registration |
| Cannot log in after approval | Try refreshing the page. Clear browser cache and try again |
| QR scanner not opening | Allow camera permissions in your browser settings |
| QR code not recognised | Try better lighting or manually enter the details using the manual receive form |
| Test result not saving | Check all required fields are filled in. The test reference must match an existing sample |
| Purchase order total not calculating | Ensure both Volume and Price per litre fields have valid numeric values — no letters or special characters |
| History not loading | Check your internet connection. Data requires a live connection to Supabase |
| Wrong unit selected for sample | ml is the default — use the unit dropdown to change to g or kg before saving |

---

**Support:** info@apexchemicals.co.za | +27 72 898 4328  
**Address:** 1 Lodestar Avenue, AECI Industrial Complex, Umbogintwini, 4126, KwaZulu-Natal
