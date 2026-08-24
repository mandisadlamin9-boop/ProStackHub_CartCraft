# CartCraft — Electronics & Gadgets E-Commerce Storefront

A full-featured e-commerce storefront built for the ProStackHub Fullstack Development Internship (Task 2). CartCraft sells electronics across five categories — Phones, Laptops, Headphones, Smartwatches, and Accessories — with JWT authentication, a persisted cart, Stripe-powered checkout, and a role-based admin panel.

## Tech Stack

**Frontend**

- React (Vite)
- React Router DOM
- Plain CSS
- Deployed on Vercel

**Backend**

- Node.js + Express
- JWT authentication (jsonwebtoken + bcryptjs)
- Stripe Checkout + webhooks
- Deployed on Render

**Database**

- Azure SQL Database
- `mssql` (Tedious driver)

## Features

- **Auth** — Register/login as Customer or Admin, JWT-protected routes, role-based access control enforced server-side
- **Storefront** — Product grid with search and category filtering, product detail pages
- **Cart** — Persisted server-side per user, survives refreshes and device switches
- **Checkout** — Stripe Checkout for multi-item orders. Payment is confirmed exclusively via a cryptographically verified Stripe webhook — never via the client-side redirect. Stock is decremented atomically at the database level to prevent overselling under simultaneous checkouts.
- **Orders** — Customer order history; admin status updates enforced in strict sequence (`Placed → Packed → Shipped → Delivered`), no skipping or reversing
- **Admin panel** — Manage products and stock, update order status, view basic sales overview (total orders, total revenue)
- **Reviews** — 1–5 star ratings and comments, restricted to customers who have actually purchased the product

## Project Structure
