import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, Clock, CheckCircle2, Ticket, Calendar } from "lucide-react";
import { useSchoolStore } from "../store/useSchoolStore";
import { useEnrollmentDraftStore } from "../store/useEnrollmentDraftStore";
import { useAcademicYears, useClassRooms } from "../hooks/useClasses";
import { useCreateEnrollment } from "../hooks/useEnrollments";


export const SecretariatForm: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const draft = useEnrollmentDraftStore();

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

  useEffect(() => {
    if (classRooms.length > 0 && !draft.selectedClassId) {
      draft.setDraft({ selectedClassId: classRooms[0].id });
    }
  }, [classRooms, draft]);

  useEffect(() => {
    if (academicYears.length > 0 && !draft.selectedYearId) {
      draft.setDraft({ selectedYearId: academicYears[0].id });
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

    if (!draft.birthDay) {
      toast.error("Veuillez sélectionner la date de naissance");
      return;
    }

    createEnrollmentMutation.mutate(
      {
        schoolId: currentSchool.id,
        classRoomId: draft.selectedClassId,
        academicYearId: draft.selectedYearId,
        studentData: {
          firstName: draft.firstName,
          lastName: draft.lastName,
          birthDay: draft.birthDay,
          parentPhone: draft.parentPhone,
        },
      },
      {
        onSuccess: (data) => {
          draft.setLastGeneratedEnrollment(data);
          toast.success(
            `Ticket d'inscription ${data.reference} généré avec succès (valable 72h)`,
          );
          draft.resetDraft();
          setIsoDate("");
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          toast.error(
            Array.isArray(msg) ? msg[0] : msg || "Erreur lors de l’inscription",
          );
        },
      },
    );
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Nom de famille *
              </label>
              <input
                type="text"
                required
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
                required
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
                required
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
                required
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
