
import { VehicleProfile, TuneSettings } from './types';

export const VEHICLE_PROFILES: VehicleProfile[] = [
  {
    id: 'motec-m1',
    name: 'MoTeC M1 Series',
    engine: 'V8 Twin Turbo (Proprietary)',
    maxBoost: 45,
    safeAFR: 11.2,
    fuelType: 'E85',
    vinPrefix: 'MOT',
    ecuType: 'MoTeC M150',
    displacement: 5.2,
    turboSize: 'Precision 7675'
  },
  {
    id: 'haltech-nexus',
    name: 'Haltech Nexus R5',
    engine: '2JZ-GTE Custom',
    maxBoost: 35,
    safeAFR: 11.0,
    fuelType: 'Racing',
    vinPrefix: 'HAL',
    ecuType: 'Haltech VCU',
    displacement: 3.0,
    turboSize: 'Garrett G42'
  },
  {
    id: 'unichip-q4',
    name: 'UniChip Q4 Piggyback',
    engine: 'Modern Turbo Diesel',
    maxBoost: 28,
    safeAFR: 17.5, // Leaner for Diesel
    fuelType: '93',
    vinPrefix: 'UNI',
    ecuType: 'UniChip Q4',
    displacement: 2.8,
    turboSize: 'VGT'
  },
  {
    id: 'hellcat',
    name: 'Dodge Challenger Hellcat',
    engine: '6.2L Supercharged V8',
    maxBoost: 22,
    safeAFR: 11.5,
    fuelType: '93',
    vinPrefix: '2C3',
    ecuType: 'FCA GPEC2A',
    displacement: 6.2,
    turboSize: '2.4L IHI'
  },
  {
    id: 'universal',
    name: 'Universal ECU Template',
    engine: 'Generic Forced Induction',
    maxBoost: 30,
    safeAFR: 11.0,
    fuelType: '93',
    vinPrefix: 'XXX',
    ecuType: 'Piggyback/Standalone',
    displacement: 3.0,
    turboSize: 'Garrett G35'
  }
];

export const INITIAL_TUNE: TuneSettings = {
  afrTarget: 14.7,
  boostLimit: 0,
  ignitionOffset: 0,
  fuelCorrection: 0,
  timingRetardPerPsi: 0.5,
  revLimit: 7000
};
