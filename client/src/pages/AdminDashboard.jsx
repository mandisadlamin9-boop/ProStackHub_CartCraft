import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, getCurrentUser, logout } from "../lib/api";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
];

import { CATEGORIES, CATEGORY_COLORS } from "../lib/constants";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: CATEGORIES[0],
  image_url: "",
  stock: "",
};

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const sectionRefs = useRef({});
  const activeId = location.hash.replace("#", "") || "overview";

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const ORDER_STEPS = ["Placed", "Packed", "Shipped", "Delivered"];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    apiFetch("/api/orders/admin/summary")
      .then((data) => setSummary(data))
      .catch((err) => setSummaryError(err.message))
      .finally(() => setSummaryLoading(false));

    loadProducts();
    loadOrders();
  }, []);

  const loadProducts = () => {
    setProductsLoading(true);
    apiFetch("/api/products")
      .then((data) => setProducts(data.products))
      .catch((err) => setProductsError(err.message))
      .finally(() => setProductsLoading(false));
  };
  const loadOrders = () => {
    setOrdersLoading(true);
    apiFetch("/api/orders/admin/all")
      .then((data) => setOrders(data.orders))
      .catch((err) => setOrdersError(err.message))
      .finally(() => setOrdersLoading(false));
  };

  const advanceOrderStatus = async (order) => {
    const currentIndex = ORDER_STEPS.indexOf(order.status);
    const nextStatus = ORDER_STEPS[currentIndex + 1];
    if (!nextStatus) return;

    setUpdatingOrderId(order.id);
    try {
      const { order: updated } = await apiFetch(
        `/api/orders/${order.id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };
  const archiveOrder = async (order) => {
    try {
      const { order: updated } = await apiFetch(
        `/api/orders/${order.id}/archive`,
        { method: "PUT" },
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)),
      );
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (id && sectionRefs.current[id]) {
      sectionRefs.current[id].scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navigate(`/admin#${entry.target.id}`, { replace: true });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );

    Object.values(sectionRefs.current).forEach(
      (el) => el && observer.observe(el),
    );
    return () => observer.disconnect();
  }, [navigate]);

  const handleNavClick = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const statusCount = (status) =>
    summary?.by_status?.find((s) => s.status === status)?.count ?? 0;

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category,
      image_url: product.image_url || "",
      stock: product.stock,
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      if (editingId) {
        const { product } = await apiFetch(`/api/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? product : p)),
        );
      } else {
        const { product } = await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setProducts((prev) => [product, ...prev]);
      }
      closeForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product? This can't be undone.")) return;

    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };
  const categoryBreakdown = CATEGORIES.map((cat) => ({
    category: cat,
    count: products.filter((p) => p.category === cat).length,
  })).filter((c) => c.count > 0);

  const maxCategoryCount = Math.max(
    1,
    ...categoryBreakdown.map((c) => c.count),
  );

  const totalStatusCount = ["Placed", "Packed", "Shipped", "Delivered"].reduce(
    (sum, s) => sum + statusCount(s),
    0,
  );

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-row">
          <div className="admin-wordmark">
            <span className="auth-wordmark-mark">C</span>
            CartCraft
            <span className="admin-role-tag">Admin</span>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-user-name">{user?.name || "Admin"}</span>
            <button className="admin-logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
        <nav className="admin-tabnav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={activeId === s.id ? "active" : ""}
              onClick={() => handleNavClick(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ===== Overview ===== */}
      <section
        id="overview"
        ref={(el) => (sectionRefs.current.overview = el)}
        className="admin-section"
      >
        <div className="admin-section-head">
          <span className="admin-eyebrow">Store performance</span>
          <h1>Overview</h1>
          <p className="admin-sub">
            A snapshot of sales performance across the store.
          </p>
        </div>

        {summaryLoading && <p className="admin-status">Loading summary…</p>}
        {summaryError && (
          <p className="admin-status admin-error">{summaryError}</p>
        )}

        {summary && (
          <>
            <div className="admin-stat-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-label">Total orders</div>
                <div className="admin-stat-value">{summary.total_orders}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Total revenue</div>
                <div className="admin-stat-value">
                  R{Number(summary.total_revenue).toFixed(2)}
                </div>
              </div>
            </div>

            <h2 className="admin-subheading">Fulfillment queue</h2>
            <div className="admin-status-grid">
              {["Placed", "Packed", "Shipped", "Delivered"].map((status) => (
                <div key={status} className="admin-status-card">
                  <div className="admin-status-count">
                    {statusCount(status)}
                  </div>
                  <div className="admin-status-label">{status}</div>
                </div>
              ))}
            </div>
            <div className="admin-charts-row">
              <div className="admin-chart-card">
                <h2 className="admin-subheading">Order status split</h2>
                <div className="admin-bar-chart">
                  {["Placed", "Packed", "Shipped", "Delivered"].map(
                    (status) => {
                      const count = statusCount(status);
                      const pct =
                        totalStatusCount > 0
                          ? Math.round((count / totalStatusCount) * 100)
                          : 0;
                      return (
                        <div key={status} className="admin-bar-row">
                          <span className="admin-bar-label">{status}</span>
                          <div className="admin-bar-track">
                            <div
                              className="admin-bar-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="admin-bar-value">{count}</span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="admin-chart-card">
                <h2 className="admin-subheading">Inventory by category</h2>
                <div className="admin-bar-chart">
                  {categoryBreakdown.map(({ category, count }) => (
                    <div key={category} className="admin-bar-row">
                      <span className="admin-bar-label">{category}</span>
                      <div className="admin-bar-track">
                        <div
                          className="admin-bar-fill"
                          style={{
                            width: `${(count / maxCategoryCount) * 100}%`,
                            background: CATEGORY_COLORS[category],
                          }}
                        />
                      </div>
                      <span className="admin-bar-value">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ===== Products ===== */}
      <section
        id="products"
        ref={(el) => (sectionRefs.current.products = el)}
        className="admin-section"
      >
        <div className="admin-section-head admin-section-head-row">
          <div>
            <span className="admin-eyebrow">Catalog</span>
            <h1>Products</h1>
            <p className="admin-sub">
              {products.length} product{products.length !== 1 ? "s" : ""} live
              in the store.
            </p>
          </div>
          <button className="admin-primary-btn" onClick={openAddForm}>
            + Add product
          </button>
        </div>

        {showForm && (
          <form className="admin-inline-form" onSubmit={handleFormSubmit}>
            <h3>{editingId ? "Edit product" : "New product"}</h3>

            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-field">
                <label htmlFor="price">Price (R)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="stock">Stock</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="admin-form-field admin-form-field-wide">
                <label htmlFor="image_url">Image URL</label>
                <input
                  id="image_url"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-form-field admin-form-field-wide">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="2"
                  value={form.description}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            {formError && <p className="admin-error">{formError}</p>}

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-primary-btn"
                disabled={submitting}
              >
                {submitting
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Add product"}
              </button>
            </div>
          </form>
        )}

        {productsLoading && <p className="admin-status">Loading products…</p>}
        {productsError && (
          <p className="admin-status admin-error">{productsError}</p>
        )}

        {!productsLoading && !productsError && (
          <div className="admin-shelf">
            {products.map((p) => (
              <div
                key={p.id}
                className="admin-shelf-row"
                style={{
                  "--cat-color": CATEGORY_COLORS[p.category] || "#6b6b76",
                }}
              >
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="admin-shelf-img"
                />

                <div className="admin-shelf-info">
                  <div className="admin-shelf-top">
                    <span className="admin-shelf-category">{p.category}</span>
                    {p.stock < 10 && (
                      <span className="admin-shelf-lowstock">Low stock</span>
                    )}
                  </div>
                  <div className="admin-shelf-name">{p.name}</div>
                  {p.description && (
                    <div className="admin-shelf-desc">{p.description}</div>
                  )}
                </div>

                <div className="admin-shelf-meta">
                  <div className="admin-shelf-price">
                    R{Number(p.price).toFixed(2)}
                  </div>
                  <div className="admin-shelf-stock">{p.stock} in stock</div>
                </div>

                <div className="admin-shelf-actions">
                  <button
                    className="admin-icon-btn"
                    onClick={() => openEditForm(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="admin-icon-btn admin-icon-btn-danger"
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Orders ===== */}
      <section
        id="orders"
        ref={(el) => (sectionRefs.current.orders = el)}
        className="admin-section"
      >
        <div className="admin-section-head">
          <span className="admin-eyebrow">Fulfillment</span>
          <h1>Orders</h1>
          <p className="admin-sub">
            {orders.length} order{orders.length !== 1 ? "s" : ""} placed across
            the store.
          </p>
        </div>

        {ordersLoading && <p className="admin-status">Loading orders…</p>}
        {ordersError && (
          <p className="admin-status admin-error">{ordersError}</p>
        )}

        {!ordersLoading && !ordersError && orders.length === 0 && (
          <p className="admin-status">No orders yet.</p>
        )}

        {!ordersLoading &&
          !ordersError &&
          orders.length > 0 &&
          (() => {
            const visibleOrders = showArchived
              ? orders
              : orders.filter((o) => !o.archived);
            const archivedCount = orders.filter((o) => o.archived).length;

            return (
              <>
                <button
                  className="admin-archive-toggle"
                  onClick={() => setShowArchived((v) => !v)}
                >
                  {showArchived
                    ? "Hide archived"
                    : `Show archived (${archivedCount})`}
                </button>

                <div className="admin-order-list">
                  {visibleOrders.map((order) => {
                    const currentIndex = ORDER_STEPS.indexOf(order.status);
                    const nextStatus = ORDER_STEPS[currentIndex + 1];
                    const isUpdating = updatingOrderId === order.id;

                    return (
                      <div key={order.id} className="admin-order-card">
                        <div className="admin-order-top">
                          <div>
                            <div className="admin-order-id">
                              Order #{order.id}
                            </div>
                            <div className="admin-order-customer">
                              {order.customer_name} · {order.email}
                            </div>
                          </div>
                          <div className="admin-order-meta">
                            <div className="admin-order-total">
                              R{Number(order.total_amount).toFixed(2)}
                            </div>
                            <div className="admin-order-date">
                              {new Date(order.created_at).toLocaleDateString(
                                "en-ZA",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="admin-order-tracker">
                          {ORDER_STEPS.map((step, i) => (
                            <div key={step} className="admin-tracker-step">
                              <div
                                className={
                                  "admin-tracker-dot" +
                                  (i <= currentIndex ? " done" : "")
                                }
                              />
                              <span
                                className={
                                  "admin-tracker-label" +
                                  (i <= currentIndex ? " done" : "")
                                }
                              >
                                {step}
                              </span>
                              {i < ORDER_STEPS.length - 1 && (
                                <div
                                  className={
                                    "admin-tracker-line" +
                                    (i < currentIndex ? " done" : "")
                                  }
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="admin-order-actions">
                          {nextStatus ? (
                            <button
                              className="admin-primary-btn"
                              disabled={isUpdating}
                              onClick={() => advanceOrderStatus(order)}
                            >
                              {isUpdating
                                ? "Updating…"
                                : `Mark as ${nextStatus}`}
                            </button>
                          ) : order.archived ? (
                            <span className="admin-order-complete">
                              Archived
                            </span>
                          ) : (
                            <>
                              <span className="admin-order-complete">
                                ✓ Fulfilled
                              </span>
                              <button
                                className="admin-secondary-btn"
                                onClick={() => archiveOrder(order)}
                              >
                                Archive
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
      </section>
    </div>
  );
}
