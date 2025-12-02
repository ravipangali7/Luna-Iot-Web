export interface PublicVehicleImage {
  id: number;
  image: string;
  title: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface PublicVehicle {
  id: number;
  institute: {
    id: number;
    name: string;
  };
  vehicle: {
    id: number;
    name: string;
    vehicleNo: string;
  };
  description: string | null;
  is_active: boolean;
  images: PublicVehicleImage[];
  created_at: string;
  updated_at: string;
}

export interface PublicVehicleFormData {
  institute: number;
  vehicle: number;
  description: string;
  is_active: boolean;
  images?: File[];
  image_titles?: string[];
  images_to_delete?: number[];
}

export interface InstituteModuleAccess {
  institute_id: number;
  institute_name: string;
  has_public_vehicle_access: boolean;
}

