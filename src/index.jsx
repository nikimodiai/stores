import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Storefront from './storefront/Storefront';
import StoreNotFound from './storefront/StoreNotFound';

// Standalone public storefront. Each store is reachable at /store/:storeSlug
// (e.g. /store/swarnix-jewellers). The root path has no store, so it renders
// a neutral not-found rather than a blank page.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/store/:storeSlug" element={<Storefront />} />
        <Route path="/" element={<StoreNotFound />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
