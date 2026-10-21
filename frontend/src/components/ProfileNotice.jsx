import { Link } from "react-router-dom";
import Icon from "./Icon";
import { useAuth } from "../hooks/useAuth";

// Aviso discreto para quem ainda não preencheu o perfil: sem nome, a carona aparece como "sem nome".
export default function ProfileNotice() {
  const { user } = useAuth();
  if (!user || user.name) return null;

  return (
    <div className="notice notice--info">
      <Icon name="info" />
      <p>
        Seu perfil está incompleto. Quem vê suas caronas não sabe seu nome. <Link to="/profile">Completar perfil</Link>
      </p>
    </div>
  );
}
