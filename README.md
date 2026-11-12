# Dayflow — Daily Task Scheduler & Store Support Tracker

A high-performance daily task scheduler designed for retail support, hardware troubleshooting, and store operational workflows. Features authentic 2x2 twill carbon fiber styling, Kawasaki Racing Lime Green accents, role-based access control (RBAC), and offline Excel (`.xlsx`) report exporting.

---

## 🚀 Key Features

- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full control to add, edit, snooze, rollover, delete tasks, and export reports.
  - **Viewer**: Read-only observation mode. Mouse clicks and inspect element / developer shortcuts (F12, Ctrl+Shift+I) are locked; only the **Log Out** button is active.
- **Woven Carbon Fiber Theme**: Authentic 2x2 twill carbon fiber weave canvas with Kawasaki signature Lime Green (`#69BE28`, Code 777 / Code 45) highlights.
- **1-Click Operational Templates**: Quick-entry questionnaires for daily retail and IT incidents:
  - `+ POC (+2h)`: Contacted store point-of-contact with automated 2-hour check-back scheduling.
  - `+ Shipping`: Shipping tickets, store name, tracking number, and item manifest.
  - `+ Phones Up`: Verification of store phone and telecom uptime.
  - `+ ATA Issue`: Analog telephone adapter device outages escalated to team chat.
  - `+ Supplies`: Tracking replacement parts and supplies mailed to stores.
- **Rollover of Incomplete Tasks**: Tasks from earlier days automatically appear in the **Rolled Over / Incomplete** section with a 1-click `→ Today` button.
- **Excel Spreadsheet Export (`.xlsx`)**: Offline workbook generation with configurable date ranges (Today, Yesterday, Last 7 Days, This Month, or All Time) saving directly to the Downloads folder.
- **Dual Views**: Structured **List View** with categorized status sections and visual 24-hour **Timeline View** with non-overlapping multi-column layout.

---

## 🔐 Credentials & RBAC Access

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `PkKhi3571592580` | Full administrative access (create, edit, delete, export, rollover, backup) |
| **Viewer** | `viewer` | `qwerZ@123` | Read-only mode (all clicks & inspect element disabled, only Log Out enabled) |

---

## 🛠️ Tech Stack & Local Execution

- Pure vanilla **HTML5**, **CSS3**, and **JavaScript (ES6+)**.
- Standalone offline **SheetJS** (`vendor/xlsx.full.min.js`) for direct client-side `.xlsx` generation.
- Zero server dependencies — double-click `index.html` to run in any browser.

### Running Unit Tests
```bash
node --test scheduler.test.js
```

---

## 👤 Author
- **Author**: Yasin Adnan
- **GitHub**: [@YasinAdn](https://github.com/YasinAdn)
- **Email**: yaseenadnan2580@gmail.com
