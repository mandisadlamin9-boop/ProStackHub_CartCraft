import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch, getCurrentUser, logout } from "../lib/api";
import ordersHero from "../assets/3.jpg";

const SECTIONS = [
  { id: "orders", label: "Orders" },
  { id: "account", label: "Account details" },
];

const ORDER_STEPS = ["Placed", "Packed", "Shipped", "Delivered"];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const sectionRefs = useRef({});
  const activeId = location.hash.replace("#", "") || "orders";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    apiFetch("/api/orders")
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      apiFetch("/api/orders")
        .then((data) => setOrders(data.orders))
        .catch(() => {}); // silent - don't disturb UI on a failed poll
    }, 15000); // every 15s

    return () => clearInterval(poll);
  }, []);

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
            navigate(`/dashboard#${entry.target.id}`, { replace: true });
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

  return (
    <div className="dash-page">
      <header className="dash-topbar">
        <div className="dash-topbar-row">
          <div className="dash-wordmark">
            <span className="auth-wordmark-mark">C</span>
            CartCraft
          </div>
          <div className="dash-topbar-actions">
            <span className="dash-user-name">{user?.name}</span>
            <button
              className="admin-logout-btn dash-logout-btn"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="dash-tabnav">
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

      <section className="dash-hero">
        <img src={ordersHero} alt="" className="dash-hero-img" />
        <div className="dash-hero-overlay" />
        <Link to="/" className="dash-back-home">
          ← Back to store
        </Link>
        <div className="dash-hero-content">
          <span className="dash-hero-eyebrow">My account</span>
          <h1>
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p>Everything you've ordered, tracked in one place.</p>
        </div>
        <button
          className="dash-hero-scroll"
          onClick={() =>
            sectionRefs.current.orders?.scrollIntoView({ behavior: "smooth" })
          }
          aria-label="Scroll to orders"
        >
          <span>SCROLL</span>
          <span className="dash-hero-scroll-line" />
        </button>
      </section>

      {/* ===== Orders ===== */}
      <section
        id="orders"
        ref={(el) => (sectionRefs.current.orders = el)}
        className="admin-section dash-section"
      >
        <div className="admin-section-head">
          <span className="admin-eyebrow">My account</span>
          <h1>Orders</h1>
          <p className="admin-sub">
            {orders.length} order{orders.length !== 1 ? "s" : ""} on your
            account.
          </p>
        </div>

        {loading && <p className="admin-status">Loading your orders…</p>}
        {error && <p className="admin-status admin-error">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <p className="admin-status">You haven't placed any orders yet.</p>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="admin-order-list">
            {orders.map((order) => {
              const currentIndex = ORDER_STEPS.indexOf(order.status);

              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <div className="order-card-id">Order #{order.id}</div>
                      <div className="order-card-date">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-ZA",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </div>
                    </div>
                    <div className="order-card-total">
                      <span className="order-card-total-label">Total paid</span>
                      <span className="order-card-total-value">
                        R{Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="order-card-items">
                    {order.items?.map((item) => (
                      <div key={item.product_id} className="order-item-card">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="order-item-card-img"
                        />
                        <div className="order-item-card-info">
                          <div className="order-item-card-name">
                            {item.name}
                          </div>
                          <div className="order-item-card-qty">
                            Qty {item.quantity}
                          </div>
                        </div>
                        <div className="order-item-card-price">
                          R{Number(item.price_at_purchase).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="admin-order-toggle"
                    onClick={() =>
                      setExpandedOrderId(
                        expandedOrderId === order.id ? null : order.id,
                      )
                    }
                  >
                    {expandedOrderId === order.id
                      ? "Hide tracking ▲"
                      : "Track order ▼"}
                  </button>

                  {expandedOrderId === order.id && (
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== Account details ===== */}
      <section
        id="account"
        ref={(el) => (sectionRefs.current.account = el)}
        className="admin-section dash-section"
      >
        <div className="admin-section-head">
          <span className="admin-eyebrow">My account</span>
          <h1>Account details</h1>
          <p className="admin-sub">
            The information on your CartCraft account.
          </p>
        </div>

        <div className="dash-account-card">
          <div className="dash-account-avatar">
            {user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="dash-account-rows">
            <span className="dash-account-tag">Customer account</span>
            <div className="dash-account-row">
              <span className="dash-account-label">Name</span>
              <span className="dash-account-value">{user?.name}</span>
            </div>
            <div className="dash-account-row">
              <span className="dash-account-label">Email</span>
              <span className="dash-account-value">{user?.email}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
