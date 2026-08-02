import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  UserPlus,
  Clock,
  CheckCircle2,
  Ticket,
  Calendar,
  Search,
  X,
  History,
} from "lucide-react";
import { useSchoolStore } from "../store/useSchoolStore";
import { useEnrollmentDraftStore } from "../store/useEnrollmentDraftStore";
import { useAcademicYears, useClassRooms } from "../hooks/useClasses";
import { useCreateEnrollment } from "../hooks/useEnrollments";
import { useStudentSearch } from "../hooks/useStudents";
import type { Student } from "../types";


export const SecretariatForm: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const draft = useEnrollmentDraftStore();

  // Réinscription : élève déjà connu de l'établissement. Tant qu'une fiche est
  // sélectionnée, on envoie son identifiant plutôt que de recréer un élève.
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentQuery, setStudentQuery] = useState('');
  const { data: foundStudents = [], isFetching: isSearching } = useStudentSearch(
    studentQuery,
    currentSchool?.id,
  );

  const pickStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentQuery('');
    // Les champs restent affichés en lecture seule, alimentés par la fiche
    draft.setDraft({
      firstName: student.firstName,
      lastName: student.lastName,
      parentPhone: student.parentPhone,
    });
  };

  const clearStudent = () => {
    setSelectedStudent(null);
    draft.setDraft({ firstName: '', lastName: '', parentPhone: '+225' });
    setIsoDate('');
  };

  const { data: classRooms = [] } = useClassRooms();
  const { data: academicYears = [] } = useAcademicYears();
  const createEnrollmentMutation = useCreateEnrollment();

  // Carte du dernier ticket stockée de manière distante dans le store
  const generatedEnrollment = draft.lastGeneratedEnrollment;

  // Date locale ISO (YYYY-MM-DD) pour l'input type="date"
  const [isoDate, setIsoDate] = useState<string>(() => {
    if (draft.birthDay && draft.birthDay.includes("-")) {
      const parts = draft.birthDay.split("-");
      if (parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return "";
  });

  /**
   * Le brouillon est conservé en sessionStorage. Une classe supprimée ou
   * renommée depuis y laisserait un identifiant périmé, envoyé tel quel à
   * l'API — d'où un refus incompréhensible pour la secrétaire, portant sur un
   * identifiant qu'elle ne voit nulle part.
   *
   * La sélection mémorisée est donc confrontée à la liste réellement chargée,
   * et remplacée par le premier élément valide si elle n'y figure plus.
   */
  useEffect(() => {
    if (classRooms.length === 0) return;
    const stillExists = classRooms.some((c) => c.id === draft.selectedClassId);
    if (!stillExists) {
      draft.setDraft({ selectedClassId: classRooms[0].id });
    }
  }, [classRooms, draft]);

  useEffect(() => {
    if (academicYears.length === 0) return;
    const stillExists = academicYears.some((y) => y.id === draft.selectedYearId);
    if (!stillExists) {
      // L'année active est le choix par défaut le plus sensé
      const preferred = academicYears.find((y) => y.isActive) ?? academicYears[0];
      draft.setDraft({ selectedYearId: preferred.id });
    }
  }, [academicYears, draft]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    setIsoDate(val);

    if (val) {
      const [y, m, d] = val.split("-");
      const formattedLocal = `${d}-${m}-${y}`; // JJ-MM-AAAA
      draft.setDraft({ birthDay: formattedLocal });
    } else {
      draft.setDraft({ birthDay: "" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentSchool) {
      toast.error(
        "Veuillez sélectionner un établissement dans le haut de la page",
      );
      return;
    }

    if (!selectedStudent && !draft.birthDay) {
      toast.error("Veuillez sélectionner la date de naissance");
      return;
    }

    createEnrollmentMutation.mutate(
      {
        schoolId: currentSchool.id,
        classRoomId: draft.selectedClassId,
        academicYearId: draft.selectedYearId,
        // Réinscription sur une fiche existante, ou création d'un nouvel élève
        ...(selectedStudent
          ? { studentId: selectedStudent.id }
          : {
              studentData: {
                firstName: draft.firstName,
                lastName: draft.lastName,
                birthDay: draft.birthDay,
                parentPhone: draft.parentPhone,
              },
            }),
      },
      {
        onSuccess: (data) => {
          draft.setLastGeneratedEnrollment(data);
          toast.success(
            `Ticket d'inscription ${data.reference} généré avec succès (valable 72h)`,
          );
          draft.resetDraft();
          setSelectedStudent(null);
          setStudentQuery("");
          setIsoDate("");
        },
        onError: (err: any) => {
          const payload = err.response?.data;
          const msg = payload?.message;

          // Doublon détecté : l'API renvoie la fiche existante, on propose
          // au secrétariat de basculer dessus plutôt que de recréer un élève.
          if (err.response?.status === 409 && payload?.existingStudent) {
            const existing = payload.existingStudent as Student;
            toast(
              (toastItem) => (
                <div className="text-sm">
                  <p className="font-bold text-slate-900 mb-1">
                    Élève déjà enregistré
                  </p>
                  <p className="text-xs text-slate-600 mb-2">
                    {existing.firstName} {existing.lastName} possède déjà une
                    fiche dans cet établissement. Réutilisez-la pour conserver
                    son historique.
                  </p>
                  <button
                    onClick={() => {
                      pickStudent(existing);
                      toast.dismiss(toastItem.id);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
                  >
                    Utiliser sa fiche existante
                  </button>
                </div>
              ),
              { duration: 10000 },
            );
            return;
          }

          toast.error(
            Array.isArray(msg) ? msg[0] : msg || "Erreur lors de l’inscription",
          );
        },
      },
    );
  };


  console.log("log de classeRoom", classRooms)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Formulaire de Saisie avec Persistance du Brouillon */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Enrôlements</h2>
              <p className="text-sm text-slate-500">
                Saisie et émission du ticket d'inscription
              </p>
            </div>
          </div>
          {(draft.firstName || draft.lastName || draft.birthDay) && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Brouillon sauvegardé 💾
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Réinscription : retrouver un élève déjà connu */}
          {selectedStudent ? (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start justify-between gap-3">
              <div className="flex items-start space-x-2.5 min-w-0">
                <History className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    Réinscription — {selectedStudent.firstName}{' '}
                    {selectedStudent.lastName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Né(e) le{' '}
                    {new Date(selectedStudent.birthDay).toLocaleDateString('fr-FR')}{' '}
                    · {selectedStudent.parentPhone}
                  </p>
                  <p className="text-[11px] text-indigo-700 mt-1">
                    La fiche existante est réutilisée : l'historique de l'élève
                    est conservé.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearStudent}
                title="Saisir un nouvel élève à la place"
                className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Élève déjà inscrit ?{' '}
                <span className="text-slate-400 font-normal">
                  (recherche par nom ou téléphone)
                </span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Rechercher pour une réinscription..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {studentQuery.trim().length >= 2 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  {isSearching ? (
                    <p className="px-3 py-2.5 text-xs text-slate-400">
                      Recherche...
                    </p>
                  ) : foundStudents.length === 0 ? (
                    <p className="px-3 py-2.5 text-xs text-slate-400">
                      Aucun élève trouvé — remplissez le formulaire ci-dessous
                      pour une première inscription.
                    </p>
                  ) : (
                    foundStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => pickStudent(s)}
                        className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 border-b border-slate-100 last:border-0"
                      >
                        <span className="text-sm font-semibold text-slate-800">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {new Date(s.birthDay).toLocaleDateString('fr-FR')} ·{' '}
                          {s.parentPhone}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Nom de famille *
              </label>
              <input
                type="text"
                required={!selectedStudent}
                disabled={!!selectedStudent}
                placeholder="Ex: Kouassi"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                value={draft.lastName}
                onChange={(e) => draft.setDraft({ lastName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Prénom de l'élève *
              </label>
              <input
                type="text"
                required={!selectedStudent}
                disabled={!!selectedStudent}
                placeholder="Ex: Jean"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                value={draft.firstName}
                onChange={(e) => draft.setDraft({ firstName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-indigo-500" />
                Date de Naissance *
              </label>
              <input
                type="date"
                required={!selectedStudent}
                disabled={!!selectedStudent}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white cursor-pointer"
                value={isoDate}
                onChange={handleDateChange}
              />
              {draft.birthDay && (
                <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                  Format transmis: {draft.birthDay}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Téléphone Parent (+225) *
              </label>
              <input
                type="text"
                required={!selectedStudent}
                disabled={!!selectedStudent}
                placeholder="+2250700000000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono"
                value={draft.parentPhone}
                onChange={(e) =>
                  draft.setDraft({ parentPhone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Classe Demandée *
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                value={draft.selectedClassId}
                onChange={(e) =>
                  draft.setDraft({ selectedClassId: e.target.value })
                }
              >
                {classRooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Année Scolaire *
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                value={draft.selectedYearId}
                onChange={(e) =>
                  draft.setDraft({ selectedYearId: e.target.value })
                }
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={createEnrollmentMutation.isPending}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {createEnrollmentMutation.isPending ? (
              <span>Génération du ticket...</span>
            ) : (
              <>
                <Ticket className="w-5 h-5" />
                <span>Générer le Ticket 72H & Inscrire</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Carte d'affichage du Ticket 72h généré */}
      <div className="flex flex-col justify-center">
        {generatedEnrollment ? (
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-8 rounded-3xl shadow-2xl border border-indigo-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5 mr-1" />
                VALABLE 72 HEURES
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Dernier Ticket Généré
              </span>
            </div>

            <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-1">
              Référence Comptable Unique
            </p>
            <h3 className="text-4xl font-extrabold text-white tracking-widest font-mono mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
              {generatedEnrollment.reference}
            </h3>

            <div className="space-y-3 border-t border-indigo-950/80 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Élève inscrit :</span>
                <span className="font-semibold text-white">
                  {generatedEnrollment.student?.firstName}{" "}
                  {generatedEnrollment.student?.lastName}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Téléphone Parent :</span>
                <span className="font-semibold text-white font-mono">
                  {generatedEnrollment.student?.parentPhone}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">
                  Date limite d'encaissement :
                </span>
                <span className="font-semibold text-amber-400 font-mono">
                  {new Date(generatedEnrollment.expiresAt).toLocaleString(
                    "fr-FR",
                  )}
                </span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-indigo-950/50 rounded-2xl border border-indigo-800/40 flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-slate-300">
                Transmettez ce numéro{" "}
                <strong className="text-white">
                  {generatedEnrollment.reference}
                </strong>{" "}
                au parent pour effectuer le règlement au guichet de la caisse.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
            <Ticket className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">
              Aucun Ticket Généré
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              Remplissez le formulaire de droite pour enregistrer l'élève et
              générer le ticket comptable valable 72 heures.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
