import { Routes, Route, Outlet } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import PedidosPage from "./pages/PedidosPage";
import ProduccionPage from "./pages/ProduccionPage";
import Sidebar from './components/Sidebar';
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
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="pedidos" element={<PedidosPage />} />
        <Route path="produccion" element={<ProduccionPage />} />
      </Route>
    </Routes>
  )
}

export default App;
