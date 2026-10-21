import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Field from "../components/Field";
import Icon from "../components/Icon";
import ProfileNotice from "../components/ProfileNotice";
import RideRoute from "../components/RideRoute";
import SeatMeter from "../components/SeatMeter";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { ridesService } from "../services/rides";
import { LIMITS, validateRide } from "../utils/validation";

const FIELD_ORDER = ["from", "to", "time", "seats"];
const FIELD_IDS = { from: "ride-from", to: "ride-to", time: "ride-time", seats: "ride-seats" };

export default function CreateRide() {
  usePageTitle("Publicar carona");
  const navigate = useNavigate();
  const toast = useToast();
  const [values, setValues] = useState({ from: "", to: "", time: "", seats: "2" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  };

  const changeSeats = (delta) => {
    const current = Number(values.seats) || 0;
    const next = Math.min(LIMITS.seatsMax, Math.max(LIMITS.seatsMin, current + delta));
    setValue("seats", String(next));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const nextErrors = validateRide(values);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((name) => nextErrors[name]);
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    try {
      await ridesService.create({
        from: values.from.trim(),
        to: values.to.trim(),
        time: values.time,
        seats: Number(values.seats),
      });
      toast.success("Carona publicada.");
      navigate("/home");
    } catch (err) {
      // Os dados digitados continuam no formulário para a pessoa corrigir e reenviar.
      setFormError(err.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const previewSeats = Math.min(LIMITS.seatsMax, Math.max(LIMITS.seatsMin, Number(values.seats) || LIMITS.seatsMin));

  return (
    <>
      <div className="page-head">
        <h1 className="page-head__title">Publicar carona</h1>
        <p className="page-head__lead">Informe o trajeto, o horário de saída e quantas vagas você tem. Todos os campos são obrigatórios.</p>
      </div>

      <ProfileNotice />

      <div className="create">
        <form className="form form--panel" onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="notice notice--error" role="alert">
              <Icon name="alert" />
              <p>{formError}</p>
            </div>
          )}

          <fieldset className="group">
            <legend className="group__title">Trajeto</legend>
            <Field
              id={FIELD_IDS.from}
              label="Origem"
              marker="origin"
              placeholder="Ex.: Campus Sede"
              value={values.from}
              onChange={(event) => setValue("from", event.target.value)}
              error={errors.from}
              maxLength={LIMITS.place}
              autoComplete="off"
            />
            <Field
              id={FIELD_IDS.to}
              label="Destino"
              marker="destination"
              placeholder="Ex.: Terminal Urbano"
              value={values.to}
              onChange={(event) => setValue("to", event.target.value)}
              error={errors.to}
              maxLength={LIMITS.place}
              autoComplete="off"
            />
          </fieldset>

          <fieldset className="group">
            <legend className="group__title">Saída e vagas</legend>
            <div className="form__row">
              <Field
                id={FIELD_IDS.time}
                label="Horário de saída"
                type="time"
                value={values.time}
                onChange={(event) => setValue("time", event.target.value)}
                error={errors.time}
              />
              <div className={`field ${errors.seats ? "field--invalid" : ""}`.trim()}>
                <label className="field__label" htmlFor={FIELD_IDS.seats}>
                  Vagas no carro
                </label>
                <div className="stepper">
                  <button type="button" className="stepper__button" onClick={() => changeSeats(-1)} disabled={Number(values.seats) <= LIMITS.seatsMin} aria-label="Diminuir vagas">
                    <Icon name="minus" />
                  </button>
                  <input
                    id={FIELD_IDS.seats}
                    className="stepper__input"
                    type="number"
                    inputMode="numeric"
                    min={LIMITS.seatsMin}
                    max={LIMITS.seatsMax}
                    value={values.seats}
                    onChange={(event) => setValue("seats", event.target.value)}
                    aria-invalid={errors.seats ? "true" : undefined}
                    aria-describedby="ride-seats-hint"
                  />
                  <button type="button" className="stepper__button" onClick={() => changeSeats(1)} disabled={Number(values.seats) >= LIMITS.seatsMax} aria-label="Aumentar vagas">
                    <Icon name="plus" />
                  </button>
                </div>
                <p className="field__hint" id="ride-seats-hint">
                  De {LIMITS.seatsMin} a {LIMITS.seatsMax} vagas, sem contar você.
                </p>
                {errors.seats && (
                  <p className="field__error">
                    <Icon name="alert" size={16} />
                    <span>{errors.seats}</span>
                  </p>
                )}
              </div>
            </div>
            <p className="form__note">
              <Icon name="info" size={16} />
              <span>A carona não tem data. Ela continua na lista até as vagas acabarem ou até você excluí-la pelo seu perfil.</span>
            </p>
          </fieldset>

          <div className="form__actions">
            <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
              {submitting ? "Publicando..." : "Publicar carona"}
            </button>
            <Link to="/home" className="btn btn--secondary btn--lg">
              Cancelar
            </Link>
          </div>
        </form>

        <aside className="preview" aria-hidden="true">
          <p className="preview__label">Assim sua carona aparece na lista</p>
          <div className="ride ride--preview">
            <div className="ride__when">
              <span className={`ride__time ${values.time ? "" : "ride__time--empty"}`.trim()}>{values.time || "hh:mm"}</span>
              <span className="ride__when-label">saída</span>
            </div>
            <div className="ride__body">
              <RideRoute from={values.from.trim()} to={values.to.trim()} emptyFrom="Sua origem" emptyTo="Seu destino" />
            </div>
            <div className="ride__aside">
              <SeatMeter total={previewSeats} taken={0} />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
