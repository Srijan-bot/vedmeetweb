# 📜 VedMeet: Project History & Technical Logic Documentation

This document serves as a comprehensive guide to the evolution, architecture, and inner workings of the **VedMeet** platform. It details the project's journey from inception to its current state, tracks major version changes, and explains the core logic behind key functionalities.

---

## 🌟 1. Project Inception: The Vision

**VedMeet** started with a clear mission: **To bridge the gap between traditional Ayurvedic healing and modern digital convenience.**

The goal was to create a "Premium Ayurveda Marketplace" that didn't just sell products but offered a holistic wellness ecosystem.
*   **Initial Concept**: A clean, mobile-first e-commerce site for authentic Ayurvedic medicines.
*   **Key Pillars**: Authentication (Trust), Education (Blogs/Consultations), and Convenience (Doorstep Delivery).
*   **Tech Stack Choice**: React for a dynamic UI, Tailwind CSS for rapid styling, and Supabase for a robust, scalable backend without the overhead of managing servers.

---

## 📅 2. Version History & Changelog

A chronological overview of major milestones and recent updates.

### **Current State (Latest)**
*   **Refinement**: Removed "Book Lab Test" and "Health Plans" services from the homepage to streamline the initial user offering.
*   **Layout Fix**: Adjusted the "Our Services" grid to properly display the remaining items across the full width.
*   **Blog Editor**: Completely revamped the Blog Edit page (`BlogForm.jsx`) with a rich text editor (`react-quill-new`) and a modern, sidebar-layout UI for better writing experience.
*   **Documentation**: Added comprehensive `README.md` and this `VERSION_HISTORY.md`.
*   **Organization**: Consolidated all SQL migration scripts into a dedicated `supabase sql` directory for better project structure.
*   **UI/UX**: Enhanced the "Shop" and "Home" pages with improved mobile responsiveness and layout scaling.

### **Recent Updates**
*   **Inventory & Logistics**:
    *   Implemented robust **Inventory Search** (filtering by SKU, Brand, Batch).
    *   Added **Shipping Calculation** logic to dynamically calculate costs based on weight and box dimensions.
    *   Updated **Invoice Layouts** for better printability (A4 scaling).
*   **Product Expansion**:
    *   Populated database with **Zandu** and other authentic brand products.
    *   Implemented **Brand Filtering** on the Shop page.
*   **AI Integration**:
    *   Enhanced **AI Content Generation** using Google Gemini to automatically create SEO-friendly product descriptions and meta tags.
*   **Bug Fixes**:
    *   Fixed **PDF Upload Crash** in the mobile app view.
    *   Resolved **Import Casing Issues** for cross-platform compatibility.
    *   Fixed **Duplicate Key Errors** in Checkout.

### **Initial Release (v0.1.0)**
*   **Core Setup**: Project scaffolding with Vite, React, and Tailwind.
*   **Authentication**: Basic Login/Signup using Supabase Auth.
*   **Database**: Initial schema design for `products`, `users`, and `orders`.

---

## 🧠 3. Technical Logic & Functionality

This section breaks down how the key components of the website function.

### A. Frontend Architecture (`src/`)
The application is a Single Page Application (SPA) built with **React**.
*   **Routing**: `react-router-dom` manages navigation (e.g., `/shop`, `/cart`, `/checkout`) without page reloads.
*   **Styling**: **Tailwind CSS** provides utility classes for styling, ensuring a consistent design system.
*   **Animations**: **Framer Motion** adds "smoothness" and "delight" with entry animations and hover effects (`Home.jsx`).

### B. Data Management (`src/lib/data.js`)
This module acts as the interface between the frontend and the Supabase backend.
*   **`getProducts()`**:
    *   **Logic**: Queries the `products` table. Supports filtering by `category`, `brand`, and `search` query.
    *   **Optimization**: Uses Supabase's `.select()` with specific fields to minimize data transfer.
*   **`getSiteSettings()`**: Fetches dynamic configuration (hero text, banners) allowing admins to update the site without redeploying code.

### C. State Management (`src/context/`)
We use React Context for global state to avoid "prop drilling."
*   **`CartContext.jsx`**:
    *   **`addToCart(product)`**: Checks if the item exists. If yes, increments quantity; if no, pushes to the `cart` array.
    *   **`removeFromCart(id)`**: Filters the `cart` array to remove the specific item.
    *   **`updateQuantity(id, amount)`**: Adjusts quantity, preventing it from dropping below 1.
    *   **`cartTotal`**: specific useMemo hook or helper function calculates `(price * quantity)` for all items dynamically.
*   **`AuthContext.jsx`**:
    *   Wraps the app to provide the current `user` object.
    *   Listens to Supabase `onAuthStateChange` events to handle session persistence automatically.

### D. Checkout & Order Flow
1.  **Cart Review**: User reviews items in `Cart.jsx`.
2.  **Address**: User selects or adds a delivery address.
3.  **Shipping Calculation** (`src/lib/shippingUtils.js`):
    *   **Logic**: Calculates volumetric weight based on product dimensions.
    *   **Rules**: Checks against zone-based rates (Z1, Z2) defined in the backend.
4.  **Order Placement**:
    *   Creates a record in the `orders` table.
    *   Iterates through cart items to create records in `order_items`.
    *   Triggers database hooks (SQL) to deduct stock from `inventory`.

### E. AI Content Generation (`src/lib/gemini.js`)
*   **Purpose**: To automate the creation of rich product descriptions.
*   **Logic**:
    *   Sends a prompt (Product Name + Short Description) to **Google Gemini API**.
    *   Receives a structured response with "SEO Title", "Meta Description", and "Long Description".
    *   Updates the product record in the database with this generated content.

### F. Database Layer (`supabase sql/`)
*   **Structure**: Relational data model (PostgreSQL).
*   **RLS (Row Level Security)**: Policies ensure users can only see their own data, while Admins have full access.
*   **Triggers**:
    *   `auto_sync_trigger.sql`: Automatically syncs stock levels when an order is placed.
    *   `handle_new_user`: Automatically creates a public `profile` entry when a new user signs up via Auth.

---

## 🛠️ How to Maintain & Extend

*   **Adding a Page**: Create a component in `src/pages/`, add a route in `App.jsx`.
*   **Modifying Database**: Write a new SQL migration script in `supabase sql/` and run it via the Supabase Dashboard.
*   **Updating Styles**: Edit `tailwind.config.js` for theme changes or use utility classes directly in components.

---

*Verified by Antigravity - 2026*
