export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'all' | 'specific' | 'role';
  sentBy: {
    id: number;
    name: string;
    phone: string;
  } | null;
  isRead?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NotificationCreateData {
  title: string;
  message: string;
  type: 'all' | 'specific' | 'role';
  targetUserIds?: number[];
  targetRoleIds?: number[];
}

export interface NotificationUpdateData {
  title?: string;
  message?: string;
  type?: 'all' | 'specific' | 'role';
  targetUserIds?: number[];
  targetRoleIds?: number[];
}

