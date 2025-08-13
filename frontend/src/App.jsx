import { Routes, Route, Outlet } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import PedidosPage from "./pages/PedidosPage";
import VectorizacionPage from "./pages/VectorizacionPage";
import ProduccionPage from "./pages/ProduccionPage";
import ProgramasPage from "./pages/ProgramasPage";
import VerificacionPage from "./pages/VerificacionPage";
import WhatsAppBotPage from "./pages/WhatsAppBotPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth.jsx';
import { NotificationProvider } from './contexts/NotificationContext';
import './App.css';
import './config/testConfig.js'; // Importar archivo de prueba

function Layout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="content">
        <Outlet /> {/* Aquí se renderizarán las páginas */}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="vectorizacion" element={<VectorizacionPage />} />
            <Route path="produccion" element={<ProduccionPage />} />
            <Route path="programas" element={<ProgramasPage />} />
            <Route path="verificacion" element={<VerificacionPage />} />
            <Route path="whatsapp-bot" element={<WhatsAppBotPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App;
