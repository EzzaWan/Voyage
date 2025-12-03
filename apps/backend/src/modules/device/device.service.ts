import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface DeviceData {
  brand: string;
  esim: boolean;
  notes?: string[];
  regionalNotes?: Record<string, string>;
}

interface DeviceDatabase {
  [key: string]: DeviceData;
}

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);
  private deviceDatabase: DeviceDatabase = {};

  constructor() {
    this.loadDeviceDatabase();
  }

  private loadDeviceDatabase() {
    try {
      // Try multiple possible paths to handle different execution contexts
      const possiblePaths = [
        // Path when running from apps/backend directory (most common)
        path.join(process.cwd(), 'src', 'data', 'device-database.json'),
        // Path relative to this file's location (works in compiled code)
        path.join(__dirname, '..', '..', 'data', 'device-database.json'),
        // Path when running from project root
        path.join(process.cwd(), 'apps', 'backend', 'src', 'data', 'device-database.json'),
      ];

      let filePath: string | null = null;
      for (const possiblePath of possiblePaths) {
        try {
          if (fs.existsSync(possiblePath)) {
            filePath = possiblePath;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      if (!filePath) {
        this.logger.warn(`Device database file not found. Tried: ${possiblePaths.join(', ')}`);
        this.deviceDatabase = {};
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      this.deviceDatabase = JSON.parse(fileContent);
      this.logger.log(`Loaded ${Object.keys(this.deviceDatabase).length} device models from database`);
    } catch (error) {
      this.logger.error(`Failed to load device database: ${error.message}`);
      this.deviceDatabase = {};
    }
  }

  getAllModels(): string[] {
    return Object.keys(this.deviceDatabase);
  }

  searchModels(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllModels().filter((model) =>
      model.toLowerCase().includes(lowerQuery)
    );
  }

  checkCompatibility(
    model: string,
    country?: string,
  ): {
    model: string;
    brand: string;
    supported: boolean;
    notes: string[];
    regionalNotes: Record<string, string>;
  } {
    const deviceData = this.deviceDatabase[model];

    if (!deviceData) {
      // Device not found in database
      return {
        model,
        brand: 'Unknown',
        supported: false,
        notes: [
          'Device model not found in our database. Please verify your device model name or contact support for assistance.',
        ],
        regionalNotes: {},
      };
    }

    const notes: string[] = [];
    const regionalNotes: Record<string, string> = { ...(deviceData.regionalNotes || {}) };

    // Check if country-specific restrictions exist
    if (country && deviceData.regionalNotes?.[country.toUpperCase()]) {
      notes.push(deviceData.regionalNotes[country.toUpperCase()]);
    }

    // Add general notes
    if (deviceData.notes) {
      notes.push(...deviceData.notes);
    }

    // Determine support status
    let supported = deviceData.esim;

    // If there's a country-specific note about no eSIM, mark as unsupported
    if (
      country &&
      deviceData.regionalNotes?.[country.toUpperCase()]?.toLowerCase().includes('no esim')
    ) {
      supported = false;
    }

    return {
      model,
      brand: deviceData.brand,
      supported,
      notes,
      regionalNotes,
    };
  }
}
