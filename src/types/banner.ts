export interface Banner {
  id: number;
  title: string;
  image: string | null;
  imageUrl: string | null;
  url: string | null;
  isActive: boolean;
  click: number;
  orderPosition: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BannerCreateData {
  title: string;
  url?: string;
  image?: File | null;
  isActive: boolean;
  orderPosition?: number;
}

export interface BannerUpdateData {
  title?: string;
  url?: string;
  image?: File | null;
  isActive?: boolean;
  orderPosition?: number;
}

