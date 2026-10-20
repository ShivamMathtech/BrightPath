// Original demonstration curriculum. Replace/extend it from the Admin workspace.
export const courses = [
  {
    id: "math-foundations",
    title: "Mathematics, made simple",
    subject: "Mathematics",
    subtitle: "Build confidence, one equation at a time.",
    instructor: "Aisha Verma",
    level: "Beginner",
    color: "peach",
    art: "math",
    description:
      "A practical introduction to algebra, functions, and probability. Work through clear explanations and small examples before checking your knowledge.",
    lessons: [
      {
        title: "Thinking in equations",
        minutes: 8,
        content:
          "An equation is a statement that two expressions have the same value. Solving an equation means finding all values that make that statement true.\n\nThink of an equation as a balanced scale. Adding the same quantity to each side preserves that balance. Multiplying both sides by the same nonzero number also preserves it.\n\nWorked example: 3x + 5 = 20. Subtract 5 from each side to get 3x = 15. Divide each side by 3 to get x = 5. Substitute back: 3(5) + 5 = 20.\n\nWatch out: dividing by an expression containing a variable can remove solutions if that expression could equal zero. Check the domain before dividing.\n\nTry it yourself: solve 4x − 7 = 9. Add 7 to each side and divide by 4. The answer is x = 4.",
      },
      {
        title: "Functions and graphs",
        minutes: 10,
        content:
          "A function assigns exactly one output to each input in its domain. For f(x) = 2x + 1, the input 3 produces the output 7.\n\nA linear function has the form y = mx + b. The slope m measures how much y changes when x increases by one. The intercept b is the output when x = 0.\n\nPlot y = 2x + 1 using the points (0, 1), (1, 3), and (2, 5). They lie on the same straight line. A negative slope makes the line fall as you move right.\n\nA vertical line cannot be the graph of a function of x because one x-value would have multiple y-values. This is the vertical-line test.\n\nPractice: for f(x) = x², f(−2) = 4 and f(2) = 4. Different inputs may share an output; each input must still have only one output.",
      },
      {
        title: "A first look at probability",
        minutes: 9,
        content:
          "For a finite set of equally likely outcomes, the probability of an event is the number of favorable outcomes divided by the total number of outcomes.\n\nA fair six-sided die has six equally likely outcomes. The probability of an even number is 3/6 = 1/2. Probabilities are always between 0 and 1.\n\nThe complement rule says P(not A) = 1 − P(A). The probability of not rolling a six is 5/6.\n\nFor independent events, P(A and B) = P(A) × P(B). Two independent fair coin tosses both land heads with probability 1/4. Independence is an assumption you must check.\n\nPractice: a bag contains 3 blue and 2 red balls. The probability of a blue ball on the first random draw is 3/5. Without replacement, the probabilities change on the next draw.",
      },
    ],
  },
  {
    id: "living-planet",
    title: "Explore our living planet",
    subject: "Geography",
    subtitle: "A new perspective on the world around you.",
    instructor: "Daniel Hart",
    level: "Beginner",
    color: "mint",
    art: "earth",
    description:
      "Discover the processes that shape Earth, from rock formation to the water cycle. Learn to read the planet with curiosity and care.",
    lessons: [
      {
        title: "The story inside a rock",
        minutes: 7,
        content:
          "Rocks record how Earth changes. Geologists classify rocks by how they form: igneous, sedimentary, or metamorphic.\n\nIgneous rocks form when molten material cools. Slow cooling underground can produce large crystals, as in granite. Rapid cooling at the surface often creates smaller crystals.\n\nSedimentary rocks form when sediments accumulate and become compacted and cemented, or when minerals precipitate from water. Layers can preserve traces of past environments.\n\nMetamorphic rocks form when existing rocks change under heat and pressure without fully melting. Limestone can become marble.\n\nThe rock cycle has no single beginning. Weathering, erosion, burial, heating, melting, and cooling can transform one rock type into another over long time spans.",
      },
      {
        title: "Water on the move",
        minutes: 8,
        content:
          "The water cycle describes movement between oceans, the atmosphere, land, and living things. Solar energy and gravity drive much of this movement.\n\nEvaporation turns liquid water into water vapor. Transpiration releases water vapor from plants. Condensation creates liquid droplets when air cools sufficiently.\n\nPrecipitation falls as rain, snow, or other forms. Water may run over the surface, enter the soil through infiltration, or collect in lakes and rivers.\n\nGroundwater moves through pores and fractures below the surface. An aquifer is a geological formation capable of storing and transmitting usable amounts of groundwater.\n\nObserve a local puddle after rain. Its disappearance may involve evaporation and infiltration. The water has moved; it has not vanished.",
      },
      {
        title: "Reading a map",
        minutes: 6,
        content:
          "A useful map combines location with a purpose. It may show elevation, roads, rainfall, or population. A legend explains its symbols.\n\nLatitude measures angular distance north or south of the equator. Longitude measures angular distance east or west of the prime meridian.\n\nA scale of 1:50,000 means one unit on the map represents 50,000 of the same units on the ground. One centimeter therefore represents 500 meters.\n\nContour lines connect points of equal elevation. Closely spaced contours generally indicate a steep slope; widely spaced contours indicate a gentler slope.\n\nEvery flat map projection distorts some combination of area, shape, direction, or distance. Choose a map that suits your question.",
      },
    ],
  },
  {
    id: "physics-everyday",
    title: "The physics of everyday life",
    subject: "Physics",
    subtitle: "Turn everyday questions into discoveries.",
    instructor: "Maya Chen",
    level: "Beginner",
    color: "lavender",
    art: "physics",
    description:
      "Connect forces, energy, and waves to the world you experience every day. Includes an original offline animated wave lesson.",
    lessons: [
      {
        title: "Waves carry energy",
        minutes: 6,
        video: "/media/waves.mp4",
        content:
          "A wave is a disturbance that transfers energy. In many mechanical waves, matter oscillates around an equilibrium position while the disturbance travels.\n\nThe animation shows a transverse wave: the blue points move up and down while the wave pattern travels horizontally. It is a simplified model, not a measurement of a real material.\n\nAmplitude is the maximum displacement from equilibrium. Wavelength is the distance between equivalent points on successive cycles, such as neighboring crests.\n\nFrequency counts cycles per second, measured in hertz (Hz). Wave speed v, frequency f, and wavelength λ are related by v = fλ.\n\nExample: a wave with frequency 2 Hz and wavelength 3 m travels at 6 m/s. Changing frequency does not always change wave speed; in a given medium, wavelength may change instead.",
      },
      {
        title: "Forces and motion",
        minutes: 9,
        content:
          "A force is an interaction that can change an object’s motion. The net force is the vector sum of all forces acting on an object.\n\nNewton’s first law says that an object maintains constant velocity when the net external force is zero. Constant velocity includes remaining at rest.\n\nNewton’s second law, F = ma, relates net force, mass, and acceleration for constant mass. A 2 kg object under a 6 N net force accelerates at 3 m/s².\n\nNewton’s third law pairs equal and opposite forces on different objects. When your foot pushes the ground backward, the ground pushes your foot forward.\n\nDraw a free-body diagram before calculating. Include only forces acting on the object you selected; do not mix action and reaction forces from different objects.",
      },
      {
        title: "Energy changes form",
        minutes: 8,
        content:
          "Energy is a quantity that can be transferred or transformed. In an isolated system, total energy is conserved.\n\nKinetic energy for an object moving slowly compared with light is K = ½mv². Doubling speed increases kinetic energy by a factor of four.\n\nNear Earth’s surface, a change in gravitational potential energy is approximately ΔU = mgΔh. Lifting a book transfers energy into the book–Earth system.\n\nFriction can transform organized mechanical energy into thermal energy. Mechanical energy may decrease while the total energy remains conserved.\n\nPractice: a 1 kg object moving at 4 m/s has kinetic energy 8 J. If it stops through friction, that energy is transferred to the surroundings.",
      },
    ],
  },
  {
    id: "biology-basics",
    title: "Small cells. Big discoveries.",
    subject: "Biology",
    subtitle: "Understand the building blocks of life.",
    instructor: "Sofia Patel",
    level: "Beginner",
    color: "rose",
    art: "biology",
    description:
      "Meet cells, DNA, and ecosystems through approachable lessons that connect microscopic processes with living systems.",
    lessons: [
      {
        title: "Inside a living cell",
        minutes: 8,
        content:
          "Cells are the basic structural and functional units of life. All cells have a membrane, genetic material, cytoplasm, and ribosomes.\n\nProkaryotic cells lack a membrane-bound nucleus. Eukaryotic cells have a nucleus and other membrane-bound organelles.\n\nThe cell membrane controls movement of substances and participates in communication. The cytoplasm contains the fluid and structures where many reactions occur.\n\nMitochondria help eukaryotic cells release usable energy from nutrients. Plant cells also contain chloroplasts that carry out photosynthesis.\n\nCells specialize. A nerve cell’s long extensions help transmit signals, while a red blood cell’s shape supports gas transport. Structure and function are closely related.",
      },
      {
        title: "DNA and inheritance",
        minutes: 10,
        content:
          "DNA stores biological information in sequences of nucleotides. Its bases are adenine, thymine, cytosine, and guanine, abbreviated A, T, C, and G.\n\nIn a DNA double helix, A pairs with T and C pairs with G. Complementary pairing helps cells copy genetic information.\n\nA gene is a DNA region that contributes to a functional product. Many genes contain instructions used to make proteins through transcription and translation.\n\nAlleles are different versions of a gene. An organism’s traits can reflect interactions among many genes and the environment; not every trait follows a simple dominant–recessive pattern.\n\nMutations are changes in DNA sequence. Their effects depend on context and may be harmful, neutral, or beneficial.",
      },
      {
        title: "Connections in an ecosystem",
        minutes: 7,
        content:
          "An ecosystem includes organisms and the nonliving environment with which they interact. Energy flows through ecosystems while matter cycles.\n\nProducers such as plants convert light energy into chemical energy. Consumers obtain energy by eating other organisms. Decomposers break down dead material and return nutrients.\n\nA food web connects many feeding relationships. Removing one species can affect other populations through direct and indirect interactions.\n\nBiodiversity includes variation within species, among species, and across ecosystems. Habitat loss and pollution can reduce it.\n\nObserve a small garden: sunlight, soil, water, plants, insects, and microbes all interact. Even a small space can illustrate a complex ecosystem.",
      },
    ],
  },
  {
    id: "chemistry-lab",
    title: "A little chemistry, everywhere",
    subject: "Chemistry",
    subtitle: "Get to know the matter that makes our world.",
    instructor: "Arjun Rao",
    level: "Beginner",
    color: "yellow",
    art: "chemistry",
    description:
      "Explore atomic structure, bonding, and balanced reactions with guided examples and a short knowledge check.",
    lessons: [
      {
        title: "Atoms and elements",
        minutes: 8,
        content:
          "An atom contains a nucleus of protons and neutrons, surrounded by electrons. Protons have positive charge, electrons negative charge, and neutrons no net electric charge.\n\nThe number of protons defines the element. Carbon atoms always have six protons. Isotopes of an element differ in neutron number.\n\nA neutral atom has equal numbers of protons and electrons. Gaining or losing electrons produces an ion.\n\nThe periodic table organizes elements by atomic number. Similar chemical behavior often appears within a group because of related valence-electron arrangements.\n\nTry it: a neutral sodium atom has 11 protons and 11 electrons. A sodium ion with charge +1 has 10 electrons.",
      },
      {
        title: "Why atoms bond",
        minutes: 9,
        content:
          "Chemical bonds arise from interactions involving electrons and nuclei. Bonding often produces a lower-energy arrangement than separated atoms.\n\nIn a covalent bond, atoms share electron density. A water molecule has oxygen covalently bonded to two hydrogen atoms.\n\nIonic solids contain oppositely charged ions held together by electrostatic attraction. Sodium chloride forms a lattice rather than isolated NaCl molecules in the solid.\n\nMetallic bonding involves mobile electrons associated with many metal atoms. This helps explain electrical conductivity.\n\nBond type influences properties, but real bonds can fall along a continuum. Use electronegativity and molecular structure together when reasoning about a substance.",
      },
      {
        title: "Balancing reactions",
        minutes: 9,
        content:
          "A chemical equation represents a reaction. A balanced equation conserves the number of atoms of each element.\n\nFor hydrogen and oxygen forming water, start with H₂ + O₂ → H₂O. Oxygen is unbalanced.\n\nPlace a coefficient 2 before water: H₂ + O₂ → 2H₂O. Now hydrogen is unbalanced, so place 2 before hydrogen: 2H₂ + O₂ → 2H₂O.\n\nChange coefficients, never subscripts, when balancing a specified reaction. Changing H₂O to H₂O₂ would change the substance.\n\nThe coefficients describe ratios of particles or moles. They do not directly give equal mass ratios.",
      },
    ],
  },
  {
    id: "code-first-steps",
    title: "Your first steps into code",
    subject: "Computer Science",
    subtitle: "Learn to think like a problem solver.",
    instructor: "Alex Morgan",
    level: "Beginner",
    color: "sky",
    art: "code",
    description:
      "Develop the foundations of programming with variables, decisions, loops, and simple algorithms. No previous experience needed.",
    lessons: [
      {
        title: "Variables and values",
        minutes: 7,
        content:
          'A variable is a name associated with a value. Programs use variables to keep track of data as instructions execute.\n\nIn JavaScript, let score = 10 creates a variable. score = score + 5 updates it to 15. const is used for bindings that will not be reassigned.\n\nCommon values include numbers, strings, booleans, arrays, and objects. The string "10" and the number 10 are different values.\n\nDescriptive names make programs easier to understand. Use completedLessons instead of a vague name like x when the meaning matters.\n\nPractice: if let count = 3 and then count = count * 2, the value becomes 6. Read the expression on the right before updating the name on the left.',
      },
      {
        title: "Decisions and repetition",
        minutes: 9,
        content:
          'Conditionals allow a program to choose an action. An if statement executes its body when its condition evaluates to true.\n\nFor example: if (score >= 50) { status = "passed"; } else { status = "keep practicing"; }.\n\nLoops repeat instructions. A for loop can visit every item in a collection, while a while loop continues until its condition is false.\n\nA loop must make progress toward termination unless it is intentionally continuous. Forgetting to update a loop counter can cause an infinite loop.\n\nPractice: summing 1 + 2 + 3 + 4 with a loop yields 10. Track a total and add each number once.',
      },
      {
        title: "A recipe for an algorithm",
        minutes: 10,
        content:
          "An algorithm is a precise sequence of steps for solving a problem. Start by stating the inputs, expected output, and constraints.\n\nLinear search checks items one at a time until it finds a match or reaches the end. Searching a list of n items may require n comparisons.\n\nBinary search repeatedly halves a sorted search interval. It requires sorted data and takes logarithmically many comparisons.\n\nCorrectness comes before cleverness. Test empty input, a one-item list, missing values, and values at the boundaries.\n\nPractice: to find the largest item in a nonempty list, initialize a candidate with the first item, compare each remaining item, and update the candidate whenever a larger value appears.",
      },
    ],
  },
];
const q = (prompt, options, correct, explanation) => ({
  prompt,
  options,
  correct,
  explanation,
});
export const exams = [
  {
    id: "math-check",
    course: "math-foundations",
    title: "Mathematics essentials",
    subject: "Mathematics",
    minutes: 10,
    questions: [
      q(
        "Solve 3x + 5 = 20.",
        ["3", "5", "7", "15"],
        1,
        "Subtract 5 to get 3x = 15, then divide by 3.",
      ),
      q(
        "What is the slope of y = 2x + 1?",
        ["1", "2", "0", "3"],
        1,
        "The coefficient of x is the slope of a linear function.",
      ),
      q(
        "A fair die is rolled once. What is the probability of an even result?",
        ["1/6", "1/3", "1/2", "2/3"],
        2,
        "The even results are 2, 4, and 6: three of six outcomes.",
      ),
      q(
        "If f(x) = x², what is f(−3)?",
        ["−9", "6", "9", "−6"],
        2,
        "Multiplying two negative numbers produces a positive number.",
      ),
      q(
        "What is the chance of two heads in two independent fair coin tosses?",
        ["1/2", "1/4", "3/4", "1"],
        1,
        "Multiply 1/2 by 1/2 for independent events.",
      ),
    ],
  },
  {
    id: "earth-check",
    course: "living-planet",
    title: "Our planet, explained",
    subject: "Geography",
    minutes: 10,
    questions: [
      q(
        "Which rock type forms when molten material cools?",
        ["Sedimentary", "Metamorphic", "Igneous", "All rocks form this way"],
        2,
        "Igneous rock forms by cooling and solidification of magma or lava.",
      ),
      q(
        "What is the change from water vapor to liquid called?",
        ["Evaporation", "Condensation", "Infiltration", "Transpiration"],
        1,
        "Condensation produces liquid droplets from vapor.",
      ),
      q(
        "Latitude measures angular distance from the…",
        ["Prime meridian", "North Pole", "Equator", "International Date Line"],
        2,
        "Latitude is measured north or south of the equator.",
      ),
      q(
        "On a 1:50,000 map, 1 cm represents…",
        ["50 m", "500 m", "5 km", "50 km"],
        1,
        "50,000 centimeters equals 500 meters.",
      ),
      q(
        "Closely spaced contour lines usually indicate…",
        [
          "Flat land",
          "A steep slope",
          "An ocean current",
          "A political boundary",
        ],
        1,
        "Elevation changes rapidly over a small horizontal distance.",
      ),
    ],
  },
  {
    id: "physics-check",
    course: "physics-everyday",
    title: "Forces, energy & waves",
    subject: "Physics",
    minutes: 10,
    questions: [
      q(
        "A 2 kg object experiences a net force of 6 N. Its acceleration is…",
        ["12 m/s²", "6 m/s²", "3 m/s²", "0.33 m/s²"],
        2,
        "Use a = F/m = 6/2 = 3 m/s².",
      ),
      q(
        "A wave has frequency 2 Hz and wavelength 3 m. Its speed is…",
        ["1.5 m/s", "5 m/s", "6 m/s", "0.67 m/s"],
        2,
        "Wave speed v = fλ = 2 × 3.",
      ),
      q(
        "Doubling speed changes kinetic energy by a factor of…",
        ["2", "4", "1/2", "8"],
        1,
        "Kinetic energy is proportional to speed squared.",
      ),
      q(
        "The unit of frequency is…",
        ["Joule", "Newton", "Hertz", "Watt"],
        2,
        "One hertz means one cycle per second.",
      ),
      q(
        "Newton’s third-law force pair acts on…",
        [
          "The same object",
          "Different objects",
          "Only stationary objects",
          "Only objects in space",
        ],
        1,
        "Action and reaction forces act on different interacting objects.",
      ),
    ],
  },
  {
    id: "bio-check",
    course: "biology-basics",
    title: "Life at every scale",
    subject: "Biology",
    minutes: 10,
    questions: [
      q(
        "Which structure is present in all cells?",
        ["Nucleus", "Chloroplast", "Cell membrane", "Mitochondrion"],
        2,
        "All cells have a membrane; not all have membrane-bound organelles.",
      ),
      q(
        "In DNA, adenine pairs with…",
        ["Cytosine", "Thymine", "Guanine", "Adenine"],
        1,
        "The complementary base pairs are A–T and C–G.",
      ),
      q(
        "Which organisms return nutrients by breaking down dead material?",
        ["Only producers", "Decomposers", "Only predators", "Only herbivores"],
        1,
        "Decomposers break down dead organic material.",
      ),
      q(
        "Photosynthesis in plants takes place in…",
        ["Mitochondria", "Ribosomes", "Chloroplasts", "The cell wall"],
        2,
        "Chloroplasts capture light energy for photosynthesis.",
      ),
      q(
        "A change in a DNA sequence is called a…",
        ["Mutation", "Habitat", "Food web", "Tissue"],
        0,
        "Mutations are changes in genetic sequence.",
      ),
    ],
  },
  {
    id: "chem-check",
    course: "chemistry-lab",
    title: "Atoms to reactions",
    subject: "Chemistry",
    minutes: 10,
    questions: [
      q(
        "The identity of an element is determined by its number of…",
        ["Neutrons", "Protons", "Electron shells", "Bonds"],
        1,
        "Atomic number is the number of protons.",
      ),
      q(
        "A neutral atom with 11 protons has how many electrons?",
        ["10", "11", "12", "22"],
        1,
        "A neutral atom has equal positive and negative charges.",
      ),
      q(
        "A covalent bond involves…",
        [
          "Shared electron density",
          "Only neutrons",
          "Only gravity",
          "No electrons",
        ],
        0,
        "Covalent bonding involves shared electron density between atoms.",
      ),
      q(
        "Which equation is balanced?",
        [
          "H₂ + O₂ → H₂O",
          "2H₂ + O₂ → 2H₂O",
          "H₂ + 2O₂ → H₂O",
          "H₂ + O₂ → 2H₂O",
        ],
        1,
        "There are four hydrogen and two oxygen atoms on both sides.",
      ),
      q(
        "Isotopes of the same element differ in the number of…",
        ["Protons", "Neutrons", "Elements", "Nuclei per atom"],
        1,
        "Isotopes share proton number but differ in neutron number.",
      ),
    ],
  },
  {
    id: "code-check",
    course: "code-first-steps",
    title: "Programming foundations",
    subject: "Computer Science",
    minutes: 10,
    questions: [
      q(
        "After let count = 3; count = count * 2; count equals…",
        ["3", "5", "6", "9"],
        2,
        "The current value 3 is multiplied by 2 and reassigned.",
      ),
      q(
        "Which data condition does binary search require?",
        [
          "Random order",
          "Sorted order",
          "Only negative values",
          "No duplicate values",
        ],
        1,
        "Binary search relies on sorted data to discard half the search interval.",
      ),
      q(
        "A boolean normally represents…",
        ["True or false", "Only strings", "A list of numbers", "A file"],
        0,
        "Boolean values represent true and false.",
      ),
      q(
        "Linear search of n items may need how many comparisons?",
        ["Always 1", "At most n", "Always n²", "Always 0"],
        1,
        "If the item is absent or last, every item must be checked.",
      ),
      q(
        "Which is a useful boundary test for a list-processing function?",
        [
          "Only a huge random list",
          "An empty list",
          "Only positive numbers",
          "No tests are useful",
        ],
        1,
        "Empty input exposes missing assumptions and boundary handling.",
      ),
    ],
  },
];
export const universities = [
  {
    id: "northbridge",
    name: "Northbridge University",
    country: "United Kingdom",
    city: "London",
    lat: 51.5074,
    lng: -0.1278,
    field: "Science & Technology",
    tuition: "£12,000–18,000 / year",
    description:
      "A fictional multidisciplinary campus with collaborative laboratories, student societies, and an emphasis on project-based study.",
    art: "campus",
    programs: ["Computer Science", "Mathematics", "Physics"],
  },
  {
    id: "cedar",
    name: "Cedar Valley Institute",
    country: "India",
    city: "Dehradun",
    lat: 30.3165,
    lng: 78.0322,
    field: "Engineering",
    tuition: "₹90,000–1,60,000 / year",
    description:
      "A fictional engineering institute surrounded by green hills, with hands-on workshops and a community-centered learning approach.",
    art: "campus",
    programs: ["Computer Science", "Engineering", "Applied Mathematics"],
  },
  {
    id: "cendekia",
    name: "Cendekia University",
    country: "Indonesia",
    city: "Yogyakarta",
    lat: -7.7956,
    lng: 110.3695,
    field: "Life Sciences",
    tuition: "Rp 15–25 million / year",
    description:
      "A fictional university offering environmental science, biology, and interdisciplinary undergraduate study.",
    art: "campus",
    programs: ["Biology", "Geography", "Environmental Science"],
  },
  {
    id: "harbor",
    name: "Harbor School of Science",
    country: "Australia",
    city: "Sydney",
    lat: -33.8688,
    lng: 151.2093,
    field: "Science & Technology",
    tuition: "A$20,000–28,000 / year",
    description:
      "A fictional coastal institution focused on scientific inquiry, research skills, and student-led projects.",
    art: "campus",
    programs: ["Chemistry", "Physics", "Computer Science"],
  },
];
