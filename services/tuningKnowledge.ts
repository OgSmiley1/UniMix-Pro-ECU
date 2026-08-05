/**
 * Grounded tuning reference content — condensed from real forum/technical
 * consensus (HP Academy, Supra Forums, SR20 Forum, DSMtuners, ToyMods,
 * North Tuned, Engineer Fix), not generated speculation. Used both to
 * ground the Gemini prompt and to render an in-app reference panel.
 */

export interface TuningTechnique {
  id: string;
  title: string;
  summary: string;
  howItWorks: string;
  risks: string[];
  verdict: string;
}

export const TUNING_TECHNIQUES: TuningTechnique[] = [
  {
    id: 'popcorn-crackle',
    title: 'Popcorn / Crackle ("Burble") Tune',
    summary: 'The overrun ignition-retard technique that makes an engine pop and crackle on throttle lift-off.',
    howItWorks: 'On throttle lift-off, the ECU keeps a small amount of fuel spraying instead of cutting it, and retards ignition timing dramatically — the spark fires so late that combustion is still happening as the exhaust valve opens. Unburned fuel vapor is pushed into the hot exhaust manifold, where residual oxygen and heat ignite it externally, producing the pops and flames.',
    risks: [
      'On a street car with a catalytic converter (or DPF on diesels) still fitted, this cooks the cat/DPF — it is not designed to survive combustion happening inside it.',
      'Repeated thermal cycling stresses exhaust manifolds, gaskets, and turbine housings over time.',
      'A true motorsport anti-lag system (igniting fuel in the manifold to keep the turbo spinning) is functionally different and far more aggressive — it exists to kill turbo lag on stage rally cars, at the direct cost of turbo/manifold life. A street "burble" tune imitates the sound with none of that functional benefit.',
    ],
    verdict: 'Cosmetic on a street car, not a performance mod. If you want it, it needs its own overrun fuel/ignition map (not just a slider) and — if the car still has a cat/DPF — a straight pipe, or you will destroy the emissions hardware.',
  },
  {
    id: 'boost-control',
    title: 'Boost Control & Wastegate Strategy',
    summary: 'How boost is actually raised safely, and why "turn up the boost controller" is the most common way builds go wrong.',
    howItWorks: 'A wastegate bleeds exhaust gas around the turbine to cap boost at the spring pressure; an electronic boost controller (EBC) modulates a solenoid to raise boost above spring pressure by partially blocking wastegate reference pressure. Proper tuning raises boost gradually while adjusting the ignition and fuel maps at each new load point — boost is a 3D-map problem (RPM x load), not a single number.',
    risks: [
      'Cranking boost via an EBC without touching the ignition map means the ECU is still commanding timing calibrated for lower boost — a widely cited cause of knock-driven engine damage on tuned JDM turbo cars.',
      'No boost-cut failsafe: if a wastegate actuator hose pops off or the gate sticks, boost can run away uncontrolled with nothing to stop it.',
      'Boost creep (boost rising past target at high RPM as the wastegate can no longer flow enough exhaust) is common on undersized wastegates at higher power levels.',
    ],
    verdict: 'Always pair a boost increase with a load-based ignition/fuel map revision and a hard boost-cut failsafe, not just a target-pressure slider.',
  },
  {
    id: 'water-meth-injection',
    title: 'Water/Methanol Injection (WMI)',
    summary: 'Injecting a water-methanol mix into the intake charge for evaporative cooling and octane boost — lets a tune run more boost/timing on the same pump fuel.',
    howItWorks: 'A WMI kit sprays a water/methanol mix (commonly 50/50, sometimes straight methanol) into the intake tract, usually triggered by a boost or MAP switch. The evaporating water pulls heat out of the intake charge, and methanol adds effective octane — together they let the tune run more boost and more ignition advance than the base fuel alone would safely allow.',
    risks: [
      'The tune is only safe as long as the meth is actually flowing. If the tank runs dry, a pump fails, a fuse blows, or a nozzle clogs, you instantly lose both the cooling and the octane the tune is counting on — this is the single most-cited way WMI kills engines, because the ignition/boost map was calibrated assuming it would always be there.',
      'The opposite failure is just as real: a stuck-open solenoid or failed pressure switch can flood the engine with water — one widely cited case hydraulic-locked a rod this way.',
      'A tune built around WMI is not safely reversible on the fly — if you turn the kit off (empty tank, disabled system) you must also revert to the lower-boost/less-aggressive base map, not keep driving on the aggressive one.',
    ],
    verdict: 'WMI without a hard failsafe (flow/level sensor feeding back to the ECU to force a conservative map when injection isn\'t confirmed) is not "extra safety margin" — it is a single point of failure the tune has been made to depend on.',
  },
  {
    id: '2-step-launch',
    title: '2-Step Launch Control',
    summary: 'A secondary, lower rev limiter engaged on the brake/clutch to build boost against the limiter before launching — a drag/drift staging tool, not a street feature.',
    howItWorks: 'With the clutch in (or brake held on an auto), full throttle holds the engine at a preset lower RPM ceiling instead of the normal rev limit — via ignition cut (aftermarket, more common) or fuel cut (many factory systems). On a turbo car this builds boost against the limiter before the car even moves; releasing the clutch/brake launches at full power and boost already spooled.',
    risks: [
      'Ignition-cut launch limiters dump unburned fuel into the exhaust exactly like a crackle tune — it will cook a stock catalytic converter quickly, which is why cars set up for it usually run a cat delete or dump pipe.',
      'The shock load of releasing the clutch at a held high RPM against full boost goes straight through the clutch, gearbox, driveshaft, differential, and axles — repeated hard 2-step launches are a known way to shorten drivetrain life, independent of anything the engine itself experiences.',
      'A launch RPM set too high for the tire/surface just spins the tires and heat-cycles them for no ET gain — the correct number comes from traction, not from "as much boost as possible."',
    ],
    verdict: 'A legitimate motorsport staging tool, but it is a drivetrain and exhaust decision as much as an engine-tuning one — set it up expecting clutch/diff wear and cat damage, not as a free party trick.',
  },
];

export const COMMON_MISTAKES: string[] = [
  'Chasing peak boost/horsepower numbers before the fuel system (injectors, pump, lines) can actually support them at the target AFR.',
  'Leaning out under boost without supporting fuel hardware — the fastest route to detonation on any piston engine.',
  'Raising boost without revising the ignition timing map for the new load — timing calibrated for lower boost causes knock at higher boost even if AFR looks fine.',
  'No boost-cut failsafe in case of wastegate/actuator failure.',
  'Ignoring intercooler sizing and heat soak — especially relevant in Gulf-region ambient temps (45-50°C+), where intake air temp climbs fast in stop-and-go traffic.',
  'Treating a rotary (13B, etc.) like a piston engine — rotaries need to run noticeably richer under load to protect apex seals; a lean spike that a piston engine shrugs off can end a rotor housing.',
  'Pushing EJ25/4G63-class engines past their factory piston/ringland limits without forged internals — ringland failure under sustained high boost is one of the most repeated cautionary threads on Subaru/Evo forums.',
  'Tuning a diesel by AFR intuition carried over from gasoline — diesels run lean by design; the real limit is exhaust gas temperature (EGT), not AFR or knock.',
  'Running an old, tired turbo (especially ceramic-wheel units on older JDM platforms) at boost levels it was never rated for.',
  'No data logging during a pull — tuning by feel/sound instead of watching AFR, knock, and EGT in real time.',
  'Tuning around water/methanol injection without a flow or level failsafe wired back to the ECU — if the meth stops and the map doesn\'t know, you are instantly running a lean, over-advanced map on pump fuel.',
  'Treating a 2-step/launch-control setup as engine-only — the drivetrain (clutch, diff, axles) and the exhaust (cat) absorb just as much abuse as the motor does.',
];

export function buildKnowledgePromptContext(): string {
  const techniques = TUNING_TECHNIQUES.map(t =>
    `- ${t.title}: ${t.howItWorks} Risks: ${t.risks.join(' ')}`
  ).join('\n');
  const mistakes = COMMON_MISTAKES.map(m => `- ${m}`).join('\n');
  return `Reference technique knowledge:\n${techniques}\n\nCommon mistakes to weigh against this build:\n${mistakes}`;
}
