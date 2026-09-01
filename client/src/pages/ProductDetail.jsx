import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch, getCurrentUser } from "../lib/api";
import StoreNav from "../components/StoreNav";
import BackButton from "../components/BackButton";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFormError, setReviewFormError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    apiFetch(`/api/products/${id}`)
      .then((data) => setProduct(data.product))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    loadReviews();

    if (user) {
      apiFetch("/api/cart")
        .then((data) =>
          setCartCount(data.items.reduce((sum, i) => sum + i.quantity, 0)),
        )
        .catch(() => {});
    }
  }, [id]);

  const loadReviews = () => {
    setReviewsLoading(true);
    apiFetch(`/api/reviews/${id}`)
      .then((data) => setReviews(data.reviews))
      .catch((err) => setReviewsError(err.message))
      .finally(() => setReviewsLoading(false));
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      await apiFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      setCartCount((c) => c + 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const openReviewForm = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setReviewRating(0);
    setReviewComment("");
    setReviewFormError(null);
    setReviewSuccess(false);
    setShowReviewForm(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewRating < 1) {
      setReviewFormError("Please select a star rating");
      return;
    }

    setReviewFormError(null);
    setReviewSubmitting(true);

    try {
      const { review } = await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          rating: reviewRating,
          comment: reviewComment || null,
        }),
      });
      // Backend doesn't return reviewer_name on the created row, so
      // patch it in locally for immediate display
      setReviews((prev) => [
        { ...review, reviewer_name: user?.name || "You" },
        ...prev,
      ]);
      setShowReviewForm(false);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 2500);
    } catch (err) {
      setReviewFormError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const renderStars = (value, size = "normal") => (
    <span className={`review-stars review-stars-${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={
            n <= Math.round(value) ? "review-star filled" : "review-star"
          }
        >
          ★
        </span>
      ))}
    </span>
  );

  return (
    <div className="store-page">
      <StoreNav user={user} cartCount={cartCount} alwaysSolid />

      {loading && (
        <p className="store-status" style={{ padding: 60 }}>
          Loading…
        </p>
      )}
      {error && (
        <p className="store-status store-error" style={{ padding: 60 }}>
          {error}
        </p>
      )}

      {!loading && !error && product && (
        <>
          <div className="product-detail-topbar">
            <BackButton
              to={`/shop?category=${encodeURIComponent(product.category)}`}
              label="Back to shop"
            />
          </div>

          <div className="product-detail">
            <div className="product-detail-media">
              <img src={product.image_url} alt={product.name} />
            </div>
            <div className="product-detail-info">
              <Link
                to={`/shop?category=${encodeURIComponent(product.category)}`}
                className="product-detail-cat"
              >
                {product.category}
              </Link>
              <h1>{product.name}</h1>

              {!reviewsLoading && (
                <div className="product-detail-rating">
                  {reviews.length > 0 ? (
                    <>
                      {renderStars(avgRating)}
                      <span className="review-avg-text">
                        {avgRating.toFixed(1)} ({reviews.length})
                      </span>
                    </>
                  ) : (
                    <span className="review-avg-text">No reviews yet</span>
                  )}
                  <button
                    className="review-write-link"
                    onClick={openReviewForm}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Write a review
                  </button>
                </div>
              )}

              <div className="product-detail-price">
                R{Number(product.price).toFixed(2)}
              </div>
              {product.description && (
                <p className="product-detail-desc">{product.description}</p>
              )}
              {product.stock < 10 && (
                <div className="product-detail-lowstock">
                  Only {product.stock} left
                </div>
              )}
              <button
                className={`product-detail-add${added ? " added" : ""}`}
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? (
                  <span className="btn-spinner" />
                ) : added ? (
                  "Added ✓"
                ) : (
                  "Add to cart"
                )}
              </button>
            </div>
          </div>

          {/* ===== Reviews ===== */}
          <section className="review-section">
            <div className="review-section-head">
              <h2>Reviews</h2>
            </div>

            {reviewSuccess && (
              <p className="review-success">Thanks — your review is up.</p>
            )}

            {reviewsLoading && <p className="admin-status">Loading reviews…</p>}
            {reviewsError && (
              <p className="admin-status admin-error">{reviewsError}</p>
            )}

            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <p className="admin-status">
                No reviews yet — be the first to leave one.
              </p>
            )}

            {!reviewsLoading && reviews.length > 0 && (
              <div className="review-list">
                {reviews.map((r) => (
                  <div key={r.id} className="review-card">
                    <div className="review-card-top">
                      {renderStars(r.rating, "small")}
                      <span className="review-card-name">
                        {r.reviewer_name}
                      </span>
                      <span className="review-card-date">
                        {new Date(r.created_at).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="review-card-comment">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {showReviewForm && (
            <div
              className="review-modal-overlay"
              onClick={() => setShowReviewForm(false)}
            >
              <div
                className="review-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="review-modal-head">
                  <h3>Write a review</h3>
                  <button
                    className="review-modal-close"
                    onClick={() => setShowReviewForm(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <div className="review-form-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        className={
                          n <= (hoverRating || reviewRating)
                            ? "review-star-btn filled"
                            : "review-star-btn"
                        }
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(n)}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="review-form-textarea"
                    placeholder="Optional — say a bit about the product"
                    rows="3"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />

                  {reviewFormError && (
                    <p className="review-form-error">{reviewFormError}</p>
                  )}

                  <div className="review-form-actions">
                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="admin-primary-btn"
                      disabled={reviewSubmitting}
                    >
                      {reviewSubmitting ? "Submitting…" : "Submit review"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
