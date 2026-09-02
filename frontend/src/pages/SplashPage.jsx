import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpeg';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation'


export default function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <Navigation isLoggedIn={false}/>

      <main className="splash-desktop-container">
        <section className="splash-hero-left">
          <h2>Welcome to TipTap</h2>
          <p className="tagline">Every click tells a story</p>
          <div>
            <p>
                TipTap is a dedicated sanctuary for birdwatchers, wildlife photographers, and avian enthusiasts. Share your high-res bird sightings, connect with fellow birders locally and globally, identify species through community comments, and document every feather in flight.
            </p>
          </div>
          <div className="splash-actions-desktop">
            <button className="wireframe-btn" onClick={() => navigate('/signup')}>Create Account</button>
            <button 
              className="wireframe-btn" 
              style={{ backgroundColor: 'var(--tags-color)', color: 'var(--text-main)' }} 
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </section>

        <section className="splash-hero-right">
          <div className="splash-placeholder-graphic">
            <img src={logoImg} alt="TipTap Logo" className="nav-logo-image" style={{ height: '420px', width: 'auto' }}/>
          </div>
        </section>
      </main>
      <Footer isLoggedIn={false}/>
    </div>
  );
}