import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Brand from "./Brand";
import Icon from "./Icon";

const NAV_ITEMS = [
  { to: "/home", label: "Caronas", icon: "route" },
  { to: "/create", label: "Publicar", icon: "plus" },
  { to: "/profile", label: "Perfil", icon: "user" },
];

// Estrutura das telas autenticadas. Em telas largas a navegação fica no topo;
// no celular, a mesma <nav> vira uma barra fixa na base (alcance do polegar).
export default function AppLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const isFirstRender = useRef(true);

  // A cada troca de tela, leva o foco e a rolagem para o conteúdo (leitores de tela e teclado).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/home" className="topbar__brand" aria-label="UniRide, ir para as caronas">
            <Brand />
          </NavLink>
          <nav className="nav" aria-label="Principal">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className="nav__link">
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="conteudo" className="page" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
