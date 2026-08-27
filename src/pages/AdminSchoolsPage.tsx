import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Plus, Building2, Edit2, Trash2, Phone, MapPin, X, Check, UserPlus, Users } from 'lucide-react';
import { useCreateSchool, useDeleteSchool, useSchools, useUpdateSchool } from '../hooks/useSchools';
import { useAdminCreateUser } from '../hooks/useUsers';
import { SchoolStaffPanel } from '../components/SchoolStaffPanel';
import { Role, type School } from '../types';
import { QueryPanel } from '../components/QueryPanel';
import { PERIOD_SYSTEM_LABELS, PeriodSystem } from '../types';

export const AdminSchoolsPage: React.FC = () => {
  const schoolsQuery = useSchools();
  const { data: schools = [], isLoading } = schoolsQuery;
  const createSchoolMutation = useCreateSchool();
  const updateSchoolMutation = useUpdateSchool();
  const deleteSchoolMutation = useDeleteSchool();
  const createUserMutation = useAdminCreateUser();

  // Modals & Form States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedSchoolForUser, setSelectedSchoolForUser] = useState<School | null>(null);
  const [staffSchool, setStaffSchool] = useState<School | null>(null);

  // Form Fields — école
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [periodSystem, setPeriodSystem] = useState<PeriodSystem>(
    PeriodSystem.TRIMESTER,
  );
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Form Fields — utilisateur
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<Role>(Role.DIRECTOR);

  const resetForm = () => {
    setName('');
    setSlug('');
    setAddress('');
    setPhone('');
    setEditingSchool(null);
  };

  const resetUserForm = () => {
    setUserEmail('');
    setUserPassword('');
    setUserRole(Role.DIRECTOR);
    setSelectedSchoolForUser(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setName(school.name);
    setSlug(school.slug);
    setPeriodSystem(school.periodSystem ?? PeriodSystem.TRIMESTER);
    setAddress(school.address || '');
    setPhone(school.phone || '');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSchoolMutation.mutate(
      { name, slug: slug.toUpperCase(), address, phone, periodSystem },
      {
        onSuccess: (data) => {
          toast.success(`Établissement "${data.name}" (${data.slug}) créé avec succès !`);
          setIsCreateModalOpen(false);
          resetForm();
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la création');
        },
      },
    );
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;

    updateSchoolMutation.mutate(
      {
        id: editingSchool.id,
        data: { name, slug: slug.toUpperCase(), address, phone, periodSystem },
      },
      {
        onSuccess: (data) => {
          toast.success(`Établissement "${data.name}" mis à jour avec succès !`);
          setEditingSchool(null);
          resetForm();
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la modification');
        },
      },
    );
  };

  const handleDelete = (school: School) => {
    if (
      window.confirm(
        `Êtes-vous absolument sûr de vouloir supprimer l'établissement "${school.name}" (${school.slug}) ?\nCette action est irréversible.`,
      )
    ) {
      deleteSchoolMutation.mutate(school.id, {
        onSuccess: () => {
          toast.success(`Établissement "${school.name}" supprimé.`);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          toast.error(msg || 'Erreur lors de la suppression');
        },
      });
    }
  };

  const handleOpenUserModal = (school: School) => {
    resetUserForm();
    setSelectedSchoolForUser(school);
    setIsUserModalOpen(true);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolForUser) return;
    createUserMutation.mutate(
      {
        email: userEmail,
        password: userPassword,
        roles: [userRole],
        schoolId: selectedSchoolForUser.id,
      },
      {
        onSuccess: () => {
          const roleLabel = userRole === Role.DIRECTOR ? 'Directeur' : userRole === Role.SECRETARY ? 'Secrétaire' : 'Comptable';
          toast.success(`${roleLabel} créé(e) pour "${selectedSchoolForUser.name}" !`);
          setIsUserModalOpen(false);
          resetUserForm();
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la création');
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Entête Espace Super-Admin */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-indigo-600/30 text-indigo-400 rounded-2xl border border-indigo-500/40 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-indigo-300" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 mb-1">
              <span>ESPACE SUPER-ADMINISTRATEUR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gestion du Réseau d'Établissements
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Création, édition et configuration Multi-Tenant des écoles partenaires Gesta School
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 text-sm flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvel Établissement</span>
        </button>
      </div>

      {/* Cartes de Statistiques Métier */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Écoles Partenaires</span>
            <span className="text-2xl font-black text-slate-900">{schools.length}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Statut Multi-Tenant</span>
            <span className="text-sm font-bold text-emerald-600">Actif & Isolation Strict</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Niveau d'Accès</span>
            <span className="text-sm font-bold text-amber-600">Super-Admin Réseau</span>
          </div>
        </div>
      </div>

      {/* Tableau des Établissements */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Liste des Établissements Scolaires</h2>
          <span className="text-xs text-slate-400 font-mono font-medium">{schools.length} enregistrements</span>
        </div>

        {schoolsQuery.error ? (
          <QueryPanel
            query={schoolsQuery}
            fallback="La liste des établissements est momentanément indisponible."
          >
            {null}
          </QueryPanel>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-400 text-sm font-mono">Chargement des établissements...</div>
        ) : schools.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Aucun établissement enregistré</p>
            <p className="text-xs text-slate-400 mt-1">Cliquez sur "Nouvel Établissement" pour en ajouter un.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/50">
                  <th className="py-3.5 px-4">Établissement</th>
                  <th className="py-3.5 px-4">Code / Slug</th>
                  <th className="py-3.5 px-4">Adresse</th>
                  <th className="py-3.5 px-4">Téléphone</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {schools.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900 flex items-center space-x-3">
                      <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                        {s.slug.slice(0, 2)}
                      </div>
                      <span>{s.name}</span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-extrabold text-xs rounded-md border border-indigo-200">
                        {s.slug}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-600 text-xs">
                      {s.address ? (
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.address}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">Non renseigné</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-600 text-xs font-mono">
                      {s.phone ? (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">Non renseigné</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => setStaffSchool(s)}
                        className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-colors inline-flex items-center justify-center"
                        title="Personnel et mots de passe"
                      >
                        <Users className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenUserModal(s)}
                        className="p-2 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl transition-colors inline-flex items-center justify-center"
                        title="Créer un utilisateur pour cet établissement"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-colors inline-flex items-center justify-center"
                        title="Éditer l'établissement"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(s)}
                        className="p-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-colors inline-flex items-center justify-center"
                        title="Supprimer l'établissement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREATION ÉTABLISSEMENT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Ajouter un Établissement</h3>
            <p className="text-xs text-slate-500 mb-6">Création d'une nouvelle entité Multi-Tenant sur le réseau</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom de l'Établissement *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Collège Sainte Marie"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Code / Slug Unique *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CSM"
                  maxLength={10}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-mono uppercase"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Sera utilisé dans les tickets (ex: INS-CSM-26-0001)
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Découpage de l'année *
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={periodSystem}
                  onChange={(e) => setPeriodSystem(e.target.value as PeriodSystem)}
                >
                  <option value={PeriodSystem.TRIMESTER}>
                    {PERIOD_SYSTEM_LABELS[PeriodSystem.TRIMESTER]}
                  </option>
                  <option value={PeriodSystem.SEMESTER}>
                    {PERIOD_SYSTEM_LABELS[PeriodSystem.SEMESTER]}
                  </option>
                </select>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Périodes de notation créées à l'ouverture d'une année scolaire
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Adresse Physique</label>
                <input
                  type="text"
                  placeholder="Ex: Cocody Riviera 3"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone Officiel</label>
                <input
                  type="text"
                  placeholder="+2250700000000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createSchoolMutation.isPending}
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {createSchoolMutation.isPending ? 'Création...' : 'Créer École'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÉDITION ÉTABLISSEMENT */}
      {editingSchool && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setEditingSchool(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Éditer l'Établissement</h3>
            <p className="text-xs text-slate-500 mb-6">Modification des informations de {editingSchool.name}</p>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom de l'Établissement *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Code / Slug Unique *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-mono uppercase"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Adresse Physique</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone Officiel</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateSchoolMutation.isPending}
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {updateSchoolMutation.isPending ? 'Enregistrement...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL CRÉATION UTILISATEUR STAFF */}
      {isUserModalOpen && selectedSchoolForUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => { setIsUserModalOpen(false); resetUserForm(); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-1">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Créer un Utilisateur</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Pour l'établissement :
              <span className="font-bold text-indigo-600 ml-1">{selectedSchoolForUser.name}</span>
              <span className="font-mono text-slate-400 ml-1">({selectedSchoolForUser.slug})</span>
            </p>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rôle *</label>
                <select
                  required
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as Role)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                >
                  <option value={Role.DIRECTOR}>Directeur</option>
                  <option value={Role.SECRETARY}>Secrétaire</option>
                  <option value={Role.ACCOUNTANT}>Comptable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: direction@ecole.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 caractères"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsUserModalOpen(false); resetUserForm(); }}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {staffSchool && (
        <SchoolStaffPanel school={staffSchool} onClose={() => setStaffSchool(null)} />
      )}

    </div>
  );
};
