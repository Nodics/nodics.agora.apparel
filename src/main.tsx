import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { StorefrontPage } from './pages/StorefrontPage';
import 'virtual:agora-composition';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <StorefrontPage />
  </StrictMode>,
);
