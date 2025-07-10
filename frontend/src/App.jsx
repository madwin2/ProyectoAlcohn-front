import { Routes, Route, Outlet } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import PedidosPage from "./pages/PedidosPage";
import PedidosPrueba from "./pages/PedidosPrueba";
import Sidebar from './components/Sidebar';
import './App.css';
import ProduccionPage from "./pages/ProduccionPage";

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
<<<<<<< HEAD
        <Route path="pedidos-prueba" element={<PedidosPrueba />} />
=======
        <Route path="produccion" element={<ProduccionPage />} />
>>>>>>> e9f92d16cf1e125d8aac0f23e26bfaefa7e05515
      </Route>
    </Routes>
  )
}

export default App;
