export type EventStatus = "open" | "closed";

export interface CampusEvent {
  id: number;
  title: string;
  description: string;
  status: EventStatus;
  closureDescription: string | null;
  closureImages: string[];
  enrollmentCount: number;
  isEnrolled: boolean;
  createdByUserId: number;
  createdBy: {
    id: number;
    username: string;
    name: string;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EventParticipant {
  id: number;
  username: string;
  name: string;
  enrolledAt: string | null;
}

export interface CampusEventDetail extends CampusEvent {
  participants: EventParticipant[] | null;
}
