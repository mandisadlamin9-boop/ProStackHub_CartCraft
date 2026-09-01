import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CATEGORIES } from "../lib/constants";

export default function StoreNav({
  user,
  cartCount,
  activeCategory,
  onCategoryClick,
  alwaysSolid,
}) {
  const [scrolled, setScrolled] = useState(!!alwaysSolid);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const currentCategory = onCategoryClick
    ? activeCategory
    : new URLSearchParams(location.search).get("category");
  const isShopActive = location.pathname === "/shop" && !currentCategory;

  useEffect(() => {
    if (alwaysSolid) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [alwaysSolid]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <header
      className={`store-nav${scrolled ? " scrolled" : ""}${alwaysSolid ? " static" : ""}`}
    >
      <div className="store-nav-top">
        <Link to="/" className="store-wordmark">
          CartCraft
        </Link>

        <nav className="store-nav-links">
          <Link to="/shop" className={isShopActive ? "active" : ""}>
            Shop
          </Link>
          {CATEGORIES.map((cat) =>
            onCategoryClick ? (
              <button
                key={cat}
                onClick={() => onCategoryClick(cat)}
                className={currentCategory === cat ? "active" : ""}
              >
                {cat}
              </button>
            ) : (
              <Link
                key={cat}
                to={`/shop?category=${encodeURIComponent(cat)}`}
                className={currentCategory === cat ? "active" : ""}
              >
                {cat}
              </Link>
            ),
          )}
        </nav>

        <div className="store-nav-actions">
          <form className="store-nav-search" onSubmit={handleSearchSubmit}>
            {searchOpen && (
              <input
                className="store-nav-search-input"
                type="text"
                placeholder="Search products…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            )}
            <button
              type={searchOpen ? "submit" : "button"}
              className="store-icon-btn"
              aria-label="Search"
              onClick={() => {
                if (!searchOpen) setSearchOpen(true);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
          <Link
            to={
              user
                ? user.role === "admin"
                  ? "/admin"
                  : "/dashboard"
                : "/login"
            }
            className="store-icon-btn"
            aria-label="Account"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </Link>
          <Link to="/cart" className="store-icon-btn" aria-label="Cart">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="store-cart-badge">{cartCount}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
