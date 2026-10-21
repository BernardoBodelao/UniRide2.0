import Brand from "./Brand";

// O "U" da marca ampliado: duas pessoas, dois pontos de partida, um caminho em comum.
function RouteArt() {
  return (
    <svg className="auth__art" viewBox="0 0 280 206" aria-hidden="true" focusable="false">
      <path d="M50 24v76a90 90 0 0 0 180 0V24" fill="none" stroke="#1d4a7a" strokeWidth="10" strokeLinecap="round" />
      <path d="M50 24v76a90 90 0 0 0 180 0V24" fill="none" stroke="#2fd0a0" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 14" />
      <circle cx="50" cy="24" r="16" fill="#2fd0a0" />
      <circle cx="230" cy="24" r="12" fill="#081b33" stroke="#2fd0a0" strokeWidth="6" />
    </svg>
  );
}

// Moldura das telas de entrada: painel da marca (explica o produto) + formulário.
export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <Brand tone="light" />
        <div className="auth__pitch">
          <p className="auth__headline">Divida o caminho até a faculdade.</p>
          <p className="auth__lead">O UniRide reúne quem oferece vagas no carro e quem procura carona para o mesmo trajeto.</p>
          <ol className="steps">
            <li>Publique seu trajeto ou busque por origem e destino.</li>
            <li>Entre em uma carona que ainda tenha vaga.</li>
            <li>Depois de entrar, fale com o motorista pelo WhatsApp.</li>
          </ol>
        </div>
        <RouteArt />
      </aside>
      <main className="auth__main" id="conteudo">
        <div className="auth__card">{children}</div>
      </main>
    </div>
  );
}
