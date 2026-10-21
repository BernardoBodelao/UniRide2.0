import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Icon from "../components/Icon";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { validateEmail, validateLoginPassword } from "../utils/validation";

export default function Login() {
  usePageTitle("Entrar");
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: sessionLoading } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  if (sessionLoading) return <LoadingSpinner label="Verificando sua sessão..." />;
  if (isAuthenticated) return <Navigate to="/home" replace />;

  const setValue = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const nextErrors = { email: validateEmail(values.email), password: validateLoginPassword(values.password) };
    setErrors(nextErrors);
    const firstInvalid = ["email", "password"].find((name) => nextErrors[name]);
    if (firstInvalid) {
      document.getElementById(`login-${firstInvalid}`)?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate("/home", { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="auth__title">Entrar</h1>
      <p className="auth__subtitle">Use o e-mail e a senha do seu cadastro.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="notice notice--error" role="alert">
            <Icon name="alert" />
            <p>{formError}</p>
          </div>
        )}
        <Field
          id="login-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@universidade.edu.br"
          value={values.email}
          onChange={setValue("email")}
          error={errors.email}
        />
        <Field
          id="login-password"
          label="Senha"
          autoComplete="current-password"
          revealable
          value={values.password}
          onChange={setValue("password")}
          error={errors.password}
        />
        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="auth__switch">
        Ainda não tem conta? <Link to="/register">Criar conta</Link>
      </p>
    </AuthShell>
  );
}
