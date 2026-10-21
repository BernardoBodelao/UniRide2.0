import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import Icon from "../components/Icon";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { validateEmail, validateNewPassword } from "../utils/validation";

// Associa a mensagem do servidor ao campo certo, para o erro aparecer junto dele.
function fieldForServerError(error) {
  if (error.status === 409) return "email";
  const message = (error.message || "").toLowerCase();
  if (message.includes("e-mail")) return "email";
  if (message.includes("senha")) return "password";
  return null;
}

export default function Register() {
  usePageTitle("Criar conta");
  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const setValue = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const nextErrors = { email: validateEmail(values.email), password: validateNewPassword(values.password) };
    setErrors(nextErrors);
    const firstInvalid = ["email", "password"].find((name) => nextErrors[name]);
    if (firstInvalid) {
      document.getElementById(`register-${firstInvalid}`)?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    try {
      await register({ email: values.email.trim(), password: values.password });
      toast.success("Conta criada. Agora complete seu perfil.");
      navigate("/profile", { replace: true });
    } catch (err) {
      const field = fieldForServerError(err);
      if (field) {
        setErrors({ [field]: err.message });
        document.getElementById(`register-${field}`)?.focus();
      } else {
        setFormError(err.message);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="auth__title">Criar conta</h1>
      <p className="auth__subtitle">Só e-mail e senha. Nome, curso e telefone ficam para o próximo passo.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="notice notice--error" role="alert">
            <Icon name="alert" />
            <p>{formError}</p>
          </div>
        )}
        <Field
          id="register-email"
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
          id="register-password"
          label="Senha"
          autoComplete="new-password"
          revealable
          hint="Mínimo de 6 caracteres."
          value={values.password}
          onChange={setValue("password")}
          error={errors.password}
        />
        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
          {submitting ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="auth__switch">
        Já tem conta? <Link to="/">Entrar</Link>
      </p>
    </AuthShell>
  );
}
