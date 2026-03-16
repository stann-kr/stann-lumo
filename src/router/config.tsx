import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';

const HomePage = lazy(() => import('../pages/home/page'));
const AboutPage = lazy(() => import('../pages/about/page'));
const MusicPage = lazy(() => import('../pages/music/page'));
const EventsPage = lazy(() => import('../pages/events/page'));
const ContactPage = lazy(() => import('../pages/contact/page'));
const LinkPage = lazy(() => import('../pages/link/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Admin pages
const AdminLoginPage = lazy(() => import('../pages/admin/login/page'));
const AdminHomePage = lazy(() => import('../pages/admin/home/page'));
const AdminAboutPage = lazy(() => import('../pages/admin/about/page'));
const AdminMusicPage = lazy(() => import('../pages/admin/music/page'));
const AdminEventsPage = lazy(() => import('../pages/admin/events/page'));
const AdminContactPage = lazy(() => import('../pages/admin/contact/page'));
const AdminLinkPage = lazy(() => import('../pages/admin/link/page'));
const AdminThemePage = lazy(() => import('../pages/admin/theme/page'));

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/admin" replace />;
};

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/music',
    element: <MusicPage />,
  },
  {
    path: '/events',
    element: <EventsPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    path: '/link',
    element: <LinkPage />,
  },
  {
    path: '/admin',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin/home',
    element: <ProtectedRoute><AdminHomePage /></ProtectedRoute>,
  },
  {
    path: '/admin/about',
    element: <ProtectedRoute><AdminAboutPage /></ProtectedRoute>,
  },
  {
    path: '/admin/music',
    element: <ProtectedRoute><AdminMusicPage /></ProtectedRoute>,
  },
  {
    path: '/admin/events',
    element: <ProtectedRoute><AdminEventsPage /></ProtectedRoute>,
  },
  {
    path: '/admin/contact',
    element: <ProtectedRoute><AdminContactPage /></ProtectedRoute>,
  },
  {
    path: '/admin/link',
    element: <ProtectedRoute><AdminLinkPage /></ProtectedRoute>,
  },
  {
    path: '/admin/theme',
    element: <ProtectedRoute><AdminThemePage /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
