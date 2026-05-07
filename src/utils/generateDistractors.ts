import { Term } from '../types';

const manualDistractors: Record<string, string[]> = {
  '2FA': ['Two-Form Authentication', 'Two-Factor Authorization', 'Two-Field Authentication'],
  ADSL: ['Asymmetric Data Subscriber Line', 'Adaptive Digital Subscriber Line', 'Asymmetric Digital Service Line'],
  AI: ['Automated Intelligence', 'Adaptive Intelligence', 'Algorithmic Intelligence'],
  ALU: ['Arithmetic Logic Utility', 'Algorithmic Logic Unit', 'Arithmetic Layer Unit'],
  ANN: ['Adaptive Neural Network', 'Artificial Node Network', 'Automated Neural Network'],
  AR: ['Adaptive Reality', 'Augmented Rendering', 'Applied Reality'],
  ASCII: [
    'American Standard Code for Internet Interchange',
    'Automatic Standard Code for Information Interchange',
    'American System Code for Information Integration',
  ],
  BASIC: [
    "Beginner's Automatic Symbolic Instruction Code",
    "Basic All-purpose Symbolic Instruction Code",
    "Beginner's All-purpose System Instruction Code",
  ],
  BIOS: ['Basic Internal Operating System', 'Binary Input Output System', 'Basic Interface Operating System'],
  CAPTCHA: [
    'Completely Automated Public Turing check to tell Computers and Humans Apart',
    'Completely Automatic Public Turing test to track Computers and Humans Apart',
    'Computer Automated Public Turing test to tell Computers and Humans Apart',
  ],
  CLI: ['Command Level Interface', 'Control Line Interface', 'Command Link Interface'],
  CNN: ['Convolutional Node Network', 'Connected Neural Network', 'Convolutional Network Node'],
  CPU: ['Core Processing Unit', 'Central Program Unit', 'Computer Processing Unit'],
  CSS: ['Cascading System Sheets', 'Creative Style Sheets', 'Cascading Style Syntax'],
  DDoS: ['Distributed Disruption of Service', 'Direct Denial of Service', 'Distributed Denial of Systems'],
  DNS: ['Digital Name System', 'Domain Network Service', 'Distributed Naming System'],
  DRAM: ['Dynamic Read Access Memory', 'Direct Random Access Memory', 'Dynamic Runtime Access Memory'],
  EEPROM: [
    'Electrically Erasable Programmable Runtime Memory',
    'Electronically Erasable Programmable Read-Only Memory',
    'Electrically Enabled Programmable Read-Only Memory',
  ],
  ENIAC: [
    'Electronic Numerical Integrator and Calculator',
    'Electronic Network Integrator and Computer',
    'Electronic Numerical Interpreter and Computer',
  ],
  EPROM: ['Erasable Programmable Runtime Memory', 'Extended Programmable Read-Only Memory', 'Erasable Program Read-Only Memory'],
  FORTRAN: ['FORmula TRANsfer', 'FORmat TRANslator', 'FORmula TRANscription'],
  FTP: ['File Transport Protocol', 'Fast Transfer Protocol', 'File Transmission Process'],
  GUI: ['General User Interface', 'Graphical Utility Interface', 'Generated User Interface'],
  HDD: ['Hard Data Drive', 'Hybrid Disk Drive', 'High Density Drive'],
  HLAI: ['Human-Level Adaptive Intelligence', 'Human-Like Automated Intelligence', 'Hybrid-Level Artificial Intelligence'],
  HTML: ['Hyper Text Modeling Language', 'High Text Markup Language', 'Hyper Transfer Markup Language'],
  HTTP: ['Hyper Text Transport Protocol', 'Hyper Transfer Text Protocol', 'Host Text Transfer Protocol'],
  ICANN: [
    'Internet Corporation for Assigned Networks and Numbers',
    'Internet Committee for Assigned Names and Numbers',
    'International Corporation for Assigned Names and Numbers',
  ],
  IoT: ['Internet of Terminals', 'Integrated Internet of Things', 'Internet of Technology'],
  IR: ['Instruction Recorder', 'Internal Register', 'Index Register'],
  ISP: ['Internet System Provider', 'Integrated Service Provider', 'Internet Support Provider'],
  JVM: ['Java Visual Machine', 'Joint Virtual Machine', 'Java Variable Module'],
  LAN: ['Local Access Network', 'Linked Area Network', 'Local Application Network'],
  'MAC-address': ['Machine Access Control address', 'Media Address Control address', 'Managed Access Control address'],
  MFA: ['Multi-Field Authentication', 'Multi-Factor Authorization', 'Multi-Form Authentication'],
  ML: ['Model Learning', 'Machine Logic', 'Modular Learning'],
  'NAND-Flash': ['Not Array NAND Flash', 'Native AND Flash', 'Not AND Frame'],
  NN: ['Node Networks', 'Neural Nodes', 'Networked Neurons'],
  'NOR-Flash': ['Not Ordered Flash', 'Native OR Flash', 'Not OR Frame'],
  OOP: ['Object-Oriented Process', 'Operation-Oriented Programming', 'Object-Ordered Programming'],
  OS: ['Operating Service', 'Online System', 'Operational Software'],
  OSI: ['Open Service Interconnection', 'Operating System Integration', 'Open Systems Interface'],
  PAN: ['Private Area Network', 'Personal Access Network', 'Portable Area Network'],
  'PC-personal': ['Personal Console', 'Program Computer', 'Portable Computer'],
  'PC-counter': ['Program Control', 'Process Counter', 'Pointer Counter'],
  PHP: ['Personal Hypertext Processor', 'Programmed Hypertext Preprocessor', 'Hypertext Processing Platform'],
  PROM: ['Programmable Runtime Memory', 'Programmed Read-Only Memory', 'Programmable Read-Once Memory'],
  RAM: ['Rapid Access Memory', 'Random Allocation Memory', 'Read Access Memory'],
  RNN: ['Recursive Neural Network', 'Recurrent Network Node', 'Runtime Neural Network'],
  ROM: ['Read-Once Memory', 'Runtime Object Memory', 'Read-Optimized Memory'],
  SDRAM: ['Synchronous Direct Random Access Memory', 'Static Dynamic Random Access Memory', 'Synchronous Data Random Access Memory'],
  SEO: ['Search Engine Operation', 'Search Experience Optimization', 'System Engine Optimization'],
  SMTP: ['Simple Message Transfer Protocol', 'Secure Mail Transfer Protocol', 'System Mail Transport Protocol'],
  SQL: ['Structured Question Language', 'System Query Language', 'Sequential Query Language'],
  SRAM: ['Static Read Access Memory', 'Synchronous Random Access Memory', 'Static Runtime Access Memory'],
  SSD: ['Solid Storage Drive', 'Static State Drive', 'Secure Storage Device'],
  SSL: ['Secure Session Layer', 'Security Sockets Layer', 'Secure System Layer'],
  'TCP-IP': [
    'Transmission Control Process and Internet Protocol',
    'Transfer Control Protocol and Internet Process',
    'Transmission Channel Protocol and Internet Protocol',
  ],
  UDP: ['Unified Datagram Protocol', 'User Data Protocol', 'Universal Datagram Process'],
  URL: ['Uniform Resource Link', 'Universal Resource Locator', 'Uniform Reference Locator'],
  USB: ['Universal System Bus', 'Unified Serial Bus', 'Universal Storage Bus'],
  VR: ['Visual Reality', 'Virtual Rendering', 'Variable Reality'],
  WAF: ['Web Application Filter Firewall', 'Wide Application Firewall', 'Web Access Firewall'],
  WAN: ['Wide Access Network', 'Wireless Area Network', 'Wide Application Network'],
  'Wi-Fi': ['Wireless Fiber', 'Wide Fidelity', 'Wireless Finder'],
  WIMP: ['Windows Icons Modules Pointer', 'Windows Interface Menus Pointer', 'Windows Icons Menus Panel'],
  WLAN: ['Wireless Link Area Network', 'Wide Local Area Network', 'Wireless Local Access Network'],
  WWW: ['World Wide Window', 'Web Wide World', 'Wide World Web'],
  WYSIWYG: ['What You Sketch Is What You Get', 'What You See Is What You Generate', 'When You See It What You Get'],
};

const manualHints: Record<string, string> = {
  CPU: 'Central = главный, Processing = обработка, Unit = блок.',
  DNS: 'Name System: система имён доменов, не Network Service.',
  RAM: 'Random Access: произвольный доступ, не Read Access.',
  ROM: 'Read-Only: только чтение, не runtime.',
  RNN: 'Recurrent = повторяющаяся во времени, не Recursive.',
  SQL: 'Structured Query Language: язык структурированных запросов.',
  USB: 'Universal + Serial + Bus: универсальная последовательная шина.',
  SSL: 'Secure Sockets Layer: именно sockets, не session.',
  HTTP: 'Transfer Protocol: протокол передачи гипертекста.',
  HTML: 'Markup Language: язык разметки, не transfer.',
  AI: 'Artificial = искусственный, Intelligence = интеллект.',
  ML: 'Machine Learning: машина учится, не logic.',
  LAN: 'Local Area Network: локальная сеть в одной зоне.',
  WAN: 'Wide Area Network: сеть на большой территории.',
  WLAN: 'Wireless LAN: локальная сеть без провода.',
  PAN: 'Personal Area: сеть вокруг одного человека/устройства.',
  PC: 'Смотри на контекст: computer или program counter.',
};

const categoryLexicon: Record<string, Record<string, string[]>> = {
  Networking: {
    a: ['Access', 'Adaptive', 'Addressed', 'Area', 'Assigned', 'Asymmetric'],
    b: ['Bandwidth', 'Bit', 'Bridge', 'Broadband'],
    c: ['Channel', 'Control', 'Communication', 'Connection'],
    d: ['Digital', 'Domain', 'Distributed', 'Datagram', 'Dynamic'],
    f: ['Fast', 'File', 'Flow'],
    g: ['Global', 'Gateway', 'Graph'],
    i: ['Internet', 'Interface', 'Integrated', 'Interoperability'],
    l: ['Local', 'Link', 'Line'],
    m: ['Mail', 'Media', 'Metropolitan', 'Microwave', 'Multi'],
    n: ['Name', 'Network', 'Naming', 'Node'],
    p: ['Protocol', 'Provider', 'Packet', 'Personal', 'Public'],
    r: ['Routing', 'Resource', 'Remote'],
    s: ['Service', 'System', 'Subscriber', 'Serial', 'Secure', 'Simple', 'Symmetric'],
    t: ['Transfer', 'Transmission', 'Transport'],
    u: ['User', 'Universal', 'Uniform'],
    w: ['Wide', 'Wireless', 'Web', 'Worldwide'],
  },
  Hardware: {
    a: ['Access', 'Arithmetic', 'Automatic'],
    c: ['Central', 'Core', 'Control', 'Counter', 'Computer'],
    d: ['Dynamic', 'Data', 'Disk', 'Drive'],
    e: ['Erasable', 'Electronic', 'Electrically'],
    f: ['Floating', 'Flash'],
    g: ['Gate'],
    h: ['Hard', 'Hybrid'],
    i: ['Instruction', 'Input', 'Internal'],
    l: ['Logic', 'Layer', 'Liquid'],
    m: ['Memory', 'Masked', 'Media'],
    n: ['Node', 'Not', 'Network'],
    p: ['Program', 'Programmable', 'Processing', 'Pointer', 'Personal'],
    r: ['Random', 'Read', 'Runtime'],
    s: ['Static', 'State', 'Serial', 'Synchronous'],
    u: ['Unit', 'Utility', 'Universal'],
  },
  AI: {
    a: ['Artificial', 'Adaptive', 'Algorithmic', 'Automated'],
    c: ['Convolutional', 'Connected', 'Cognitive'],
    h: ['Human', 'Hybrid'],
    i: ['Intelligence', 'Inference'],
    l: ['Learning', 'Level', 'Logic', 'Like'],
    m: ['Machine', 'Model', 'Modular'],
    n: ['Neural', 'Network', 'Node', 'Navigator'],
    r: ['Recurrent', 'Recursive', 'Runtime', 'Reliable'],
  },
  Interfaces: {
    a: ['Augmented', 'Applied'],
    c: ['Command', 'Control'],
    g: ['Graphical', 'Generated', 'General'],
    i: ['Interface', 'Icons'],
    l: ['Line', 'Layout'],
    m: ['Menus', 'Modules'],
    p: ['Pointer', 'Panel'],
    u: ['User', 'Utility'],
    v: ['Virtual', 'Visual'],
    w: ['Windows', 'What'],
  },
  Web: {
    c: ['Cascading', 'Control', 'Content'],
    h: ['Hyper', 'Host', 'High'],
    i: ['Internet', 'Interface'],
    l: ['Language', 'Locator', 'Link'],
    m: ['Markup', 'Modeling', 'Mail'],
    n: ['Names', 'Network'],
    p: ['Protocol', 'Preprocessor', 'Processing'],
    q: ['Query', 'Question'],
    r: ['Resource', 'Reference'],
    s: ['Search', 'Structured', 'Style', 'Secure', 'Sockets', 'System'],
    t: ['Text', 'Transfer', 'Transport'],
    u: ['Uniform', 'Universal', 'User'],
    w: ['Web', 'World', 'Wide', 'What'],
  },
  Security: {
    a: ['Authentication', 'Authorization', 'Automated', 'Application'],
    c: ['Control', 'Computers', 'Check'],
    d: ['Denial', 'Distributed', 'Defense'],
    f: ['Factor', 'Field', 'Filter', 'Firewall'],
    h: ['Humans'],
    l: ['Layer'],
    m: ['Multi'],
    p: ['Protection', 'Public'],
    s: ['Secure', 'Security', 'Session', 'Sockets', 'System'],
    t: ['Test', 'Turing'],
    w: ['Web', 'Wide'],
  },
  Storage: {
    b: ['Blu-ray'],
    c: ['Compact'],
    d: ['Disc', 'Digital'],
    r: ['Recordable', 'Read-Only', 'Rewritable'],
    v: ['Versatile'],
  },
};

const genericLexicon: Record<string, string[]> = {
  a: ['Access', 'Adaptive', 'Artificial', 'Assigned'],
  b: ['Basic', 'Bit', 'Bus'],
  c: ['Central', 'Command', 'Control', 'Computer', 'Core'],
  d: ['Data', 'Digital', 'Distributed', 'Domain', 'Dynamic'],
  e: ['Electronic', 'Erasable', 'Engine'],
  f: ['Factor', 'File', 'Flash'],
  g: ['Graphical', 'Global', 'Gigabyte'],
  h: ['Hyper', 'Human', 'Hard'],
  i: ['Input', 'Internet', 'Instruction', 'Interface'],
  j: ['Java', 'Joint'],
  k: ['Kilo'],
  l: ['Local', 'Logic', 'Layer', 'Language'],
  m: ['Memory', 'Machine', 'Media', 'Mail', 'Multi'],
  n: ['Network', 'Neural', 'Name', 'Node'],
  o: ['Operating', 'Object', 'Only', 'Open'],
  p: ['Protocol', 'Processing', 'Program', 'Programmable', 'Personal'],
  q: ['Query'],
  r: ['Random', 'Read', 'Recurrent', 'Resource', 'Runtime'],
  s: ['System', 'Secure', 'Serial', 'Structured', 'Service', 'Style'],
  t: ['Transfer', 'Text', 'Technology', 'Threading', 'Two'],
  u: ['Unit', 'User', 'Universal', 'Uniform'],
  v: ['Virtual', 'Versatile', 'Very'],
  w: ['Wide', 'Wireless', 'World', 'Web', 'Windows'],
  y: ['Yet'],
};

const preserveCase = (original: string, replacement: string) => {
  if (original.toUpperCase() === original) {
    return replacement.toUpperCase();
  }

  if (original[0] && original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }

  return replacement.toLowerCase();
};

const splitWords = (answer: string) => answer.split(' ');

const getPrimaryAnswer = (term: Term) => {
  if (term.id === 'PC-personal') {
    return 'Personal Computer';
  }

  if (term.id === 'PC-counter') {
    return 'Program Counter';
  }

  return term.answers[0];
};

const getInitials = (answer: string) =>
  splitWords(answer).map((word) => word[0]?.toLowerCase() ?? '');

const uniqueList = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const buildCandidateWord = (term: Term, initial: string, originalWord: string) => {
  const categoryPool = categoryLexicon[term.category ?? '']?.[initial] ?? [];
  const genericPool = genericLexicon[initial] ?? [];
  const pool = uniqueList([...categoryPool, ...genericPool]).filter(
    (item) => item.toLowerCase() !== originalWord.toLowerCase(),
  );

  return pool.length > 0 ? preserveCase(originalWord, pool[0]) : null;
};

const buildPatternVariants = (term: Term, answer: string) => {
  const words = splitWords(answer);
  const variants: string[] = [];

  for (let index = 0; index < words.length; index += 1) {
    const replacement = buildCandidateWord(term, words[index][0]?.toLowerCase() ?? '', words[index]);
    if (!replacement) {
      continue;
    }

    const next = [...words];
    next[index] = replacement;
    variants.push(next.join(' '));
  }

  if (words.length >= 2) {
    for (let index = 0; index < words.length - 1; index += 1) {
      const first = buildCandidateWord(term, words[index][0]?.toLowerCase() ?? '', words[index]);
      const second = buildCandidateWord(term, words[index + 1][0]?.toLowerCase() ?? '', words[index + 1]);
      if (!first || !second) {
        continue;
      }

      const next = [...words];
      next[index] = first;
      next[index + 1] = second;
      variants.push(next.join(' '));
    }
  }

  return variants;
};

const buildSkeletonVariants = (term: Term, answer: string) => {
  const words = splitWords(answer);
  const initials = getInitials(answer);

  return initials.map((initial, index) => {
    const lexicon =
      uniqueList([
        ...(categoryLexicon[term.category ?? '']?.[initial] ?? []),
        ...(genericLexicon[initial] ?? []),
      ]).filter((item) => item.toLowerCase() !== words[index].toLowerCase());

    if (lexicon.length === 0) {
      return '';
    }

    const next = [...words];
    next[index] = preserveCase(words[index], lexicon[(index + 1) % lexicon.length]);
    return next.join(' ');
  });
};

const buildRelatedVariants = (term: Term, allTerms: Term[], answer: string) => {
  const sameCategory = allTerms
    .filter((item) => item.id !== term.id && item.category === term.category)
    .map((item) => getPrimaryAnswer(item));

  const wordCount = splitWords(answer).length;
  const initials = getInitials(answer);

  return sameCategory
    .filter((candidate) => Math.abs(splitWords(candidate).length - wordCount) <= 1)
    .filter((candidate) => {
      const candidateInitials = getInitials(candidate);
      return candidateInitials.some((initial, index) => initial === initials[index]);
    })
    .slice(0, 6)
    .map((candidate) => {
      const candidateWords = splitWords(candidate);
      const answerWords = splitWords(answer);
      const merged = answerWords.map((word, index) => candidateWords[index] ?? word);
      return merged.join(' ');
    });
};

export const generateDistractors = (term: Term, allTerms: Term[]): string[] => {
  const answer = getPrimaryAnswer(term);
  const manual = manualDistractors[term.id] ?? manualDistractors[term.abbr] ?? [];
  const automatic = [
    ...buildPatternVariants(term, answer),
    ...buildSkeletonVariants(term, answer),
    ...buildRelatedVariants(term, allTerms, answer),
  ];
  const words = splitWords(answer);
  const fallback = Array.from({ length: 6 }, (_, variantIndex) => {
    const next = words.map((word, wordIndex) => {
      const replacement = buildCandidateWord(term, word[0]?.toLowerCase() ?? '', word);
      if (!replacement) {
        return word;
      }

      return wordIndex === variantIndex % words.length
        ? replacement
        : wordIndex === (variantIndex + 1) % words.length && words.length > 2
          ? replacement
          : word;
    });

    return next.join(' ');
  });

  return uniqueList([...manual, ...automatic, ...fallback])
    .filter((candidate) => candidate !== answer)
    .filter((candidate) => candidate.toLowerCase() !== answer.toLowerCase())
    .slice(0, 3);
};

export const getBlitzAnswer = (term: Term) => getPrimaryAnswer(term);

export const getBlitzPrompt = (term: Term) => {
  if (term.id === 'PC-personal') {
    return {
      title: 'PC',
      context: 'Контекст: общее компьютерное значение',
    };
  }

  if (term.id === 'PC-counter') {
    return {
      title: 'PC',
      context: 'Контекст: архитектура процессора',
    };
  }

  return {
    title: term.abbr,
    context: term.answers.length > 1 ? 'У сокращения несколько допустимых трактовок' : '',
  };
};

export const getMemoryHint = (term: Term) =>
  manualHints[term.id] ?? manualHints[term.abbr] ?? `${term.memoryHint}`;
