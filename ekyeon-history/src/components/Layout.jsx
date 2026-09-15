import Nav from './Nav';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="shell">
      <a className="skip" href="#main">본문으로 건너뛰기</a>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
