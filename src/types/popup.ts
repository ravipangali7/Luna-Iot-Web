export interface Popup {
  id: number;
  title: string;
  message: string;
  image: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PopupCreateData {
  title: string;
  message: string;
  image?: File | null;
  isActive: boolean;
}

export interface PopupUpdateData {
  title?: string;
  message?: string;
  image?: File | null;
  isActive?: boolean;
}

