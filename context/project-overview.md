# PANSOD Store

## Overview

PANSOD Store is a Point-of-Sale (POS) application for an Onigiri shop. It allows staff to take dine-in and takeaway orders, record Grab platform orders, view daily sales, generate detailed daily reports with insights, and manage the menu. All data is stored in the cloud via Cloudflare D1 so multiple devices (iPad, laptop) share the same data.

## Goals

1. Replace paper/locally-scoped POS with a cloud-based system shared across devices
2. Provide real-time sales reporting and daily business insights (top products, peak hours, category breakdown, AOV)
3. Support bilingual operations (English + Thai) for staff and menu display

## Core User Flow

1. Staff opens the app (PIN entry screen)
2. Staff takes customer orders by tapping menu items and adjusting quantities
3. Staff selects Dine In or Take Away, then Cash or QR payment
4. Order is saved to D1 and visible in Daily Sales
5. Staff can also record Grab platform orders with order numbers
6. At any time, staff can view Daily Reports with charts and insights for any date
7. Managers can edit the menu (add/edit/delete/reorder items)

## Features

### Order Taking

- Category-filtered menu grid (Onigiri, Sides, Drinks)
- Cart with +/- quantity controls
- Onigiri promo system (3=฿10 off, 5=฿20, 10=฿50)
- Order type selection (Dine In / Take Away)
- Payment method selection (Cash / QR)
- Order status workflow (Pending -> Preparing -> Completed / Cancelled)
- Edit existing orders (load items back into cart)

### Grab Orders

- Separate order flow for Grab delivery orders
- Order number input field
- Today's recorded grab orders history with delete

### Daily Sales

- View orders filtered by date
- Summary stats (orders count, revenue, items sold)
- Each order shows type, payment method, promo, status, and actions

### Daily Report

- High-level summary cards (total revenue, orders, AOV, items sold, grab orders, grab items, discount, cash/QR split)
- Top selling products ranked by quantity with revenue
- Category breakdown (Onigiri, Drinks, Other) with revenue and percentage
- Sales by hour bar chart
- Daily insights (best seller, peak hour, AOV)
- Grab-specific insights (total grab items, avg onigiri per grab order)

### Menu Management

- Add new items with EN/TH name, price, category
- Edit existing items
- Delete items
- Drag-to-reorder items

## Scope

### In Scope

- POS order taking with Dine In / Take Away and Cash / QR payment
- Grab order recording
- Daily sales view with status management
- Daily report with top products, categories, hourly sales, insights
- Menu CRUD with drag reorder
- EN/TH bilingual support
- Simple PIN authentication
- Cloudflare D1 database for shared multi-device data
- Cloudflare Pages + Workers deployment

### Out of Scope

- Customer management / loyalty programs
- Inventory management
- Employee time tracking
- Receipt printing
- Integration with actual Grab API
- Online ordering website for customers

## Success Criteria

1. Staff can complete a full order flow (select items -> choose order type -> choose payment -> order saved)
2. Orders are immediately visible on the Daily Sales tab
3. Daily Report accurately shows revenue, top products, category breakdown, and hourly sales
4. Menu edits persist across all devices
5. The app is usable in both English and Thai
6. PIN protects unauthorized access
