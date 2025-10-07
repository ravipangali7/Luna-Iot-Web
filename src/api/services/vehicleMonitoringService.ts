import { vehicleService } from './vehicleService';
import { dashboardService } from './dashboardService';

export interface VehicleStatus {
  id: number;
  imei: string;
  battery: number;
  signal: number;
  ignition: boolean;
  charging: boolean;
  relay: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleLocation {
  id: number;
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  satellite: number;
  realTimeGps: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleWithLatestData {
  id: number;
  imei: string;
  name: string;
  vehicleNo: string;
  vehicleType: 'car' | 'truck' | 'motorcycle' | 'bus' | 'van';
  status: 'running' | 'stop' | 'idle' | 'overspeed' | 'inactive' | 'no_data';
  latestStatus?: VehicleStatus;
  latestLocation?: VehicleLocation;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleMonitoringResponse {
  success: boolean;
  message: string;
  data: VehicleWithLatestData[];
}

class VehicleMonitoringService {

  private determineVehicleStatus(vehicle: unknown): 'running' | 'stop' | 'idle' | 'overspeed' | 'inactive' | 'no_data' {
    // Type guard to ensure vehicle has expected properties
    if (typeof vehicle !== 'object' || vehicle === null) {
      return 'no_data';
    }

    const vehicleObj = vehicle as Record<string, unknown>;

    // If no latest status or location, it's no_data
    if (!vehicleObj.latestStatus && !vehicleObj.latestLocation) {
      return 'no_data';
    }

    // If vehicle is not active, it's inactive
    if (vehicleObj.is_active === false) { // Explicitly check for false
      return 'inactive';
    }

    // If we have latest status, determine based on ignition and speed
    if (vehicleObj.latestStatus && typeof vehicleObj.latestStatus === 'object') {
      const status = vehicleObj.latestStatus as Record<string, unknown>;
      const location = vehicleObj.latestLocation as Record<string, unknown> | undefined;
      
      const ignition = Boolean(status.ignition);
      const speed = typeof location?.speed === 'number' ? location.speed : 0;
      const speedLimit = typeof vehicleObj.speedLimit === 'number' ? vehicleObj.speedLimit : 60; // Default speed limit

      if (!ignition) {
        return 'stop';
      } else if (speed > speedLimit) {
        return 'overspeed';
      } else if (speed > 0) {
        return 'running';
      } else {
        return 'idle';
      }
    }

    // If we only have location data (and no status)
    if (vehicleObj.latestLocation && typeof vehicleObj.latestLocation === 'object') {
      const location = vehicleObj.latestLocation as Record<string, unknown>;
      const speed = typeof location.speed === 'number' ? location.speed : 0;
      const speedLimit = typeof vehicleObj.speedLimit === 'number' ? vehicleObj.speedLimit : 60;

      if (speed > speedLimit) {
        return 'overspeed';
      } else if (speed > 0) {
        return 'running';
      } else {
        return 'idle';
      }
    }

    return 'no_data';
  }

  calculateStatusCounts(vehicles: VehicleWithLatestData[]) {
    const counts = {
      all: vehicles.length,
      stop: 0,
      running: 0,
      overspeed: 0,
      idle: 0,
      inactive: 0,
      no_data: 0,
    };

    vehicles.forEach(vehicle => {
      counts[vehicle.status]++;
    });

    return counts;
  }

  async getVehiclesWithLatestData(): Promise<{
    success: boolean;
    message: string;
    data: {
      vehicles: VehicleWithLatestData[];
      totalCount: number;
      statusCounts: {
        all: number;
        stop: number;
        running: number;
        overspeed: number;
        idle: number;
        inactive: number;
        no_data: number;
      };
    };
  }> {
    try {
      // First, get page 1 to determine total pages
      const firstPageResult = await vehicleService.getVehiclesPaginated(1);
      
      if (!firstPageResult.success || !firstPageResult.data) {
        throw new Error(firstPageResult.error || 'Failed to fetch first page');
      }

      const totalPages = firstPageResult.data.pagination.total_pages;
      const totalItems = firstPageResult.data.pagination.total_items;
      
      console.log(`Loading ${totalItems} vehicles across ${totalPages} pages...`);

      // Start with vehicles from page 1
      let allVehicles = firstPageResult.data.vehicles.map((vehicle: unknown) => ({
        ...(vehicle as VehicleWithLatestData),
        status: this.determineVehicleStatus(vehicle),
      })) as VehicleWithLatestData[];

      // If there are more pages, load them progressively
      if (totalPages > 1) {
        const maxConcurrentPages = 5; // Load max 5 pages at a time to avoid overwhelming the server
        
        for (let page = 2; page <= totalPages; page += maxConcurrentPages) {
          const batchPromises = [];
          
          // Create batch of pages to load
          for (let i = 0; i < maxConcurrentPages && (page + i) <= totalPages; i++) {
            const currentPage = page + i;
            batchPromises.push(
              this.loadPageData(currentPage).then(pageVehicles => {
                allVehicles = [...allVehicles, ...pageVehicles];
                console.log(`Loaded page ${currentPage}/${totalPages} (${allVehicles.length}/${totalItems} vehicles)`);
              })
            );
          }
          
          // Wait for current batch to complete before starting next batch
          await Promise.all(batchPromises);
        }
      }

      // Calculate status counts from all loaded vehicles
      const statusCounts = this.calculateStatusCounts(allVehicles);

      console.log(`Successfully loaded all ${allVehicles.length} vehicles`);

      return {
        success: true,
        message: `Vehicles retrieved successfully (${allVehicles.length} vehicles)`,
        data: {
          vehicles: allVehicles,
          totalCount: totalItems,
          statusCounts,
        },
      };
    } catch (error) {
      console.error('Error fetching vehicle monitoring data:', error);
      
      // Fallback: Try to get basic vehicle stats from dashboard
      try {
        console.log('Attempting fallback to dashboard vehicle stats...');
        const statsResult = await dashboardService.getVehicleStats();
        
        if (statsResult.success && statsResult.data) {
          // Create mock vehicles based on stats
          const mockVehicles: VehicleWithLatestData[] = [];
          const stats = statsResult.data;
          
          // Create mock vehicles for each type
          for (let i = 0; i < Math.min(stats.totalVehicles, 10); i++) {
            mockVehicles.push({
              id: i + 1,
              imei: `12345678901234${i}`,
              name: `Vehicle ${i + 1}`,
              vehicleNo: `VH${String(i + 1).padStart(3, '0')}`,
              vehicleType: 'car',
              status: 'inactive',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          
          const statusCounts = this.calculateStatusCounts(mockVehicles);
          
          return {
            success: true,
            message: 'Using fallback data - limited vehicle information available',
            data: {
              vehicles: mockVehicles,
              totalCount: mockVehicles.length,
              statusCounts,
            },
          };
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      throw new Error('Failed to fetch vehicle monitoring data');
    }
  }

  // Load only the first page for immediate display
  async loadFirstPage(): Promise<{
    success: boolean;
    message: string;
    data: {
      vehicles: VehicleWithLatestData[];
      totalPages: number;
      totalItems: number;
      statusCounts: {
        all: number;
        stop: number;
        running: number;
        overspeed: number;
        idle: number;
        inactive: number;
        no_data: number;
      };
    };
  }> {
    try {
      const result = await vehicleService.getVehiclesPaginated(1);
      
      if (result.success && result.data) {
        const vehicles = result.data.vehicles.map((vehicle: unknown) => ({
          ...(vehicle as VehicleWithLatestData),
          status: this.determineVehicleStatus(vehicle),
        })) as VehicleWithLatestData[];

        const statusCounts = this.calculateStatusCounts(vehicles);

        return {
          success: true,
          message: 'First page loaded successfully',
          data: {
            vehicles,
            totalPages: result.data.pagination.total_pages,
            totalItems: result.data.pagination.total_items,
            statusCounts,
          },
        };
      } else {
        throw new Error(result.error || 'Failed to fetch first page');
      }
    } catch (error) {
      console.error('Error loading first page:', error);
      throw new Error('Failed to load first page');
    }
  }

  // Helper method to load a single page
  async loadPageData(page: number): Promise<VehicleWithLatestData[]> {
    try {
      const result = await vehicleService.getVehiclesPaginated(page);
      
      if (result.success && result.data) {
        return result.data.vehicles.map((vehicle: unknown) => ({
          ...(vehicle as VehicleWithLatestData),
          status: this.determineVehicleStatus(vehicle),
        })) as VehicleWithLatestData[];
      } else {
        console.warn(`Failed to load page ${page}:`, result.error);
        return [];
      }
    } catch (error) {
      console.error(`Error loading page ${page}:`, error);
      return [];
    }
  }

  async getVehiclesByStatus(status: string): Promise<{
    success: boolean;
    message: string;
    data: {
      vehicles: VehicleWithLatestData[];
      totalCount: number;
      statusCounts: {
        all: number;
        stop: number;
        running: number;
        overspeed: number;
        idle: number;
        inactive: number;
        no_data: number;
      };
    };
  }> {
    try {
      // Use the same progressive loading approach as getVehiclesWithLatestData
      const allVehiclesResult = await this.getVehiclesWithLatestData();
      
      if (allVehiclesResult.success && allVehiclesResult.data) {
        const allVehicles = allVehiclesResult.data.vehicles;

        // Filter by status if not 'all'
        const vehicles = status === 'all' 
          ? allVehicles 
          : allVehicles.filter((vehicle: VehicleWithLatestData) => vehicle.status === status);

        return {
          success: true,
          message: `Vehicles retrieved successfully (${vehicles.length} vehicles for status: ${status})`,
          data: {
            vehicles,
            totalCount: allVehiclesResult.data.totalCount,
            statusCounts: allVehiclesResult.data.statusCounts,
          },
        };
      } else {
        throw new Error(allVehiclesResult.message || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles by status:', error);
      throw new Error('Failed to fetch vehicles by status');
    }
  }
}

export const vehicleMonitoringService = new VehicleMonitoringService();
export default vehicleMonitoringService;
