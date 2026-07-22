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
  level: 'COLLEGE' | 'LYCEE';
}

export interface AcademicYear {
  id: string;
  label: string;
  isActive: boolean;
}

export enum EnrollmentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ENROLLED = 'ENROLLED',
  EXPIRED = 'EXPIRED',
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
  school?: School;
  student?: Student;
  classRoom?: ClassRoom;
  academicYear?: AcademicYear;
}

export interface Payment {
  id: string;
  enrollmentId: string;
  amount: number;
  receiptNumber: string; // REC-CMB-26-0001
  paidAt: string;
  enrollment?: Enrollment;
}

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
  SECRETARY = 'SECRETARY',
  ACCOUNTANT = 'ACCOUNTANT',
}

export interface User {
  id: string;
  email: string;
  roles: Role[];
  slug: string;
  schoolId?: string;
  school?: School;
}
