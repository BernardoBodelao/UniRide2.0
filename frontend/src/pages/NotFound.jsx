import { Link } from "react-router-dom";
import Brand from "../components/Brand";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Página não encontrada");
  return (
    <main className="lost" id="conteudo">
      <Brand />
      <h1 className="lost__title">Essa página não existe.</h1>
      <p className="lost__text">O endereço pode ter sido digitado errado ou a página foi removida.</p>
      <Link to="/home" className="btn btn--primary">
        Ir para as caronas
      </Link>
    </main>
  );
}
