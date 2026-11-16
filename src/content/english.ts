import type { Question } from './types';

/**
 * Vocabulaire aéronautique français → anglais.
 * Source : sections « English vocabulary » du Manuel du BIA (CIRAS Toulouse, édition 2021).
 * Les entrées douteuses ou ambiguës du livret ont été écartées.
 */
export const VOCAB: [fr: string, en: string][] = [
  ['portance', 'lift'], ['traînée', 'drag'], ['décrochage', 'stall'], ['vrille', 'spin'],
  ['bord d’attaque', 'leading edge'], ['bord de fuite', 'trailing edge'], ['envergure', 'wingspan'],
  ['allongement', 'aspect ratio'], ['angle d’incidence', 'angle of attack'], ['finesse', 'lift-to-drag ratio'],
  ['volet', 'flap'], ['bec', 'slat'], ['aérofrein', 'airbrake'], ['gouverne', 'control surface'],
  ['palonnier', 'rudder bar'], ['manche', 'control stick'], ['dérive (empennage vertical)', 'fin'],
  ['train d’atterrissage', 'landing gear'], ['verrière', 'canopy'], ['longeron', 'spar'], ['nervure', 'rib'],
  ['lacet', 'yaw'], ['roulis', 'roll'], ['tangage', 'pitch'], ['facteur de charge', 'load factor'],
  ['décollage', 'take-off'], ['atterrissage', 'landing'], ['montée', 'climb'], ['croisière', 'cruise'],
  ['vol en palier', 'level flight'], ['roulage', 'taxiing'], ['remise des gaz', 'go-around'],
  ['piste', 'runway'], ['manche à air', 'windsock'], ['point d’attente', 'holding point'],
  ['branche vent arrière', 'downwind leg'], ['étape de base', 'base leg'], ['autorisation', 'clearance'],
  ['cap', 'heading'], ['route', 'track'], ['angle de dérive', 'drift angle'], ['vitesse sol', 'ground speed'],
  ['vent de face', 'headwind'], ['vent traversier', 'crosswind'], ['navigation à l’estime', 'dead reckoning'],
  ['brouillard', 'fog'], ['brume', 'mist'], ['brume sèche', 'haze'], ['grêle', 'hail'], ['averse', 'shower'],
  ['orage', 'thunderstorm'], ['givrage', 'icing'], ['bruine', 'drizzle'], ['rafale', 'gust'],
  ['cisaillement de vent', 'wind shear'], ['point de rosée', 'dew point'],
  ['hélice', 'propeller'], ['pale', 'blade'], ['manette des gaz', 'throttle'], ['bougie', 'spark plug'],
  ['soufflante', 'fan'], ['tuyère', 'nozzle'], ['inverseur de poussée', 'thrust reverser'], ['taux de dilution', 'bypass ratio'],
  ['anémomètre', 'airspeed indicator'], ['variomètre', 'vertical speed indicator'], ['horizon artificiel', 'attitude indicator'],
  ['tableau de bord', 'instrument panel'], ['carnet de route', 'journey log book'],
  ['certificat de navigabilité', 'airworthiness certificate'], ['gilet de sauvetage', 'life jacket'],
  ['visite prévol', 'pre-flight inspection'], ['hydravion', 'seaplane'], ['dirigeable', 'airship'],
];

export interface Passage { id: string; title: string; text: string; questions: Question[] }

/** Textes originaux écrits pour l'app. Les faits techniques viennent du Manuel du BIA. */
export const PASSAGES: Passage[] = [
  {
    id: 'jet',
    title: 'Jet streams',
    text:
      'High above the weather that most passengers notice, narrow bands of very fast air circle the globe. These jet streams are found near the tropopause, at roughly ten kilometres, where large masses of cold and warm air meet. They are only a few kilometres deep, yet they can be several hundred kilometres wide, and the wind inside them commonly reaches 200 to 300 km/h. Because they blow from west to east, they matter a great deal to airlines. A crew flying eastbound may plan a route that stays inside the stream in order to save both time and fuel, whereas a westbound flight will usually try to avoid it, even if this means a longer track over the ground. The benefit is not free of risk: at the edges of a jet stream, wind speed changes sharply over a short distance, which makes them a classic source of clear air turbulence. It cannot be seen from the cockpit. For this reason, significant weather charts mark these areas, and crews may ask passengers to keep their seat belts fastened even when the sky looks perfectly calm.',
    questions: [
      { id: 'jet1', q: 'According to the text, where are jet streams found?', choices: ['Near the tropopause, at about ten kilometres', 'Just above the ground, in valleys', 'Only over the oceans', 'Above 50 kilometres'], explain: '“found near the tropopause, at roughly ten kilometres”.' },
      { id: 'jet2', q: 'Why might an eastbound crew choose to fly inside a jet stream?', choices: ['To save time and fuel', 'To avoid all turbulence', 'To fly at a lower altitude', 'To get better radio reception'], explain: 'The stream blows from west to east, so it pushes an eastbound aircraft: “to save both time and fuel”.' },
      { id: 'jet3', q: 'In the text, the word “whereas” introduces:', choices: ['a contrast', 'a cause', 'an example', 'a conclusion'], explain: '“whereas” opposes the eastbound flight (uses the stream) and the westbound flight (avoids it).' },
      { id: 'jet4', q: 'Where is clear air turbulence most likely, according to the text?', choices: ['At the edges of the jet stream', 'In the centre of thunderstorms', 'Close to the runway', 'Inside clouds only'], explain: 'At the edges, “wind speed changes sharply over a short distance”.' },
      { id: 'jet5', q: 'Why may passengers be asked to keep their seat belts fastened in a calm sky?', choices: ['Because this turbulence cannot be seen', 'Because the aircraft is about to land', 'Because the jet stream is too narrow', 'Because the wind blows from east to west'], explain: 'Clear air turbulence “cannot be seen from the cockpit”.' },
      { id: 'jet6', q: 'What does “a longer track over the ground” mean?', choices: ['A greater distance flown', 'A longer runway', 'A slower climb', 'A wider aircraft'], explain: 'The “track” is the path over the ground: avoiding the stream means flying further.' },
    ],
  },
  {
    id: 'ice',
    title: 'Ice on the wing',
    text:
      'Ice is one of the oldest enemies of aviation. When an aircraft flies through supercooled droplets, that is, water which is still liquid below zero degrees Celsius, the droplets freeze as soon as they touch the airframe. The deposit grows fastest on thin parts such as the leading edges, the propeller blades and the small tubes that feed the airspeed indicator. The consequences go well beyond extra weight. Even a thin, rough layer disturbs the airflow over the wing, so the aircraft produces less lift and more drag, and it may stall at a higher speed than the pilot expects. Ice can also block control surfaces or give false instrument readings. Protection therefore starts on the ground: before departure in winter conditions, the aircraft is sprayed with a fluid that removes existing ice, and then with a second fluid that prevents new ice from forming, though only for a limited time. In flight, crews rely on heated windscreens and probes, and on systems that keep the leading edges clear. Above all, they study the forecast, since the safest way to deal with severe icing is not to meet it.',
    questions: [
      { id: 'ice1', q: 'What are “supercooled droplets”?', choices: ['Liquid water below zero degrees Celsius', 'Small pieces of hail', 'Water vapour above a cloud', 'Snowflakes that melt on contact'], explain: 'The text defines them: “water which is still liquid below zero degrees Celsius”.' },
      { id: 'ice2', q: 'According to the text, where does ice build up fastest?', choices: ['On thin parts such as leading edges', 'On the cabin windows', 'Under the fuselage', 'Inside the fuel tanks'], explain: '“fastest on thin parts such as the leading edges, the propeller blades…”.' },
      { id: 'ice3', q: 'How does a rough layer of ice affect the wing?', choices: ['Less lift and more drag', 'More lift and less drag', 'More lift and more drag', 'No effect except extra weight'], explain: 'It “disturbs the airflow”: “less lift and more drag”.' },
      { id: 'ice4', q: 'What is said about the second fluid sprayed on the ground?', choices: ['It protects only for a limited time', 'It makes de-icing in flight unnecessary', 'It is used to clean the windscreen', 'It increases engine power'], explain: 'It “prevents new ice from forming, though only for a limited time”.' },
      { id: 'ice5', q: 'What does the last sentence suggest?', choices: ['Avoiding severe icing is better than fighting it', 'Forecasts about icing are unreliable', 'Modern aircraft cannot be affected by ice', 'Pilots should climb through icing quickly'], explain: '“the safest way to deal with severe icing is not to meet it”.' },
      { id: 'ice6', q: 'In the text, “it may stall at a higher speed” means that:', choices: ['the wing stops producing enough lift sooner than expected', 'the engines stop at high speed', 'the aircraft flies faster with ice', 'the pilot must increase the angle of attack'], explain: 'With ice, lift is lost at a higher speed than on a clean wing.' },
    ],
  },
  {
    id: 'circuit',
    title: 'The aerodrome circuit',
    text:
      'For a student pilot, the first flights are spent in the aerodrome circuit, a rectangular pattern flown around the runway at about one thousand feet above the ground. After take-off, the aircraft climbs straight ahead, then turns onto the crosswind leg. A second turn brings it onto the downwind leg, parallel to the runway but in the opposite direction to landing. Here the pilot has a little time to check the aircraft, look at the windsock and prepare for the approach. The base leg follows, and a last turn lines the aircraft up with the runway on final. Both take-off and landing are made into the wind, because a headwind reduces the speed over the ground and therefore the distance needed. The direction of the circuit is not left to chance: depending on the aerodrome, turns are made to the left or to the right, and this is shown on the approach chart. At an aerodrome without a control tower, pilots announce their position on the radio at each stage, and each of them remains responsible for seeing and avoiding the others.',
    questions: [
      { id: 'cir1', q: 'On which leg does the aircraft fly parallel to the runway, opposite to the landing direction?', choices: ['The downwind leg', 'The base leg', 'The crosswind leg', 'Final'], explain: 'The downwind leg is “parallel to the runway but in the opposite direction to landing”.' },
      { id: 'cir2', q: 'Why are take-off and landing made into the wind?', choices: ['A headwind reduces the distance needed', 'A headwind increases the speed over the ground', 'It makes the circuit shorter', 'It keeps the engine cooler'], explain: 'A headwind “reduces the speed over the ground and therefore the distance needed”.' },
      { id: 'cir3', q: 'How does a pilot know whether the circuit is flown to the left or to the right?', choices: ['It is shown on the approach chart', 'It is always to the left', 'The pilot chooses freely', 'It depends on the aircraft type'], explain: '“this is shown on the approach chart”.' },
      { id: 'cir4', q: 'What does the pilot do on the downwind leg, according to the text?', choices: ['Checks the aircraft and prepares the approach', 'Climbs to cruise altitude', 'Reduces the engine power completely', 'Lines up with the runway'], explain: 'The pilot has time “to check the aircraft, look at the windsock and prepare for the approach”.' },
      { id: 'cir5', q: 'At an aerodrome without a control tower, who is responsible for avoiding other aircraft?', choices: ['Each pilot', 'The nearest control centre', 'The flying club instructor', 'Nobody in particular'], explain: 'Each pilot “remains responsible for seeing and avoiding the others”.' },
      { id: 'cir6', q: 'Which word in the text names the device that shows the wind direction on the ground?', choices: ['windsock', 'crosswind', 'headwind', 'chart'], explain: 'A windsock (“manche à air”) shows where the wind comes from.' },
    ],
  },
];
