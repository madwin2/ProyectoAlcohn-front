import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Pedidos from './pages/Pedidos';
import './App.css';

function Layout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="content">
        <Outlet /> 
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <div>
            <h1>Bienvenido a Alcohn AI</h1>
            <p>Por favor, selecciona una opción del menú lateral para comenzar.</p>
          </div>
        } />
        <Route path="pedidos" element={<Pedidos />} />
      </Route>
    </Routes>
  );
}

export default App;
