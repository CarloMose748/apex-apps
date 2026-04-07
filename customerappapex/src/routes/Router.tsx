import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { AppLayout } from '../components/Layout/AppLayout';

// Pages
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Home } from '../pages/Home';
import { OilCollections } from '../pages/OilCollections';
import { CollectionDetail } from '../pages/CollectionDetail';
import { Reports } from '../pages/Reports';
import { Certificates } from '../pages/Certificates';
import { Requests } from '../pages/Requests';
import { Account } from '../pages/Account';
import { RequestPickup } from '../pages/RequestPickup';
import { SarsForm } from '../pages/SarsForm';
import { IsccForm } from '../pages/IsccForm';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/request-pickup" element={<RequestPickup />} />
                  <Route path="/collections" element={<OilCollections />} />
                  <Route path="/collections/:id" element={<CollectionDetail />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/certificates" element={<Certificates />} />
                  <Route path="/requests" element={<Requests />} />
                  <Route path="/sars-form" element={<SarsForm />} />
                  <Route path="/iscc-form" element={<IsccForm />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}