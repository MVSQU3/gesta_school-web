/** Découpage de l'année scolaire retenu par l'établissement. */
export enum PeriodSystem {
  TRIMESTER = 'TRIMESTER',
  SEMESTER = 'SEMESTER',
}

export const PERIOD_SYSTEM_LABELS: Record<PeriodSystem, string> = {
  [PeriodSystem.TRIMESTER]: '3 trimestres',
  [PeriodSystem.SEMESTER]: '2 semestres',
};

export interface School {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  /** Détermine les périodes créées à l'ouverture d'une année scolaire. */
  periodSystem?: PeriodSystem;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDay: string; // Format JJ-MM-AAAA
  parentPhone: string; // +225...
  createdAt?: string;
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  name: string;
  level: string;
  /** Frais de scolarité annuels de la classe, en FCFA. */
  tuitionFee: number;
}

export interface AcademicYear {
  id: string;
  label: string;
  isActive: boolean;
}

export enum EnrollmentStatus {
  /** Aucun versement reçu — le jeton 72h court toujours. */
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  /** Au moins un versement reçu, solde restant dû — la place est sécurisée. */
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  /** Scolarité intégralement réglée. */
  ENROLLED = 'ENROLLED',
  /** Délai de 72h dépassé sans aucun versement. */
  EXPIRED = 'EXPIRED',
}

/** Situation financière d'une inscription. */
export interface EnrollmentBalance {
  totalDue: number;
  amountPaid: number;
  balance: number;
  isFullyPaid: boolean;
  status: EnrollmentStatus;
}

export interface Enrollment {
  id: string;
  schoolId: string;
  studentId: string;
  classRoomId: string;
  academicYearId: string;
  reference: string; // INS-CMB-26-0001
  status: EnrollmentStatus;
  expiresAt: string;
  createdAt: string;
  /** Montant dû, figé au tarif de la classe le jour de l'inscription. */
  totalDue: number;
  createdByUserId?: string | null;
  /** Renseigné par la recherche par référence (guichet de caisse). */
  balanceInfo?: EnrollmentBalance;
  school?: School;
  student?: Student;
  classRoom?: ClassRoom;
  academicYear?: AcademicYear;
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Espèces',
  [PaymentMethod.MOBILE_MONEY]: 'Mobile Money',
  [PaymentMethod.BANK_TRANSFER]: 'Virement bancaire',
};

export enum CancellationType {
  /** Erreur de saisie : l'argent n'a en réalité jamais été encaissé. */
  ERROR = 'ERROR',
  /** Remboursement : l'argent a été encaissé puis rendu à la famille. */
  REFUND = 'REFUND',
}

export const CANCELLATION_TYPE_LABELS: Record<CancellationType, string> = {
  [CancellationType.ERROR]: 'Erreur de saisie',
  [CancellationType.REFUND]: 'Remboursement',
};

export interface Payment {
  id: string;
  enrollmentId: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber: string; // REC-CMB-26-0001
  paidAt: string;
  receivedByUserId?: string | null;
  receivedByUser?: User | null;
  enrollment?: Enrollment;
  /** Situation du dossier après ce versement (renvoyée par l'encaissement). */
  balanceAfter?: EnrollmentBalance;
  /** Renseigné dès lors que le versement a été annulé. */
  cancelledAt?: string | null;
  cancellationType?: CancellationType | null;
  cancellationReason?: string | null;
  cancelledByUserId?: string | null;
  cancelledByUser?: User | null;
}

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
  SECRETARY = 'SECRETARY',
  ACCOUNTANT = 'ACCOUNTANT',
  /** Saisit les notes des matières et classes qui lui sont affectées. */
  TEACHER = 'TEACHER',
  /**
   * Parent ou tuteur. Rôle en lecture seule, borné aux élèves qui lui sont
   * nommément rattachés — et non à l'établissement entier.
   */
  PARENT = 'PARENT',
}

export interface User {
  id: string;
  email: string;
  /** Renseignés pour les comptes parents ; facultatifs pour le personnel. */
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  roles: Role[];
  slug: string;
  isActive: boolean;
  /**
   * Mot de passe provisoire en cours : l'application est bloquée tant qu'il
   * n'a pas été remplacé.
   */
  mustChangePassword?: boolean;
  schoolId?: string;
  school?: School;
  createdAt?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Administrateur plateforme',
  [Role.DIRECTOR]: 'Directeur',
  [Role.SECRETARY]: 'Secrétaire',
  [Role.ACCOUNTANT]: 'Comptable',
  [Role.TEACHER]: 'Enseignant',
  [Role.PARENT]: 'Parent',
};

/* ─── Notation et assiduité ──────────────────────────────────────── */

export interface GradingPeriod {
  id: string;
  academicYearId: string;
  label: string; // "1er Trimestre", "2e Semestre"…
  sequence: number;
  startDate: string | null;
  endDate: string | null;
  /** Une période close n'accepte plus de saisie de notes. */
  isClosed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string | null;
}

/** Matière au programme d'une classe, avec son coefficient. */
export interface ClassRoomSubject {
  id: string;
  classRoomId: string;
  subjectId: string;
  coefficient: number;
  subject: Subject;
}

export interface TeachingAssignment {
  id: string;
  teacherId: string;
  classRoomId: string;
  subjectId: string;
  academicYearId: string;
  teacher?: User;
  classRoom?: ClassRoom;
  subject?: Subject;
  academicYear?: AcademicYear;
}

export enum EvaluationType {
  /** Devoir surveillé, toujours noté sur 20. */
  DEVOIR = 'DEVOIR',
  /** Interrogation, notée sur 10 ou sur 20. */
  INTERROGATION = 'INTERROGATION',
}

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  [EvaluationType.DEVOIR]: 'Devoir',
  [EvaluationType.INTERROGATION]: 'Interrogation',
};

export interface Evaluation {
  id: string;
  classRoomId: string;
  subjectId: string;
  gradingPeriodId: string;
  type: EvaluationType;
  title: string;
  date: string;
  /** Barème réel : 10 ou 20. Les notes sont ramenées sur 20 au calcul. */
  maxScore: number;
  weight: number;
  subject?: Subject;
  classRoom?: ClassRoom;
  gradingPeriod?: GradingPeriod;
}

/** Ligne de la feuille de notes d'une évaluation. */
export interface GradeSheetRow {
  enrollmentId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  score: number | null;
  isAbsent: boolean;
  comment: string | null;
}

export interface GradeSheet {
  evaluation: Evaluation;
  students: GradeSheetRow[];
}

export enum HalfDay {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
}

/** Statut d'un élève sur une demi-journée. `null` = présent. */
export interface AbsenceMark {
  id: string;
  isJustified: boolean;
  reason: string | null;
}

export interface RollCallRow {
  enrollmentId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  morning: AbsenceMark | null;
  afternoon: AbsenceMark | null;
}

export interface RollCall {
  date: string;
  students: RollCallRow[];
}

/* ─── Bulletins ──────────────────────────────────────────────────── */

export interface SubjectResult {
  subjectId: string;
  name: string;
  shortName: string | null;
  coefficient: number;
  /** Moyenne de l'élève dans la matière, sur 20. `null` si aucune note. */
  average: number | null;
  /** Moyenne × coefficient. */
  points: number | null;
  evaluationCount: number;
  classAverage: number | null;
  classMin: number | null;
  classMax: number | null;
}

export interface StudentBulletin {
  enrollmentId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  subjects: SubjectResult[];
  totalPoints: number;
  totalCoefficients: number;
  /** Moyenne générale sur 20. `null` si aucune note sur la période. */
  average: number | null;
  rank: number | null;
  classSize: number;
  absences: { justified: number; unjustified: number };
}

export interface ClassBulletins {
  period: GradingPeriod;
  bulletins: StudentBulletin[];
}

/** Statistiques consolidées de l'espace Direction. */
export interface DashboardStats {
  academicYear: { id: string; label: string } | null;
  enrollments: {
    total: number;
    byStatus: Record<EnrollmentStatus, number>;
  };
  finance: {
    totalDue: number;
    totalCollected: number;
    outstanding: number;
    recoveryRate: number;
    collectedToday: number;
    byMethod: Record<PaymentMethod, number>;
  };
  byClassRoom: Array<{
    classRoomId: string;
    name: string;
    enrollmentCount: number;
    totalDue: number;
    collected: number;
    outstanding: number;
  }>;
}

/** Enveloppe commune des listes paginées renvoyées par l'API. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Totaux consolidés du journal de caisse, sur toute la période filtrée. */
export interface CashJournalSummary {
  from: string;
  to: string;
  count: number;
  totalAmount: number;
  byMethod: Record<PaymentMethod, { count: number; amount: number }>;
  cancelledCount: number;
  cancelledAmount: number;
}

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.PENDING_PAYMENT]: 'En attente de paiement',
  [EnrollmentStatus.PARTIALLY_PAID]: 'Partiellement réglé',
  [EnrollmentStatus.ENROLLED]: 'Inscrit (soldé)',
  [EnrollmentStatus.EXPIRED]: 'Expiré',
};

/* ─── Historique d'un élève (GET /students/:id/history) ─────────────────── */

/** Résultats de l'élève sur une période de notation. */
export interface HistoryPeriod {
  gradingPeriodId: string;
  label: string;
  sequence: number;
  isClosed: boolean;
  /** Moyenne générale sur 20. `null` si aucune note saisie sur la période. */
  average: number | null;
  rank: number | null;
  classSize: number;
  /** Détail par matière, tel qu'il figure au bulletin. */
  subjects: {
    name: string;
    coefficient: number;
    average: number | null;
    classAverage: number | null;
  }[];
  absences: { justified: number; unjustified: number };
}

/** Versement rattaché à un dossier, annulations comprises. */
export interface HistoryPayment {
  id: string;
  receiptNumber: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  cancelledAt: string | null;
  cancellationType: string | null;
  cancellationReason: string | null;
  receivedBy: string | null;
}

/** Une absence datée, pour le relevé d'assiduité. */
export interface HistoryAbsence {
  id: string;
  date: string;
  halfDay: HalfDay;
  isJustified: boolean;
  reason: string | null;
}

/** Une année de scolarité de l'élève. */
export interface HistoryEnrollment {
  id: string;
  reference: string;
  status: EnrollmentStatus;
  academicYear: { id: string; label: string; isActive: boolean };
  classRoom: { id: string; name: string } | null;
  createdAt: string;
  expiresAt: string;
  balance: EnrollmentBalance;
  payments: HistoryPayment[];
  periods: HistoryPeriod[];
  absences: HistoryAbsence[];
}

/** Année où l'élève possède un dossier — alimente le sélecteur. */
export interface StudentYearOption {
  id: string;
  label: string;
  isActive: boolean;
  enrollmentId: string;
  status: EnrollmentStatus;
  className: string | null;
}

/**
 * Dossier d'un élève cadré sur une seule année.
 *
 * `enrollment` ne concerne que `selectedYear` ; les autres années restent
 * listées dans `availableYears` et ne sont chargées qu'à la demande.
 */
export interface StudentFile {
  student: Student;
  availableYears: StudentYearOption[];
  selectedYear: { id: string; label: string; isActive: boolean } | null;
  enrollment: HistoryEnrollment | null;
  totals: {
    years: number;
    totalDue: number;
    totalPaid: number;
    balance: number;
  };
}

/* ─── Journal d'audit (GET /audit) ──────────────────────────────────────── */

/** Valeur d'un champ avant et après modification. */
export interface AuditChange {
  before: unknown;
  after: unknown;
}

export interface AuditLog {
  id: string;
  schoolId: string | null;
  actorUserId: string | null;
  /** Recopié à l'écriture : survit à la suppression du compte. */
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  /** Phrase lisible composée par le serveur. */
  summary: string;
  changes: Record<string, AuditChange> | null;
  createdAt: string;
}

/** Libellés des opérations tracées, alignés sur ceux du serveur. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CLASSROOM_CREATED: 'Classe créée',
  CLASSROOM_UPDATED: 'Classe modifiée',
  CLASSROOM_DELETED: 'Classe supprimée',
  USER_CREATED: 'Compte créé',
  USER_UPDATED: 'Compte modifié',
  USER_STATUS_CHANGED: 'Compte activé ou désactivé',
  USER_PASSWORD_RESET: 'Mot de passe réinitialisé',
  USER_DELETED: 'Compte supprimé',
  ENROLLMENT_UPDATED: 'Dossier corrigé',
  ENROLLMENT_DELETED: 'Dossier supprimé',
  ENROLLMENT_RENEWED: 'Dossier renouvelé',
  ENROLLMENT_BULK_CREATED: 'Réinscription en masse',
  STUDENT_UPDATED: 'Fiche élève corrigée',
  ACADEMIC_YEAR_CREATED: 'Année scolaire ouverte',
  ACADEMIC_YEAR_UPDATED: 'Année scolaire modifiée',
  GRADING_PERIOD_UPDATED: 'Période de notation modifiée',
  SCHOOL_CREATED: 'Établissement créé',
  SCHOOL_UPDATED: 'Établissement modifié',
  SCHOOL_DELETED: 'Établissement supprimé',
  PAYMENT_RECEIVED: 'Versement encaissé',
  PAYMENT_CANCELLED: 'Versement annulé',
  PARENT_CREATED: 'Compte parent créé',
  PARENT_CHILD_LINKED: 'Enfant rattaché à un parent',
  PARENT_CHILD_UNLINKED: 'Enfant détaché d’un parent',
};

/* ─── Transfert de dossier entre établissements ─────────────────────────── */

export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVOKED = 'REVOKED',
}

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  [TransferStatus.PENDING]: 'En attente',
  [TransferStatus.APPROVED]: 'Accordé',
  [TransferStatus.REJECTED]: 'Refusé',
  [TransferStatus.REVOKED]: 'Révoqué',
};

/** Élève trouvé dans un autre établissement — identité seule, aucune note. */
export interface ForeignStudentMatch {
  studentId: string;
  firstName: string;
  lastName: string;
  birthDay: string;
  school: { id: string; name: string };
  existingRequest: { id: string; status: TransferStatus } | null;
}

export interface TransferRequest {
  id: string;
  requestingSchoolId: string;
  holdingSchoolId: string;
  studentId: string;
  status: TransferStatus;
  reason: string;
  decisionReason: string | null;
  decidedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  student?: Student;
  requestingSchool?: { id: string; name: string };
  holdingSchool?: { id: string; name: string };
  requestedBy?: { id: string; email: string };
}

/** Le dossier transmis : des bulletins, et rien d'autre. */
export interface SharedFile {
  student: { firstName: string; lastName: string; birthDay: string };
  holdingSchool: string;
  expiresAt: string | null;
  years: {
    label: string;
    className: string | null;
    periods: {
      period: string;
      average: number | null;
      rank: number | null;
      classSize: number;
      subjects: {
        name: string;
        coefficient: number;
        average: number | null;
        classAverage: number | null;
      }[];
    }[];
  }[];
}

/* ─── Emploi du temps ───────────────────────────────────────────────────── */

export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Lundi',
  [DayOfWeek.TUESDAY]: 'Mardi',
  [DayOfWeek.WEDNESDAY]: 'Mercredi',
  [DayOfWeek.THURSDAY]: 'Jeudi',
  [DayOfWeek.FRIDAY]: 'Vendredi',
};

/** Les jours ouvrés, dans l'ordre de la grille. */
export const SCHOOL_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

/** Un créneau de la grille horaire de l'établissement. */
export interface TimeSlot {
  id: string;
  label: string;
  /** Format HH:MM:SS. */
  startTime: string;
  endTime: string;
  sequence: number;
  isBreak: boolean;
}

/** Une séance posée dans la grille. */
export interface ScheduleCell {
  id: string;
  dayOfWeek: DayOfWeek;
  timeSlotId: string;
  subject: { id: string; name: string; shortName: string | null };
  teacher: { id: string; email: string };
  classRoom: { id: string; name: string };
  teachingAssignmentId: string;
}

export interface ScheduleGrid {
  academicYear: { id: string; label: string };
  slots: TimeSlot[];
  entries: ScheduleCell[];
}

/** Une affectation, avec le nombre de séances déjà placées. */
export interface AssignmentUsage {
  id: string;
  subject: { id: string; name: string; shortName: string | null };
  teacher: { id: string; email: string };
  classRoom: { id: string; name: string };
  scheduledCount: number;
}

/* ─── Espace parent ──────────────────────────────────────────────── */

/** Sexe déclaré d'un compte parent : désigne le père ou la mère. */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

/** Qualité du parent, telle qu'affichée à l'écran. */
export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.MALE]: 'Père',
  [Gender.FEMALE]: 'Mère',
};

/** Un enfant rattaché, tel que le voit le secrétariat. */
export interface ParentChildLink {
  studentId: string;
  fullName: string;
}

/** Compte parent dans la liste du secrétariat. */
export interface Parent {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  /** Male ou Female. Nul pour les comptes créés avant l'ajout du champ. */
  gender: Gender | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  children: ParentChildLink[];
}

/**
 * Un enfant vu depuis l'espace parent, avec son dossier de l'année en cours.
 * `enrollment` est nul tant qu'aucune inscription n'a été saisie.
 */
export interface ParentChild {
  studentId: string;
  firstName: string;
  lastName: string;
  enrollment: {
    id: string;
    reference: string;
    status: EnrollmentStatus;
    expiresAt: string;
    classRoom?: ClassRoom;
    /** `isActive` permet à l'écran d'annoncer une année clôturée. */
    academicYear?: AcademicYear;
    balance: EnrollmentBalance;
  } | null;
}

/** Année consultable depuis l'espace parent. */
export interface ParentYear {
  id: string;
  label: string;
  isActive: boolean;
}

/** Détail financier d'un dossier, côté parent. */
export interface ParentChildFinance {
  enrollment: {
    id: string;
    reference: string;
    status: EnrollmentStatus;
    classRoom?: ClassRoom;
    academicYear?: AcademicYear;
  };
  balance: EnrollmentBalance;
  payments: {
    id: string;
    amount: number;
    method: PaymentMethod;
    receiptNumber: string;
    paidAt: string;
    cancelledAt: string | null;
    cancellationReason: string | null;
  }[];
}

/** Une note individuelle, telle que la voit un parent. */
export interface ParentGrade {
  id: string;
  title: string;
  type: EvaluationType;
  date: string;
  /** Note brute, sur `maxScore`. `null` si l'élève était absent. */
  score: number | null;
  maxScore: number;
  isAbsent: boolean;
  comment: string | null;
}

/** Les notes d'une matière sur une période. */
export interface ParentSubjectGrades {
  subjectId: string;
  name: string;
  grades: ParentGrade[];
}
