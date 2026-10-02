import { Outlet } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './Layouts.css';

export default function UserLayout() {
  return (
    <div className="user-layout">
      {/* Header */}
      <Header />

      {/* Main Page Content */}
      <main className="user-main">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
