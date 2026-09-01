import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getCurrentUser } from "../lib/api";
import { CATEGORIES } from "../lib/constants";
import StoreNav from "../components/StoreNav";
import PromoBanner from "../components/PromoBanner";
import heroImg from "../assets/hero-devices.jpg";
import phonesImg from "../assets/promo-phones.jpg";
import laptopImg from "../assets/promo-laptop.jpg";

export default function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const exploreSectionRef = useRef(null);

  useEffect(() => {
    apiFetch("/api/products")
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    if (user) {
      apiFetch("/api/cart")
        .then((data) =>
          setCartCount(data.items.reduce((sum, i) => sum + i.quantity, 0)),
        )
        .catch(() => {});
    }
  }, []);

  const exploreRef = useRef(null);
  const scrollExplore = (dir) => {
    if (exploreRef.current) {
      exploreRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  };

  const exploreCategories = ["Smartwatches", "Accessories", "Headphones"];

  const exploreCards = exploreCategories
    .map((cat) => {
      const match = products.find((p) => p.category === cat);
      return match ? { category: cat, product: match } : null;
    })
    .filter(Boolean);

  const showcaseFor = (cat) => {
    const catProducts = products.filter((p) => p.category === cat).slice(0, 4);
    if (catProducts.length === 0) return null;

    return (
      <section key={cat} className="showcase-section">
        <div className="showcase-head">
          <h2>{cat}</h2>
          <Link
            to={`/shop?category=${encodeURIComponent(cat)}`}
            className="showcase-see-all"
          >
            See all
          </Link>
        </div>
        <div className="showcase-grid">
          {catProducts.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="showcase-card">
              <img src={p.image_url} alt={p.name} />
              <div className="showcase-card-name">{p.name}</div>
              <div className="showcase-card-more">View details →</div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="store-page">
      <StoreNav user={user} cartCount={cartCount} alwaysSolid />

      <section className="store-hero">
        <img src={heroImg} alt="" className="store-hero-img" />
        <div className="store-hero-content">
          <div className="store-hero-text">
            <span className="store-hero-eyebrow">CartCraft</span>
            <h1>Real tech, honestly priced</h1>
            <p>Phones, laptops, audio and accessories. Nothing filtered.</p>
          </div>
          <div className="store-hero-actions">
            <Link to="/shop" className="store-hero-btn-primary">
              Shop now
            </Link>
            <Link to="/shop" className="store-hero-btn-secondary">
              Learn more
            </Link>
          </div>

          {/* ADD THE SCROLL BUTTON HERE — as a third sibling inside store-hero-content */}
          <button
            className="dash-hero-scroll"
            onClick={() =>
              window.scrollBy({ top: window.innerHeight, behavior: "smooth" })
            }
            aria-label="Scroll down"
          >
            <span>SCROLL</span>
            <span className="dash-hero-scroll-line" />
          </button>
        </div>
      </section>

      <PromoBanner
        eyebrow="Phones"
        heading="Every make, one shelf"
        subtext="Compare the latest phones side by side before you commit."
        image={phonesImg}
        ctaLabel="Browse phones"
        ctaTo="/shop?category=Phones"
      />

      {!loading && !error && showcaseFor("Phones")}

      <PromoBanner
        eyebrow="Laptops"
        heading="Power, without the bulk"
        subtext="Thin, fast, and built to actually last a workday."
        image={laptopImg}
        ctaLabel="Browse laptops"
        ctaTo="/shop?category=Laptops"
      />
      {!loading && !error && showcaseFor("Laptops")}

      {!loading && !error && exploreCards.length > 0 && (
        <section className="explore-section" ref={exploreSectionRef}>
          <div className="explore-head">
            <h2>Explore more</h2>
          </div>
          <div className="explore-track">
            {exploreCards.map(({ category, product }) => (
              <Link
                key={category}
                to={`/shop?category=${encodeURIComponent(category)}`}
                className="explore-card"
              >
                <div className="explore-card-media">
                  <img src={product.image_url} alt={category} />
                </div>
                <div className="explore-card-name">{category}</div>
                <div className="explore-card-cta">Explore {category} →</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
