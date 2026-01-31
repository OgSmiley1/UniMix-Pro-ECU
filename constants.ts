
import { VehicleProfile, TuneSettings } from './types';

export const VEHICLE_PROFILES: VehicleProfile[] = [
  {
    id: 'toyota-2000gt-500',
    name: 'Toyota 2000GT (500HP Restomod)',
    engine: '3.0L 2JZ-GTE Swap',
    maxBoost: 18.5,
    safeAFR: 11.5,
    fuelType: '93',
    vinPrefix: 'MF10',
    ecuType: 'Link G4X',
    displacement: 3.0,
    induction: 'Turbo',
    turboSize: 'Garrett G30-660',
    peakTorque: '480 lb-ft'
  },
  {
    id: 'srt-demon-170',
    name: 'Dodge SRT Demon 170',
    engine: '6.2L Supercharged Hemi V8',
    maxBoost: 22.0,
    safeAFR: 11.0,
    fuelType: 'E85',
    vinPrefix: '1D7',
    ecuType: 'FCA GPEC4LM',
    displacement: 6.2,
    induction: 'Supercharged',
    turboSize: '3.0L IHI Supercharger',
    peakTorque: '945 lb-ft'
  },
  {
    id: 'acura-nsx-s',
    name: 'Acura NSX Type S (NC1)',
    engine: '3.5L Twin-Turbo V6 Hybrid',
    maxBoost: 16.0,
    safeAFR: 11.8,
    fuelType: '93',
    vinPrefix: '1NA',
    ecuType: 'Honda PGM-FI Dual',
    displacement: 3.5,
    induction: 'Turbo',
    turboSize: 'Factory Twin Turbo',
    peakTorque: '492 lb-ft'
  },
  {
    id: 'nissan-r34-apexi',
    name: 'Nissan GT-R R34 (Apexi PowerFC)',
    engine: '2.6L RB26DETT',
    maxBoost: 20.0,
    safeAFR: 11.2,
    fuelType: '93',
    vinPrefix: 'BNR34',
    ecuType: 'Apexi PowerFC',
    displacement: 2.6,
    induction: 'Turbo',
    turboSize: 'Twin Nismo R1',
    peakTorque: '450 lb-ft'
  },
  {
    id: 'haltech-elite',
    name: 'Haltech Elite Universal',
    engine: 'Custom High-HP Setup',
    maxBoost: 45.0,
    safeAFR: 10.5,
    fuelType: 'Racing',
    vinPrefix: 'HAL',
    ecuType: 'Haltech Elite 2500',
    displacement: 5.0,
    induction: 'Turbo',
    turboSize: 'User Defined',
    peakTorque: 'Varies'
  },
  {
    id: 'motec-m1',
    name: 'MoTeC M1 Series Master',
    engine: 'Pro Drag / GT3 Setup',
    maxBoost: 60.0,
    safeAFR: 11.0,
    fuelType: 'Racing',
    vinPrefix: 'MOT',
    ecuType: 'MoTeC M182',
    displacement: 4.0,
    induction: 'Turbo',
    turboSize: 'BorgWarner S400',
    peakTorque: '1200 lb-ft'
  }
];

export const INITIAL_TUNE: TuneSettings = {
  afrTarget: 14.7,
  boostLimit: 0,
  ignitionOffset: 0,
  fuelCorrection: 0,
  timingRetardPerPsi: 0.5,
  revLimit: 7500,
  crackleIntensity: 0,
  chipType: 'Standard',
  topSpeedLimit: 250,
  globalOffset: 0
};
