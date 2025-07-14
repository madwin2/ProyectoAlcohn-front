import { Routes, Route, Outlet } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import PedidosPage from "./pages/PedidosPage";
import VectorizacionPage from "./pages/VectorizacionPage";
import ProduccionPage from "./pages/ProduccionPage";
import ProgramasPage from "./pages/ProgramasPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth.jsx';
import './App.css';

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
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App;
