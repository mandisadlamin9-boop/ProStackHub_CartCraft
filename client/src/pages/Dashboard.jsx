import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SECTIONS = [
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionRefs = useRef({});
  const activeId = location.hash.replace("#", "") || "products";

  // Scroll to the section named in the URL on load or hash change
  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (id && sectionRefs.current[id]) {
      sectionRefs.current[id].scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  // Update the URL as the user scrolls, without adding history entries
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

  return (
    <div className="dash-page">
      <nav className="dash-nav">
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

      <section
        id="products"
        ref={(el) => (sectionRefs.current.products = el)}
        className="dash-section"
      >
        <h2>Products</h2>
        {/* product grid goes here */}
      </section>

      <section
        id="orders"
        ref={(el) => (sectionRefs.current.orders = el)}
        className="dash-section"
      >
        <h2>Orders</h2>
        {/* order history goes here */}
      </section>
    </div>
  );
}
