export const dotPhrases = {
  "/dm2": `DM2
  - Traitement actuel :
  - A1c :
  - RAC :
  - Complications microvasculaires :
  - Complications macrovasculaires :
  - Complications aiguës:`,
  "/htn": "Hypertension",
  "/copd": "Chronic Obstructive Pulmonary Disease",
  "/epn": `Général : Alerte et orienté x3, pas de détresse apparente.
Neurologique : PERL. BB4M. Pas de déficits focaux.
Respiratoire : MVNX2. Pas de crépits.
Cardiovasculaire : B1B2 RCR. Pas de B3B4. Pas de souffle. Pas de frottement.
Abdo: Souple. Non distendu. Pas de défense. Pas de masse. Pas d'hépatosplénomégalie.
Musculo-squelettique : Pas de synovite. Amplitude des mouvements N.
Peau : Intacte, chaude, pas d'éruption cutanée`,
  "/abx": "The patient will be started on [[Tazocin|Ceftriaxone|Meropenem]].",
  "/plan":
    "The patient will be started on [[Tazocin|Ceftriaxone|Meropenem]] for [[5 days|7 days|10 days]].",
  "/embolieFR": `En raison de la stabilité clinique, du faible risque de complication et du contrôle adéquat des symptômes, traitement ambulatoire.
Anticoagulation avec [[Rivaroxaban 15 mg PO BID x 21 jours, puis 20 mg PO DIE|Apixaban 10 mg PO BID x 7 jours, puis 5 mg PO BID]]
Suivi avec MDF dans XYZ jours`,

  "/embolieHR": `Admission [[Étage|USI]]
  Surveillance hémodynamique
  O2 sat >90%
  [[|Fragmin 200u/kg DIE|Fragmin 100u/kg BID|Héparine IV]]
  ACOD après 72h d'anticoagulation parentérale
  Envisager thrombolytique en cas de détérioration clinique`,
  "/embolieInstable": `Admission USIM
Télémétrie
Petit bolus PRN (eg., 250-500mL)
Amines PRN
Anticoagulation: [[Fragmin 200u DIE|Fragmin 100uBID|Héparine IV]]
[[Altéplase|Thrombectomie]]`,

  "/eampoc": `Admission [[étage|soins inter.|USI]]
Sat 88-92%
VNI PRN
Ventolin + atrovent régulier
Prednisone 50 mg DIE x5
Antibio: [[Clavulin 875 BID|Levaquin|Ceftri/azithro|Tazo]]`,

  "/ICStable": `Admission [[étage|soins coro]]
Télémétrie, peser DIE, bilan rénal DIE
ETT
ECG
Lasix [[20|40|60|80]] IV BID
Sat ≥90%, VNI PRN
Une fois euvolémique et HD stable, optimisation quadruthérapie`,

  "/ICInstable": `Admission [[soins coro]]
Télémétrie, peser DIE, bilan rénal DIE
ECG, tropos
Echo chevet + ETT formelle
Lasix [[20|40|60|80]] IV BID
[[Dobu|Milrinone]] PRN
Si hypotension/atteinte d'organe cible: levo
Nitro IV
Sat ≥90%, VNI PRN
`,

"/DRS": `Le patient consulte pour une DRS, de type pression, présente depuis _, irradiant vers le [[bras|le dos|le cou|la mâchoire]]. Intensité /10. Soulagée par la nitroglycérine et le repos.`,
"/date": '[[DATE]]',
"/calc": "Open calculation modal",

};

export type DotPhraseKey = keyof typeof dotPhrases;
