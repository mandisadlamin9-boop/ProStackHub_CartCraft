import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, getCurrentUser, logout } from "../lib/api";

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
                <div key={order.id} className="admin-order-card">
                  <div className="admin-order-top">
                    <div>
                      <div className="admin-order-id">Order #{order.id}</div>
                      <div className="admin-order-customer">
                        {order.items?.length || 0} item
                        {order.items?.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="admin-order-meta">
                      <div className="admin-order-total">
                        R{Number(order.total_amount).toFixed(2)}
                      </div>
                      <div className="admin-order-date">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-ZA",
                          { day: "numeric", month: "short", year: "numeric" },
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

                  <button
                    className="admin-order-toggle"
                    onClick={() =>
                      setExpandedOrderId(
                        expandedOrderId === order.id ? null : order.id,
                      )
                    }
                  >
                    {expandedOrderId === order.id
                      ? "Hide items ▲"
                      : `View items (${order.items?.length || 0}) ▼`}
                  </button>

                  {expandedOrderId === order.id && (
                    <div className="admin-order-items">
                      {order.items?.map((item) => (
                        <div
                          key={item.product_id}
                          className="admin-order-item-row"
                        >
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="admin-order-item-img"
                          />
                          <span className="admin-order-item-name">
                            {item.name}
                          </span>
                          <span className="admin-order-item-qty">
                            × {item.quantity}
                          </span>
                          <span className="admin-order-item-price">
                            R{Number(item.price_at_purchase).toFixed(2)}
                          </span>
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
          <div className="dash-account-row">
            <span className="dash-account-label">Name</span>
            <span className="dash-account-value">{user?.name}</span>
          </div>
          <div className="dash-account-row">
            <span className="dash-account-label">Email</span>
            <span className="dash-account-value">{user?.email}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
