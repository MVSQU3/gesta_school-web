export interface School {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
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
}

export interface User {
  id: string;
  email: string;
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

/** Une année de scolarité de l'élève. */
export interface HistoryEnrollment {
  id: string;
  reference: string;
  status: EnrollmentStatus;
  academicYear: { id: string; label: string; isActive: boolean };
  classRoom: { id: string; name: string } | null;
  createdAt: string;
  balance: EnrollmentBalance;
  payments: HistoryPayment[];
  periods: HistoryPeriod[];
}

export interface StudentHistory {
  student: Student;
  enrollments: HistoryEnrollment[];
  totals: {
    years: number;
    totalDue: number;
    totalPaid: number;
    balance: number;
    absences: { justified: number; unjustified: number };
  };
}
