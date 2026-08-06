import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Mail, Lock, Shield, PlusCircle, Loader2,
  Calendar, BookOpen, Hash, CheckCircle2, GraduationCap,
  LayoutDashboard, Pencil, Trash2, Check, X, Power, Layers, ScrollText,
} from 'lucide-react';
import { useCreateUser } from '../hooks/useUsers';
import {
  useCreateAcademicYear,
  useCreateClassRoom,
  useAcademicYears,
  useClassRooms,
  useUpdateClassRoom,
  useDeleteClassRoom,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
} from '../hooks/useClasses';
import { DashboardDirection } from '../components/DashboardDirection';
import { PersonnelList } from '../components/PersonnelList';
import { PeriodsManager } from '../components/PeriodsManager';
import { SubjectsManager } from '../components/SubjectsManager';
import { TeachingManager } from '../components/TeachingManager';
import { AuditLogTable } from '../components/AuditLogTable';
import { Role } from '../types';

/* ─── Sous-composant : onglet actif ──────────────────────────────── */
type Tab =
  | 'dashboard'
  | 'personnel'
  | 'annee'
  | 'classe'
  | 'matieres'
  | 'enseignants'
  | 'audit';

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg[0] : msg;
};

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}> = ({ active, onClick, icon, label, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
      active
        ? `${color} text-white shadow-lg`
        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

/* ─── Page principale ────────────────────────────────────────────── */
export const DirectionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex items-center space-x-6">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Espace Direction</h1>
          <p className="text-slate-500 mt-1">
            Gérez votre personnel, vos années scolaires et vos salles de classe.
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap items-center gap-3">
        <TabButton
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
          icon={<LayoutDashboard className="w-4 h-4" />}
          label="Tableau de bord"
          color="bg-slate-800"
        />
        <TabButton
          active={activeTab === 'personnel'}
          onClick={() => setActiveTab('personnel')}
          icon={<Users className="w-4 h-4" />}
          label="Personnel"
          color="bg-indigo-600"
        />
        <TabButton
          active={activeTab === 'annee'}
          onClick={() => setActiveTab('annee')}
          icon={<Calendar className="w-4 h-4" />}
          label="Année Scolaire"
          color="bg-emerald-600"
        />
        <TabButton
          active={activeTab === 'classe'}
          onClick={() => setActiveTab('classe')}
          icon={<BookOpen className="w-4 h-4" />}
          label="Salle de Classe"
          color="bg-violet-600"
        />
        <TabButton
          active={activeTab === 'matieres'}
          onClick={() => setActiveTab('matieres')}
          icon={<Layers className="w-4 h-4" />}
          label="Matières & Coefficients"
          color="bg-fuchsia-600"
        />
        <TabButton
          active={activeTab === 'audit'}
          onClick={() => setActiveTab('audit')}
          icon={<ScrollText className="w-4 h-4" />}
          label="Journal d'audit"
          color="bg-slate-700"
        />
        <TabButton
          active={activeTab === 'enseignants'}
          onClick={() => setActiveTab('enseignants')}
          icon={<GraduationCap className="w-4 h-4" />}
          label="Enseignants"
          color="bg-sky-600"
        />
      </div>

      {/* Contenu */}
      {activeTab === 'dashboard' && <DashboardDirection />}
      {activeTab === 'personnel' && (
        <div className="space-y-6">
          <PersonnelTab />
          <PersonnelList />
        </div>
      )}
      {activeTab === 'annee' && (
        <div className="space-y-6">
          <AnneeScolaireTab />
          <PeriodsManager />
        </div>
      )}
      {activeTab === 'classe' && <ClasseTab />}
      {activeTab === 'matieres' && <SubjectsManager />}
      {activeTab === 'enseignants' && <TeachingManager />}
      {activeTab === 'audit' && <AuditLogTable />}
    </div>
  );
};

/* ─── Onglet Personnel ───────────────────────────────────────────── */
const PersonnelTab: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.SECRETARY);
  const createUserMutation = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(
      { email, password, roles: [role] },
      {
        onSuccess: () => {
          toast.success(`Compte ${role === Role.SECRETARY ? 'Secrétaire' : 'Comptable'} créé avec succès !`);
          setEmail('');
          setPassword('');
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur lors de la création";
          toast.error(Array.isArray(msg) ? msg[0] : msg);
        },
      }
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
        <PlusCircle className="w-5 h-5 mr-2 text-indigo-500" />
        Ajouter un employé
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
          <div className="relative">
            <Mail className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="employe@ecole.edu"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe *</label>
          <div className="relative">
            <Lock className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="••••••••"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Minimum 6 caractères.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Rôle *</label>
          <div className="relative">
            <Shield className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              required
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value={Role.SECRETARY}>Secrétaire</option>
              <option value={Role.ACCOUNTANT}>Comptable</option>
              <option value={Role.TEACHER}>Enseignant</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={createUserMutation.isPending}
          className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {createUserMutation.isPending
            ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Création en cours...</>
            : 'Créer le compte'}
        </button>
      </form>
    </div>
  );
};

/* ─── Onglet Année Scolaire ──────────────────────────────────────── */
const AnneeScolaireTab: React.FC = () => {
  const [label, setLabel] = useState('');
  const [isActive, setIsActive] = useState(true);
  const createMutation = useCreateAcademicYear();
  const { data: years = [], isLoading } = useAcademicYears();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { label: label.trim(), isActive },
      {
        onSuccess: (data) => {
          toast.success(`Année scolaire "${data.label}" créée !`);
          setLabel('');
          setIsActive(true);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur lors de la création";
          toast.error(Array.isArray(msg) ? msg[0] : msg);
        },
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulaire */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <PlusCircle className="w-5 h-5 mr-2 text-emerald-500" />
          Nouvelle année scolaire
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Libellé * <span className="text-slate-400 font-normal">(ex: 2026-2027)</span>
            </label>
            <div className="relative">
              <Calendar className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                pattern="\d{4}-\d{4}"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                placeholder="2026-2027"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-700">Marquer comme active</p>
              <p className="text-xs text-slate-400 mt-0.5">L'année active est utilisée par défaut dans les inscriptions</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            {createMutation.isPending
              ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Création en cours...</>
              : <><Calendar className="w-4 h-4 mr-2" /> Créer l'année scolaire</>}
          </button>
        </form>
      </div>

      {/* Liste des années existantes */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Années scolaires existantes</h2>
        {isLoading ? (
          <p className="text-sm text-slate-400">Chargement...</p>
        ) : years.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune année scolaire créée.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {years.map((y) => (
              <AnneeRow key={y.id} year={y} />
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-400 mt-5 border-t border-slate-100 pt-4">
          Une seule année peut être active à la fois : en activer une clôture
          automatiquement la précédente. Une année portant des inscriptions ne peut
          plus être supprimée, seulement clôturée.
        </p>
      </div>
    </div>
  );
};

/* ─── Ligne d'une année scolaire (édition en place) ──────────────── */
const AnneeRow: React.FC<{ year: { id: string; label: string; isActive: boolean } }> = ({
  year,
}) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(year.label);
  const updateMutation = useUpdateAcademicYear();
  const deleteMutation = useDeleteAcademicYear();

  const save = () => {
    updateMutation.mutate(
      { id: year.id, label: label.trim() },
      {
        onSuccess: () => {
          toast.success('Année mise à jour.');
          setEditing(false);
        },
        onError: (err) => toast.error(errorMessage(err, 'Erreur lors de la modification')),
      },
    );
  };

  const toggleActive = () => {
    updateMutation.mutate(
      { id: year.id, isActive: !year.isActive },
      {
        onSuccess: () =>
          toast.success(
            year.isActive
              ? `Année ${year.label} clôturée.`
              : `Année ${year.label} activée — la précédente a été clôturée.`,
          ),
        onError: (err) => toast.error(errorMessage(err, 'Erreur lors du changement')),
      },
    );
  };

  const remove = () => {
    if (!window.confirm(`Supprimer l'année scolaire ${year.label} ?`)) return;
    deleteMutation.mutate(year.id, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error(errorMessage(err, 'Suppression impossible')),
    });
  };

  return (
    <li className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
      {editing ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          pattern="\d{4}-\d{4}"
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      ) : (
        <span className="font-mono font-bold text-slate-800 flex-1">{year.label}</span>
      )}

      <div className="flex items-center gap-1.5">
        {!editing && year.isActive && (
          <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full mr-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active</span>
          </span>
        )}

        {editing ? (
          <>
            <button onClick={save} title="Enregistrer"
              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditing(false); setLabel(year.label); }} title="Annuler"
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} title="Renommer"
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={toggleActive} title={year.isActive ? 'Clôturer' : 'Activer'}
              className={`p-1.5 rounded-lg ${
                year.isActive
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
              }`}>
              <Power className="w-4 h-4" />
            </button>
            <button onClick={remove} title="Supprimer"
              className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </li>
  );
};

/* ─── Ligne d'une classe (édition en place) ──────────────────────── */
const ClasseRow: React.FC<{
  classRoom: { id: string; name: string; level: string; tuitionFee: number };
}> = ({ classRoom }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(classRoom.name);
  const [fee, setFee] = useState(String(classRoom.tuitionFee ?? 0));
  const updateMutation = useUpdateClassRoom();
  const deleteMutation = useDeleteClassRoom();

  const save = () => {
    updateMutation.mutate(
      { id: classRoom.id, name: name.trim(), tuitionFee: Number(fee) },
      {
        onSuccess: () => {
          toast.success('Classe mise à jour.');
          setEditing(false);
        },
        onError: (err) => toast.error(errorMessage(err, 'Erreur lors de la modification')),
      },
    );
  };

  const remove = () => {
    if (!window.confirm(`Supprimer la classe ${classRoom.name} ?`)) return;
    deleteMutation.mutate(classRoom.id, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error(errorMessage(err, 'Suppression impossible')),
    });
  };

  return (
    <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
      {editing ? (
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
            placeholder="Nom de la classe"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={1000}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="Frais annuels"
            />
            <button onClick={save} title="Enregistrer"
              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700">
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditing(false); setName(classRoom.name); setFee(String(classRoom.tuitionFee ?? 0)); }}
              title="Annuler"
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Le nouveau tarif ne s'applique qu'aux futures inscriptions.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="font-bold text-slate-800">{classRoom.name}</span>
            <span className="ml-2 text-xs text-slate-500 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              {classRoom.level}
            </span>
            <div
              className={`text-xs font-mono font-bold mt-0.5 ${
                Number(classRoom.tuitionFee) > 0 ? 'text-slate-600' : 'text-amber-600'
              }`}
            >
              {Number(classRoom.tuitionFee) > 0
                ? formatFcfa(Number(classRoom.tuitionFee))
                : 'Tarif non défini'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setEditing(true)} title="Modifier"
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={remove} title="Supprimer"
              className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

/* ─── Onglet Salle de Classe ─────────────────────────────────────── */
const ClasseTab: React.FC = () => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [tuitionFee, setTuitionFee] = useState('');
  const createMutation = useCreateClassRoom();
  const { data: classRooms = [], isLoading } = useClassRooms();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        name: name.trim(),
        level: level.trim(),
        tuitionFee: tuitionFee ? Number(tuitionFee) : 0,
      },
      {
        onSuccess: (data) => {
          toast.success(`Salle "${data.name}" créée !`);
          setName('');
          setLevel('');
          setTuitionFee('');
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur lors de la création";
          toast.error(Array.isArray(msg) ? msg[0] : msg);
        },
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulaire */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <PlusCircle className="w-5 h-5 mr-2 text-violet-500" />
          Nouvelle salle de classe
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nom de la classe * <span className="text-slate-400 font-normal">(ex: CP1, 6ème A)</span>
            </label>
            <div className="relative">
              <GraduationCap className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm"
                placeholder="Ex: CP1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Niveau * <span className="text-slate-400 font-normal">(ex: Primaire, Collège)</span>
            </label>
            <div className="relative">
              <BookOpen className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {/* <input
                type="text"
                required
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm"
                placeholder="Ex: Primaire"
              /> */}
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm"
              >
                <option value="">Sélectionner un niveau</option>
                <option value="COLLEGE">Collège</option>
                <option value="LYCEE">Lycée</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Frais de scolarité annuels (FCFA) *
            </label>
            <div className="relative">
              <Hash className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={0}
                step={1000}
                required
                value={tuitionFee}
                onChange={(e) => setTuitionFee(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm font-mono"
                placeholder="Ex: 150000"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Montant total dû par élève. Il est figé sur chaque dossier au moment de
              l'inscription : une révision ultérieure n'affectera pas les dossiers déjà ouverts.
            </p>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all"
          >
            {createMutation.isPending
              ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Création en cours...</>
              : <><BookOpen className="w-4 h-4 mr-2" /> Créer la salle</>}
          </button>
        </form>
      </div>

      {/* Liste des classes existantes */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Salles de classe existantes</h2>
        {isLoading ? (
          <p className="text-sm text-slate-400">Chargement...</p>
        ) : classRooms.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune salle créée.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {classRooms.map((c) => (
              <ClasseRow key={c.id} classRoom={c} />
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-400 mt-5 border-t border-slate-100 pt-4">
          Une classe portant des inscriptions ne peut plus être supprimée : son nom et
          son tarif restent modifiables.
        </p>
      </div>
    </div>
  );
};
