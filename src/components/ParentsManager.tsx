import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  KeyRound,
  Link2,
  Plus,
  Search,
  Unlink,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  useCreateParent,
  useLinkChild,
  useParents,
  useResetParentPassword,
  useSetParentActive,
  useUnlinkChild,
} from '../hooks/useParents';
import { useStudentSearch } from '../hooks/useStudents';
import { useAuthStore } from '../store/useAuthStore';
import { GENDER_LABELS, Gender, Role, type Parent } from '../types';
import { QueryPanel } from './QueryPanel';

/**
 * Gestion des comptes parents par le secrétariat.
 *
 * Le mot de passe provisoire n'est affiché qu'une fois, au retour du serveur :
 * il n'est stocké nulle part, et aucun écran ne pourra le retrouver ensuite.
 * D'où le bandeau persistant plutôt qu'un toast, qui disparaîtrait avant que
 * la secrétaire ait fini de le recopier.
 */
export const ParentsManager: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const parentsQuery = useParents(search);
  const { data: parents = [], isLoading } = parentsQuery;
  const hasRole = useAuthStore((s) => s.hasRole);
  const isDirector = hasRole(Role.DIRECTOR);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Comptes parents</h2>
          <p className="text-sm text-slate-500">
            Chaque parent suit les enfants qui lui sont rattachés, et eux seuls.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          <span>Nouveau parent</span>
        </button>
      </div>

      {credentials && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-900">
            Identifiants à remettre à la famille
          </p>
          <p className="mt-2 font-mono text-sm text-amber-900">
            {credentials.email}
          </p>
          <p className="font-mono text-lg font-bold text-amber-900">
            {credentials.password}
          </p>
          <p className="mt-2 text-xs text-amber-700">
            Ce mot de passe ne sera plus affiché. Le parent devra le remplacer à
            sa première connexion.
          </p>
          <button
            onClick={() => setCredentials(null)}
            className="mt-3 rounded-lg bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-300"
          >
            J'ai noté
          </button>
        </div>
      )}

      {showForm && (
        <CreateParentForm
          onDone={(email, password) => {
            setCredentials({ email, password });
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un parent (nom, email, téléphone)…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Un échec ne doit pas se lire « aucun compte parent créé ». */}
      {parentsQuery.error ? (
        <QueryPanel
          query={parentsQuery}
          fallback="La liste des comptes parents est momentanément indisponible."
        >
          {null}
        </QueryPanel>
      ) : isLoading ? (
        <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
      ) : parents.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-xl">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            {search
              ? 'Aucun parent ne correspond à cette recherche.'
              : 'Aucun compte parent créé pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {parents.map((parent) => (
            <ParentCard
              key={parent.id}
              parent={parent}
              isDirector={isDirector}
              onPasswordReset={(password) =>
                setCredentials({ email: parent.email, password })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CreateParentForm: React.FC<{
  onDone: (email: string, password: string) => void;
  onCancel: () => void;
}> = ({ onDone, onCancel }) => {
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    // Le sexe n'a pas de valeur par défaut raisonnable : présélectionner
    // « Male » ferait enregistrer des Female par simple inattention.
    gender: '' as Gender | '',
  });
  const createParent = useCreateParent();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createParent.mutate(
      {
        email: form.email.trim(),
        lastName: form.lastName.trim(),
        firstName: form.firstName.trim(),
        gender: form.gender as Gender,
        phone: form.phone.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success('Compte parent créé.');
          onDone(data.parent.email, data.temporaryPassword);
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ?? 'Création impossible.',
          );
        },
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nom *"
          value={form.lastName}
          onChange={(v) => setForm({ ...form, lastName: v })}
          required
        />
        <Field
          label="Prénom *"
          value={form.firstName}
          onChange={(v) => setForm({ ...form, firstName: v })}
          required
        />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Sexe *
          </span>
          <select
            value={form.gender}
            required
            onChange={(e) =>
              setForm({ ...form, gender: e.target.value as Gender })
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Sélectionner…</option>
            <option value={Gender.MALE}>{GENDER_LABELS[Gender.MALE]}</option>
            <option value={Gender.FEMALE}>
              {GENDER_LABELS[Gender.FEMALE]}
            </option>
          </select>
        </label>
        <Field
          label="Adresse email *"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          required
        />
        <Field
          label="Téléphone"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
        />
      </div>

      <p className="text-xs text-slate-500">
        Les enfants se rattachent après la création, depuis la fiche du compte.
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createParent.isPending || !form.gender}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50"
        >
          {createParent.isPending ? 'Création…' : 'Créer le compte'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

const ParentCard: React.FC<{
  parent: Parent;
  isDirector: boolean;
  onPasswordReset: (password: string) => void;
}> = ({ parent, isDirector, onPasswordReset }) => {
  const [showLink, setShowLink] = useState(false);
  const unlinkChild = useUnlinkChild();
  const resetPassword = useResetParentPassword();
  const setActive = useSetParentActive();

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">
            {parent.lastName} {parent.firstName}
            {parent.gender && (
              <span className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                {GENDER_LABELS[parent.gender].toUpperCase()}
              </span>
            )}
            {!parent.isActive && (
              <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                DÉSACTIVÉ
              </span>
            )}
          </p>
          <p className="text-sm text-slate-500">{parent.email}</p>
          {parent.phone && (
            <p className="text-sm text-slate-500">{parent.phone}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowLink((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Rattacher un enfant
          </button>

          {isDirector && (
            <>
              <button
                onClick={() =>
                  resetPassword.mutate(parent.id, {
                    onSuccess: (d) => {
                      toast.success('Mot de passe réinitialisé.');
                      onPasswordReset(d.temporaryPassword);
                    },
                    onError: () => toast.error('Réinitialisation impossible.'),
                  })
                }
                title="Réinitialiser le mot de passe"
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Mot de passe
              </button>
              <button
                onClick={() =>
                  setActive.mutate(
                    { parentId: parent.id, isActive: !parent.isActive },
                    {
                      onSuccess: () =>
                        toast.success(
                          parent.isActive
                            ? 'Compte désactivé.'
                            : 'Compte réactivé.',
                        ),
                      onError: () => toast.error('Opération impossible.'),
                    },
                  )
                }
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                {parent.isActive ? 'Désactiver' : 'Réactiver'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Enfants suivis ({parent.children.length})
        </p>

        {parent.children.length === 0 ? (
          <p className="text-sm italic text-slate-400">
            Aucun enfant rattaché — ce compte ne verra rien.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {parent.children.map((child) => (
              <li
                key={child.studentId}
                className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm"
              >
                <Link2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {child.fullName}
                </span>
                <button
                  onClick={() =>
                    unlinkChild.mutate(
                      { parentId: parent.id, studentId: child.studentId },
                      {
                        onSuccess: () => toast.success('Enfant détaché.'),
                        onError: () => toast.error('Détachement impossible.'),
                      },
                    )
                  }
                  title="Détacher"
                  className="text-slate-400 transition-colors hover:text-red-600"
                >
                  <Unlink className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {showLink && (
          <LinkChildForm
            parentId={parent.id}
            onDone={() => setShowLink(false)}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Rattachement d'un enfant, par recherche nominative.
 *
 * Recherche plutôt que liste déroulante : un établissement compte plusieurs
 * centaines d'élèves, et `useStudentSearch` n'interroge le serveur qu'à partir
 * de deux caractères — inutile de télécharger tout l'effectif pour un clic.
 */
const LinkChildForm: React.FC<{ parentId: string; onDone: () => void }> = ({
  parentId,
  onDone,
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const { data: results = [], isLoading } = useStudentSearch(query);
  const linkChild = useLinkChild();

  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-slate-50 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Élève
          </span>
          {selected ? (
            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm">
              <span className="font-medium text-slate-800">
                {selected.label}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-slate-400 hover:text-red-600"
              >
                changer
              </button>
            </div>
          ) : (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom de l'élève (2 caractères min.)"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          )}
        </label>

        <button
          disabled={!selected || linkChild.isPending}
          onClick={() =>
            selected &&
            linkChild.mutate(
              { parentId, studentId: selected.id },
              {
                onSuccess: () => {
                  toast.success('Enfant rattaché.');
                  onDone();
                },
                onError: (error: any) =>
                  toast.error(
                    error?.response?.data?.message ??
                      'Rattachement impossible.',
                  ),
              },
            )
          }
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Rattacher
        </button>
      </div>

      {/* Résultats de recherche, tant qu'aucun élève n'est retenu */}
      {!selected && query.trim().length >= 2 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
          {isLoading ? (
            <p className="px-3 py-2 text-xs text-slate-500">Recherche…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              Aucun élève trouvé dans cet établissement.
            </p>
          ) : (
            results.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelected({
                    id: s.id,
                    label: `${s.lastName} ${s.firstName}`,
                  });
                  setQuery('');
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
              >
                <span className="font-medium text-slate-800">
                  {s.lastName} {s.firstName}
                </span>
                <span className="ml-2 text-xs text-slate-500">
                  {new Date(s.birthDay).toLocaleDateString('fr-FR')}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}> = ({ label, value, onChange, type = 'text', required }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold text-slate-600">
      {label}
    </span>
    <input
      type={type}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </label>
);
