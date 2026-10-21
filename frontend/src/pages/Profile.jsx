import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import Field from "../components/Field";
import Icon from "../components/Icon";
import LoadingSpinner from "../components/LoadingSpinner";
import RideRoute from "../components/RideRoute";
import SeatMeter from "../components/SeatMeter";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { useToast } from "../hooks/useToast";
import { profileService } from "../services/profile";
import { ridesService } from "../services/rides";
import { initialOf, pluralize } from "../utils/format";
import { LIMITS, validateProfile } from "../utils/validation";

const FIELD_ORDER = ["name", "course", "phone"];

export default function Profile() {
  usePageTitle("Meu perfil");
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser, logout } = useAuth();

  // Se o perfil ainda não tem nome, esta é a primeira vez: depois de salvar, segue para as caronas.
  const [isFirstSetup] = useState(() => !user?.name);
  const [values, setValues] = useState({
    name: user?.name || "",
    course: user?.course || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const [myRides, setMyRides] = useState([]);
  const [ridesState, setRidesState] = useState({ loading: true, error: "" });
  const [rideToDelete, setRideToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    profileService
      .rides()
      .then((data) => {
        if (active) {
          setMyRides(data.rides || []);
          setRidesState({ loading: false, error: "" });
        }
      })
      .catch((err) => {
        if (active) setRidesState({ loading: false, error: err.message });
      });
    return () => {
      active = false;
    };
  }, []);

  const setValue = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
    setSaved(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (savingRef.current) return;

    const nextErrors = validateProfile(values);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((name) => nextErrors[name]);
    if (firstInvalid) {
      document.getElementById(`profile-${firstInvalid}`)?.focus();
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setFormError("");
    setSaved(false);
    try {
      const data = await profileService.save({
        name: values.name.trim(),
        course: values.course.trim(),
        phone: values.phone.trim(),
        bio: values.bio.trim(),
      });
      setUser(data.profile);
      if (isFirstSetup) {
        toast.success("Perfil salvo. Já dá para buscar caronas.");
        navigate("/home", { replace: true });
      } else {
        setSaved(true);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!rideToDelete || deleting) return;
    setDeleting(true);
    try {
      await ridesService.remove(rideToDelete.id);
      setMyRides((rides) => rides.filter((ride) => ride.id !== rideToDelete.id));
      toast.success("Carona excluída.");
      setRideToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  let ridesContent;
  if (ridesState.loading) {
    ridesContent = <LoadingSpinner label="Carregando suas caronas..." />;
  } else if (ridesState.error) {
    ridesContent = <EmptyState icon="alert" title="Não foi possível carregar suas caronas" description={ridesState.error} />;
  } else if (myRides.length === 0) {
    ridesContent = (
      <EmptyState title="Você ainda não publicou caronas" description="Quando você publicar uma carona, ela aparece aqui e você pode excluí-la quando quiser.">
        <Link to="/create" className="btn btn--primary">
          Publicar carona
        </Link>
      </EmptyState>
    );
  } else {
    ridesContent = (
      <div className="ride-list">
        {myRides.map((ride) => (
          <article className="ride ride--mine" key={ride.id}>
            <div className="ride__when">
              <time className="ride__time" dateTime={ride.ride_time}>
                {ride.ride_time}
              </time>
              <span className="ride__when-label">saída</span>
            </div>
            <div className="ride__body">
              <RideRoute from={ride.from_loc} to={ride.to_loc} />
              <p className="ride__meta">
                {ride.participant_count === 0
                  ? "Ninguém entrou ainda"
                  : `${ride.participant_count} ${pluralize(ride.participant_count, "pessoa entrou", "pessoas entraram")}`}
              </p>
            </div>
            <div className="ride__aside">
              <SeatMeter total={ride.seats} taken={ride.participant_count} />
              <div className="ride__actions">
                <button type="button" className="btn btn--danger-outline btn--block" onClick={() => setRideToDelete(ride)}>
                  <Icon name="trash" /> Excluir carona
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="profile-head">
        <span className="avatar avatar--lg" aria-hidden="true">
          {initialOf(values.name || user?.name || user?.email)}
        </span>
        <div className="profile-head__text">
          <h1 className="page-head__title">{isFirstSetup ? "Complete seu perfil" : user?.name || "Meu perfil"}</h1>
          <p className="page-head__lead">
            {isFirstSetup
              ? "Falta pouco. Com nome, curso e contato, as outras pessoas sabem com quem estão dividindo a carona."
              : user?.email}
          </p>
        </div>
        <button type="button" className="btn btn--ghost profile-head__logout" onClick={handleLogout}>
          <Icon name="logout" /> Sair da conta
        </button>
      </div>

      <div className="profile">
        <section className="panel" aria-labelledby="personal-title">
          <h2 className="panel__title" id="personal-title">
            Dados pessoais
          </h2>
          <form className="form" onSubmit={handleSave} noValidate>
            {formError && (
              <div className="notice notice--error" role="alert">
                <Icon name="alert" />
                <p>{formError}</p>
              </div>
            )}
            {saved && (
              <div className="notice notice--success" role="status">
                <Icon name="check" />
                <p>Perfil salvo.</p>
              </div>
            )}
            <Field
              id="profile-name"
              label="Nome completo"
              autoComplete="name"
              value={values.name}
              onChange={setValue("name")}
              error={errors.name}
              maxLength={LIMITS.name}
            />
            <Field
              id="profile-course"
              label="Curso ou faculdade"
              placeholder="Ex.: Engenharia de Software"
              value={values.course}
              onChange={setValue("course")}
              error={errors.course}
              maxLength={LIMITS.course}
            />
            <Field
              id="profile-phone"
              label="Telefone ou WhatsApp"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(44) 99999-9999"
              hint="Só aparece para quem entra nas suas caronas."
              value={values.phone}
              onChange={setValue("phone")}
              error={errors.phone}
              maxLength={LIMITS.phone}
            />
            <Field
              id="profile-bio"
              label="Sobre você (opcional)"
              multiline
              rows={3}
              hint={`${values.bio.length} de ${LIMITS.bio} caracteres`}
              value={values.bio}
              onChange={setValue("bio")}
              maxLength={LIMITS.bio}
            />
            <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
          </form>
        </section>

        <section className="panel" aria-labelledby="mine-title">
          <h2 className="panel__title" id="mine-title">
            Minhas caronas
          </h2>
          <p className="panel__lead">As caronas que você publicou como motorista.</p>
          {ridesContent}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(rideToDelete)}
        title="Excluir esta carona?"
        description={
          rideToDelete
            ? `${rideToDelete.from_loc} para ${rideToDelete.to_loc}, saída às ${rideToDelete.ride_time}. ${
                rideToDelete.participant_count > 0
                  ? `${rideToDelete.participant_count} ${pluralize(rideToDelete.participant_count, "pessoa já entrou", "pessoas já entraram")} e perderá a vaga. `
                  : ""
              }Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir carona"
        busyLabel="Excluindo..."
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setRideToDelete(null)}
      />
    </>
  );
}
