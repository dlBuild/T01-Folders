import { Link } from 'react-router-dom';
import { Logo } from './Navbar';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-cream-soft/70">
      <div className="container-t01 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <Logo size="text-2xl" />
          <p className="text-sm mt-2 max-w-sm">Starting small. Building meaningful solutions for students and young people in India.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="https://en.wikipedia.org/wiki/Pollution" className="hover:text-amber"> Add Yt Link Here-Wiki Polution</Link>
          
          <Link to="/explore" className="hover:text-amber">Explore</Link>
          <Link to="/about" className="hover:text-amber">About</Link>
          <Link to="/register" className="hover:text-amber">Register / Login</Link>
          <Link to="/contact" className="hover:text-amber">Contact</Link>
          <Link to="/terms" className="hover:text-amber">Terms</Link>
          <Link to="/refund-policy" className="hover:text-amber">Refunds</Link>
          <Link to="/privacy" className="hover:text-amber">Privacy</Link>
        </div>
      </div>
      <div className="border-t border-navy-700 py-4 text-center text-xs">© {new Date().getFullYear()} Project T01. All rights reserved.</div>
    </footer>
  );
}
