import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function PromoBanner({
  eyebrow,
  heading,
  subtext,
  image,
  ctaLabel,
  ctaTo,
}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.35 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className={`promo-banner${inView ? " in-view" : ""}`}>
      <img src={image} alt="" />
      <div className="promo-banner-content">
        {eyebrow && <span className="promo-banner-eyebrow">{eyebrow}</span>}
        <h2>{heading}</h2>
        {subtext && <p>{subtext}</p>}
        <div className="promo-banner-actions">
          <Link to={ctaTo} className="promo-banner-btn">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
