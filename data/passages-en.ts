import type { Passage } from "./passages-ko"

const passagesEn: Passage[] = [
  {
    level: "BR",
    title: "My Family",
    text: "I have a {{0}}. I have a mom, a dad, and a little brother. We live {{1}}. We are {{2}}.",
    blanks: [
      { word: "family", options: ["family", "friend", "teacher", "neighbor"] },
      { word: "together", options: ["together", "alone", "far", "sometimes"] },
      { word: "happy", options: ["happy", "sad", "angry", "tired"] },
    ],
  },
  {
    level: "100",
    title: "School Life",
    text: "I go to school {{0}} day. I {{1}} with my friends at school. The teacher {{2}} us many things. During {{3}} time, I eat with my friends.",
    blanks: [
      { word: "every", options: ["every", "some", "never", "always"] },
      { word: "study", options: ["study", "play", "fight", "sleep"] },
      { word: "teaches", options: ["teaches", "shows", "tells", "hears"] },
      { word: "lunch", options: ["lunch", "snack", "candy", "drink"] },
    ],
  },
  {
    level: "200",
    title: "My Hobbies",
    text: "On weekends, I {{0}} various hobby activities. I like reading books or listening to music. Sometimes I ride my {{1}} in the park. Hobbies help me {{2}} stress.",
    blanks: [
      { word: "enjoy", options: ["enjoy", "dislike", "avoid", "ignore"] },
      { word: "bicycle", options: ["bicycle", "car", "train", "airplane"] },
      { word: "reduce", options: ["reduce", "increase", "maintain", "cause"] },
    ],
  },
  {
    level: "300",
    title: "Healthy Living",
    text: "For a healthy life, {{0}} meals and {{1}} exercise are important. It is good to {{2}} plenty of fresh fruits and vegetables, and exercise for at least 30 minutes every day. Also, sufficient sleep is {{3}} for physical and mental health.",
    blanks: [
      { word: "balanced", options: ["balanced", "nutritious", "caloric", "tasty"] },
      { word: "regular", options: ["regular", "intense", "intermittent", "professional"] },
      { word: "eat", options: ["eat", "cook", "sell", "grow"] },
      { word: "essential", options: ["essential", "unnecessary", "dangerous", "expensive"] },
    ],
  },
  {
    level: "400",
    title: "Environmental Protection",
    text: "Environmental protection is everyone's {{0}}. Global warming and pollution have become {{1}} problems. We can protect the environment by {{2}} energy, reducing waste, and {{3}} recycling. Small actions can make a big difference.",
    blanks: [
      { word: "responsibility", options: ["responsibility", "right", "privilege", "duty"] },
      { word: "serious", options: ["serious", "minor", "temporary", "interesting"] },
      { word: "saving", options: ["saving", "wasting", "producing", "selling"] },
      { word: "practicing", options: ["practicing", "ignoring", "researching", "observing"] },
    ],
  },
  {
    level: "500",
    title: "The Impact of the Internet",
    text: "The Internet has a {{0}} impact on modern society. Information {{1}} has improved, and communication with people around the world has become {{2}}. However, there are also {{3}} aspects such as personal information leaks and cybercrime. Therefore, caution and {{4}} are needed when using the Internet.",
    blanks: [
      { word: "profound", options: ["profound", "minimal", "temporary", "partial"] },
      { word: "accessibility", options: ["accessibility", "reliability", "stability", "diversity"] },
      { word: "easier", options: ["easier", "harder", "impossible", "limited"] },
      { word: "negative", options: ["negative", "positive", "neutral", "scientific"] },
      { word: "responsibility", options: ["responsibility", "passion", "patience", "creativity"] },
    ],
  },
  {
    level: "600",
    title: "Cultural Diversity",
    text: "Cultural diversity is humanity's {{0}} heritage. Each culture has its {{1}} language, art, food, and traditions, and this diversity enriches our lives. Understanding and {{2}} other cultures is an important {{3}} in global society. Cultural exchange can {{4}} new ideas and innovation.",
    blanks: [
      { word: "rich", options: ["rich", "dangerous", "simple", "unnecessary"] },
      { word: "unique", options: ["unique", "common", "temporary", "external"] },
      { word: "respecting", options: ["respecting", "ignoring", "rejecting", "criticizing"] },
      { word: "value", options: ["value", "problem", "error", "limitation"] },
      { word: "promote", options: ["promote", "hinder", "stop", "reject"] },
    ],
  },
  {
    level: "700",
    title: "The Development of Artificial Intelligence",
    text: "Artificial intelligence technology is developing {{0}} and bringing {{1}} changes to our daily lives and industries. Amazing {{2}} is being made in fields such as natural language processing, computer vision, and machine learning. These technologies are being {{3}} in various fields such as medicine, education, and transportation to increase efficiency and open new {{4}}.",
    blanks: [
      { word: "rapidly", options: ["rapidly", "gradually", "intermittently", "partially"] },
      { word: "revolutionary", options: ["revolutionary", "minimal", "temporary", "negative"] },
      { word: "progress", options: ["progress", "regression", "stagnation", "confusion"] },
      { word: "used", options: ["used", "limited", "prohibited", "ignored"] },
      { word: "possibilities", options: ["possibilities", "risks", "uncertainties", "complexities"] },
    ],
  },
  {
    level: "800",
    title: "Climate Change and Response",
    text: "Climate change is one of the most serious environmental problems {{0}} humanity in the 21st century. Global warming due to increased {{1}} gas emissions is {{2}} various negative effects such as sea level rise, extreme weather events, and ecosystem destruction. To respond to this crisis, the international community is pursuing {{3}} development and setting greenhouse gas reduction targets through {{4}} agreements such as the Paris Agreement.",
    blanks: [
      { word: "facing", options: ["facing", "avoiding", "solving", "ignoring"] },
      { word: "greenhouse", options: ["greenhouse", "oxygen", "nitrogen", "hydrogen"] },
      { word: "causing", options: ["causing", "reducing", "preventing", "neutralizing"] },
      { word: "sustainable", options: ["sustainable", "short-term", "inefficient", "unstable"] },
      { word: "multilateral", options: ["multilateral", "unilateral", "personal", "temporary"] },
    ],
  },
  {
    level: "900",
    title: "The Development of Modern Medicine",
    text: "Modern medicine has made remarkable progress over the past century. {{0}} in antibiotics, vaccines, and surgical techniques have made it possible to treat or {{1}} many diseases. In particular, the development of genomics and precision medicine is enabling {{2}} treatment tailored to individual genetic characteristics. Advanced medical devices and telemedicine systems have also greatly improved the {{3}} and efficiency of medical services. However, despite these advances, healthcare inequality and ethical issues remain important {{4}}.",
    blanks: [
      { word: "innovations", options: ["innovations", "failures", "interruptions", "reductions"] },
      { word: "prevent", options: ["prevent", "worsen", "ignore", "spread"] },
      { word: "personalized", options: ["personalized", "standardized", "temporary", "experimental"] },
      { word: "accessibility", options: ["accessibility", "cost", "complexity", "risk"] },
      { word: "challenges", options: ["challenges", "achievements", "benefits", "solutions"] },
    ],
  },
  {
    level: "1000",
    title: "Global Economy and Inequality",
    text: "Globalization has brought {{0}} changes to the world economy. The increase in international trade and investment has {{1}} economic growth in many countries, but at the same time has {{2}} inequality between and within countries. As multinational corporations in developed countries {{3}} low-wage labor in developing countries, job displacement and wage gap issues are occurring. Additionally, the integration of financial markets has increased economic {{4}} and created an environment where financial crises can spread rapidly around the world. International cooperation and {{5}} growth policies are needed to address these issues.",
    blanks: [
      { word: "significant", options: ["significant", "minimal", "temporary", "negative"] },
      { word: "promoted", options: ["promoted", "hindered", "stopped", "ignored"] },
      { word: "deepened", options: ["deepened", "resolved", "ignored", "analyzed"] },
      { word: "utilize", options: ["utilize", "protect", "educate", "respect"] },
      { word: "instability", options: ["instability", "stability", "predictability", "transparency"] },
      { word: "inclusive", options: ["inclusive", "exclusive", "temporary", "theoretical"] },
    ],
  },
  {
    level: "1100",
    title: "Principles of Quantum Physics",
    text: "Quantum physics is a theoretical framework that explains physical phenomena in the {{0}} world. Unlike classical physics, in quantum mechanics, particles have {{1}}-like properties, and Heisenberg's {{2}} principle applies, which states that the position and momentum of a particle cannot be measured simultaneously with perfect accuracy. The Schrodinger equation {{3}} how quantum systems change over time and predicts {{4}} phenomena such as quantum superposition and entanglement. These principles of quantum mechanics have become the foundation of modern technological development, enabling various {{5}} technologies such as lasers, transistors, and magnetic resonance imaging (MRI).",
    blanks: [
      { word: "microscopic", options: ["microscopic", "macroscopic", "theoretical", "practical"] },
      { word: "wave", options: ["wave", "mass", "energy", "velocity"] },
      { word: "uncertainty", options: ["uncertainty", "relativity", "causality", "continuity"] },
      { word: "describes", options: ["describes", "denies", "simplifies", "exaggerates"] },
      { word: "non-intuitive", options: ["non-intuitive", "intuitive", "logical", "systematic"] },
      { word: "innovative", options: ["innovative", "traditional", "temporary", "inefficient"] },
    ],
  },
  {
    level: "1200",
    title: "The Development of Philosophical Epistemology",
    text: "Epistemology is a philosophical {{0}} into the nature, scope, and limits of knowledge. Beginning with Plato and Aristotle in ancient Greece, epistemology has addressed {{1}} questions about how humans understand the world and acquire knowledge. Descartes' {{2}} in the 17th century emphasized the pursuit of certain knowledge through reason, while in response, Locke and Hume's {{3}} argued that all knowledge derives from sensory experience. Kant synthesized these two perspectives by presenting transcendental idealism, which suggests that human cognition is formed through the interaction of {{4}} categories and empirical intuition. In modern times, epistemology continues to explore the nature of knowledge, {{5}} with philosophy of language, cognitive science, and artificial intelligence research.",
    blanks: [
      { word: "inquiry", options: ["inquiry", "rejection", "avoidance", "distortion"] },
      { word: "fundamental", options: ["fundamental", "superficial", "temporary", "secondary"] },
      { word: "rationalism", options: ["rationalism", "mysticism", "nihilism", "relativism"] },
      { word: "empiricism", options: ["empiricism", "idealism", "dogmatism", "skepticism"] },
      { word: "a priori", options: ["a priori", "empirical", "intuitive", "analytical"] },
      { word: "intersecting", options: ["intersecting", "separating", "opposing", "stagnating"] },
    ],
  },
]

export default passagesEn
