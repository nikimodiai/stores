import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './StoreHero.module.css';

export default function StoreHero({ offers = [], products = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  // 1. Prepare slides: up to 5 items, starting with valid active offers, then latest products
  const slides = [];

  // Add offers
  offers.forEach(o => {
    if (slides.length < 5 && o.media_url && o.media_type === 'image') {
      slides.push({
        id: `offer-${o.id}`,
        imageUrl: o.media_url,
        title: o.title,
        description: o.description,
        badge: 'Exclusive Offer',
        type: 'offer',
      });
    }
  });

  // Fill remaining slots with latest products
  products.forEach(p => {
    if (slides.length < 5) {
      // Find a valid image for this product
      const img = p.primary_image_url || (Array.isArray(p.images) && p.images[0]);
      if (img) {
        slides.push({
          id: `product-${p.id}`,
          imageUrl: img,
          title: p.name,
          description: p.price ? `Featured Piece · ₹${Number(p.price).toLocaleString()}` : p.description || 'Featured Collection',
          badge: 'New Arrival',
          type: 'product',
        });
      }
    }
  });

  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Set up auto-play interval of 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(nextSlide, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide, slides.length]);

  // Reset timer on manual navigation
  const handleManualNav = (action) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(nextSlide, 4000);
    }
    if (action === 'next') nextSlide();
    if (action === 'prev') prevSlide();
  };

  const handleDotClick = (index) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(nextSlide, 4000);
    }
    setCurrentIndex(index);
  };

  if (slides.length === 0) return null;

  return (
    <div className={styles.heroContainer} aria-label="Featured promotions">
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.id}
            className={`${styles.slide} ${isActive ? styles.activeSlide : ''}`}
          >
            {/* Blurred fill for the letterbox gaps on the sides */}
            <img
              src={slide.imageUrl}
              alt=""
              className={styles.slideBlur}
              draggable={false}
              aria-hidden="true"
            />

            {/* Main image — contained, whole photo visible */}
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className={styles.slideImg}
              draggable={false}
            />

            {/* Left-side gradient so text reads cleanly */}
            <div className={styles.overlay} />

            {/* Text block on the left */}
            <div className={styles.slideContent}>
              {slide.badge && (
                <span className={styles.badge}>{slide.badge}</span>
              )}
              <h2 className={styles.title}>{slide.title}</h2>
              {slide.description && (
                <p className={styles.description}>{slide.description}</p>
              )}
            </div>
          </div>
        );
      })}

      {/* Manual Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            className={`${styles.navBtn} ${styles.prev}`}
            onClick={() => handleManualNav('prev')}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            className={`${styles.navBtn} ${styles.next}`}
            onClick={() => handleManualNav('next')}
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}

      {/* Navigation Dots */}
      {slides.length > 1 && (
        <div className={styles.dotsContainer}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
              onClick={() => handleDotClick(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
