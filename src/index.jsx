import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import './index.css';
import Storefront from './storefront/Storefront';
import ProductDetail from './storefront/ProductDetail';
import StoreNotFound from './storefront/StoreNotFound';

// Standalone public storefront. Each store is reachable at /store/:storeSlug
// (e.g. /store/swarnix-jewellers). The root path has no store, so it renders
// a neutral not-found rather than a blank page.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* LazyMotion + domAnimation = tree-shaken framer-motion (small bundle).
        MotionConfig reducedMotion="user" makes every animation honour the
        OS "reduce motion" setting automatically. */}
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Routes>
            <Route path="/store/:storeSlug" element={<Storefront />} />
            <Route path="/store/:storeSlug/product/:productId" element={<ProductDetail />} />
            <Route path="/" element={<StoreNotFound />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MotionConfig>
    </LazyMotion>
  </React.StrictMode>
);
