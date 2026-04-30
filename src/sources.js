// src/sources.js
// StrainSense — Citation registry
// Backs all terpene + cannabis effect claims with peer-reviewed sources.
// Required by Apple App Review Guideline 1.4.1 (Safety/Physical Harm).
//
// Last updated: 2026-04-30
// Curated by: Brooke / Resonant Labs
//
// Schema: { id, label, citation, url, summary, claims: [string[]] }
//   - id: stable integer used by inline [N] markers in StrainSense.jsx
//   - label: short display name shown on Sources screen
//   - citation: full APA-style reference
//   - url: direct link to PubMed / PMC / publisher landing page
//   - summary: one-sentence plain-English explanation of what the source establishes
//   - claims: array of in-app claim labels this source backs (audit trail)

export const SOURCES = [
  {
    id: 1,
    label: 'Russo (2011) — The Entourage Effect',
    citation: 'Russo EB. Taming THC: potential cannabis synergy and phytocannabinoid-terpenoid entourage effects. British Journal of Pharmacology. 2011;163(7):1344–1364. PMCID: PMC3165946.',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3165946/',
    summary: 'Foundational peer-reviewed paper on how terpenes shape cannabis effects alongside cannabinoids — the basis for terpene-driven effect prediction.',
    claims: ['terpene-effect mapping', 'entourage effect', 'mood-based recommendations']
  },
  {
    id: 2,
    label: 'Booth & Bohlmann (2019) — Terpenes in Cannabis',
    citation: 'Booth JK, Bohlmann J. Terpenes in Cannabis sativa — From plant genome to humans. Plant Science. 2019;284:67–72. PMID: 31084880.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31084880/',
    summary: 'Reviews the biosynthesis and biological activity of cannabis terpenes; supports linking specific terpene profiles to user-perceptible effects.',
    claims: ['terpene profile descriptions', 'strain chemotype variation']
  },
  {
    id: 3,
    label: 'Sommano et al. (2020) — The Cannabis Terpenes',
    citation: 'Sommano SR, Chittasupho C, Ruksiriwanich W, Jantrawut P. The Cannabis Terpenes. Molecules. 2020;25(24):5792. PMCID: PMC7763918.',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7763918/',
    summary: 'Comprehensive review of major cannabis terpenes (myrcene, limonene, pinene, linalool, β-caryophyllene) and their reported pharmacological activity.',
    claims: ['myrcene relaxing', 'limonene uplifting', 'pinene alert', 'linalool calm', 'caryophyllene relief']
  },
  {
    id: 4,
    label: 'LaVigne et al. (2021) — Terpenes Are Cannabimimetic',
    citation: 'LaVigne JE, Hecksel R, Keresztes A, Streicher JM. Cannabis sativa terpenes are cannabimimetic and selectively enhance cannabinoid activity. Scientific Reports. 2021;11(1):8232. PMCID: PMC8050321.',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8050321/',
    summary: 'Experimental evidence that terpenes selectively modulate cannabinoid receptor activity — supports terpene-led effect predictions, not just THC %.',
    claims: ['why terpenes matter more than THC%', 'effect prediction rationale']
  },
  {
    id: 5,
    label: 'do Vale et al. (2002) — Myrcene Sedation',
    citation: 'do Vale TG, Furtado EC, Santos JG Jr, Viana GS. Central effects of citral, myrcene and limonene, constituents of essential oil chemotypes from Lippia alba. Phytomedicine. 2002;9(8):709–714. PMID: 12587690.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/12587690/',
    summary: 'Animal study showing myrcene produces sedative and muscle-relaxing effects — basis for "Sleepy" and "Relaxed" mood mapping.',
    claims: ['myrcene → sleepy', 'myrcene → relaxed', 'myrcene → pain relief']
  },
  {
    id: 6,
    label: 'Komiya et al. (2006) — Limonene & Stress',
    citation: 'Komiya M, Takeuchi T, Harada E. Lemon oil vapor causes an anti-stress effect via modulating the 5-HT and DA activities in mice. Behavioural Brain Research. 2006;172(2):240–249. PMID: 16780969.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16780969/',
    summary: 'Limonene vapor reduced stress markers via serotonin/dopamine modulation — basis for "Uplifted" and "Social" mood mapping.',
    claims: ['limonene → uplifted', 'limonene → social', 'limonene → stress relief']
  },
  {
    id: 7,
    label: 'Linck et al. (2010) — Linalool & Anxiety',
    citation: 'Linck VM, da Silva AL, Figueiró M, Caramão EB, Moreno PR, Elisabetsky E. Effects of inhaled Linalool in anxiety, social interaction and aggressive behavior in mice. Phytomedicine. 2010;17(8-9):679–683. PMID: 19962290.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19962290/',
    summary: 'Inhaled linalool reduced anxiety markers and increased social interaction — basis for "Calm" and "Social" mood mapping.',
    claims: ['linalool → calm', 'linalool → relaxed', 'linalool → social']
  },
  {
    id: 8,
    label: 'Salehi et al. (2019) — α- and β-Pinene',
    citation: 'Salehi B, Upadhyay S, Erdogan Orhan I, et al. Therapeutic Potential of α- and β-Pinene: A Miracle Gift of Nature. Biomolecules. 2019;9(11):738. PMCID: PMC6918211.',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6918211/',
    summary: 'Reviews pinene\'s anti-inflammatory, bronchodilator, and cognitive-supporting properties — basis for "Focused" mood mapping.',
    claims: ['pinene → focused', 'pinene → alert', 'pinene → bronchodilation note']
  },
  {
    id: 9,
    label: 'Gertsch et al. (2008) — β-Caryophyllene',
    citation: 'Gertsch J, Leonti M, Raduner S, et al. Beta-caryophyllene is a dietary cannabinoid. Proceedings of the National Academy of Sciences USA. 2008;105(26):9099–9104. PMCID: PMC2449365.',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2449365/',
    summary: 'β-caryophyllene is a selective CB2 receptor agonist — basis for "Pain Relief" and inflammation-related effect claims.',
    claims: ['caryophyllene → pain relief', 'caryophyllene → anti-inflammatory']
  },
  {
    id: 10,
    label: 'Iffland & Grotenhermen (2017) — CBD Safety',
    citation: 'Iffland K, Grotenhermen F. An Update on Safety and Side Effects of Cannabidiol: A Review of Clinical Data and Relevant Animal Studies. Cannabis and Cannabinoid Research. 2017;2(1):139–154. PMCID: PMC5569602.',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5569602/',
    summary: 'Clinical safety review of CBD — basis for "CBD:THC ratio" guidance and tolerance recommendations.',
    claims: ['CBD safety profile', 'CBD:THC ratio context', 'tolerance guidance']
  },
  {
    id: 11,
    label: 'National Academies (2017) — Cannabis Health Effects',
    citation: 'National Academies of Sciences, Engineering, and Medicine. The Health Effects of Cannabis and Cannabinoids: The Current State of Evidence and Recommendations for Research. Washington, DC: The National Academies Press; 2017.',
    url: 'https://nap.nationalacademies.org/catalog/24625/the-health-effects-of-cannabis-and-cannabinoids-the-current-state',
    summary: 'Authoritative U.S. consensus document on cannabis health effects — used as the umbrella reference for general claims about cannabis effects on mood, sleep, pain, and cognition.',
    claims: ['general cannabis effect claims', 'safety disclosures', 'evidence levels']
  },
  {
    id: 12,
    label: 'Project CBD — Plain-English Reference',
    citation: 'Project CBD. Educational nonprofit covering cannabinoid science and terpene profiles. Accessed 2026-04-30.',
    url: 'https://www.projectcbd.org/science/terpenes',
    summary: 'Plain-English summaries of terpene research, used as supplementary educational reading. Not the primary source for any in-app claim.',
    claims: ['supplementary reading only']
  }
];

// Helper: Get source by ID (used in SourcesScreen for jump-to-source).
export const getSourceById = (id) => SOURCES.find(s => s.id === id);

// Helper: All active sources (no TODO entries in production).
export const getActiveSources = () => SOURCES.filter(s => !s.citation.includes('[TODO'));

// Helper: Sources backing a specific claim label (for inline marker validation).
export const getSourcesForClaim = (claimLabel) =>
  SOURCES.filter(s => s.claims && s.claims.includes(claimLabel));
