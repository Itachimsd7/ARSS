'use strict';

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Candidate = require('../models/Candidate');
const Config = require('../models/Config');

const MOCK_CANDIDATES = [
  {
    name: 'Ananya Sharma',
    email: 'ananya.sharma@email.com',
    phone: '+91-9876543210',
    skills: ['python', 'machine learning', 'sql', 'nlp', 'data analysis', 'pandas', 'flask'],
    education: 'btech',
    experience: 3,
    similarity: 0.82,
    score: 0.85,
    matchPercentage: 85,
    result: 'QUALIFIED',
    status: 'shortlisted',
    missingSkills: [],
    suggestions: ['Add more production deployment experience.'],
    strengths: ['Strong python foundation', 'Great machine learning skills'],
    weaknesses: ['Minimal cloud deployment experience'],
    fileName: 'ananya_resume.pdf',
    fileSize: 14500,
    fileHash: 'hash_ananya_sharma_123',
    source: 'web',
    adminNotes: 'Excellent candidate, B.Tech CSE (2022). High similarity match.'
  },
  {
    name: 'Rohan Mehta',
    email: 'rohan.mehta@email.com',
    phone: '+91-9812345678',
    skills: ['python', 'sql', 'data analysis', 'pandas', 'numpy', 'tableau'],
    education: 'btech',
    experience: 2,
    similarity: 0.65,
    score: 0.68,
    matchPercentage: 68,
    result: 'SHORTLIST',
    status: 'pending',
    missingSkills: ['machine learning', 'nlp'],
    suggestions: ['Learn and add machine learning libraries like scikit-learn.'],
    strengths: ['Great data analysis and SQL skills'],
    weaknesses: ['Missing core Machine Learning and NLP requirements'],
    fileName: 'rohan_resume_v2.pdf',
    fileSize: 18200,
    fileHash: 'hash_rohan_mehta_456',
    source: 'web',
    adminNotes: 'Good analyst background but lacks ML expertise. Good for alternative roles.'
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '+91-9898989898',
    skills: ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'sql', 'nlp'],
    education: 'mtech',
    experience: 5,
    similarity: 0.89,
    score: 0.92,
    matchPercentage: 92,
    result: 'QUALIFIED',
    status: 'accepted',
    missingSkills: [],
    suggestions: ['Great resume. No major recommendations.'],
    strengths: ['5 years of deep ML experience', 'M.Tech education', 'Proficient in NLP'],
    weaknesses: [],
    fileName: 'priya_patel_cv.pdf',
    fileSize: 22400,
    fileHash: 'hash_priya_patel_789',
    source: 'email',
    adminNotes: 'Highly qualified candidate with 5 years experience in deep learning. Accepted for interview.'
  },
  {
    name: 'Amit Verma',
    email: 'amit.verma@email.com',
    phone: '+91-9765432109',
    skills: ['java', 'spring boot', 'mysql', 'aws', 'docker'],
    education: 'btech',
    experience: 4,
    similarity: 0.25,
    score: 0.32,
    matchPercentage: 32,
    result: 'REJECT',
    status: 'rejected',
    missingSkills: ['python', 'machine learning', 'nlp', 'data analysis'],
    suggestions: ['Add Python experience and machine learning concepts to match the role requirements.'],
    strengths: ['Solid backend developer in Java/Spring'],
    weaknesses: ['Lacks Python, Machine Learning, and NLP skills required for this job'],
    fileName: 'amit_java_resume.pdf',
    fileSize: 16000,
    fileHash: 'hash_amit_verma_abc',
    source: 'web',
    adminNotes: 'Rejected. Pure Java backend developer, no alignment with current ML developer requirements.'
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@email.com',
    phone: '+91-9543210987',
    skills: ['python', 'machine learning', 'scikit-learn', 'sql', 'nlp', 'nltk'],
    education: 'bca',
    experience: 1,
    similarity: 0.72,
    score: 0.60,
    matchPercentage: 60,
    result: 'SHORTLIST',
    status: 'pending',
    missingSkills: ['data analysis'],
    suggestions: ['Gain more experience with data analysis tools and frameworks.'],
    strengths: ['Good foundational ML/NLP skills'],
    weaknesses: ['Only 1 year experience'],
    fileName: 'sneha_resume.pdf',
    fileSize: 15300,
    fileHash: 'hash_sneha_reddy_def',
    source: 'email',
    adminNotes: 'BCA graduate with 1 year experience. Strong technical match but entry-level experience.'
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    phone: '+91-9654321098',
    skills: ['python', 'django', 'flask', 'javascript', 'react', 'sql', 'postgresql'],
    education: 'btech',
    experience: 3,
    similarity: 0.58,
    score: 0.62,
    matchPercentage: 62,
    result: 'SHORTLIST',
    status: 'shortlisted',
    missingSkills: ['machine learning', 'nlp'],
    suggestions: ['Add concepts/projects in Machine Learning or Natural Language Processing.'],
    strengths: ['Strong web development skills (Django/Flask)'],
    weaknesses: ['Lacks artificial intelligence/machine learning track record'],
    fileName: 'vikram_fullstack.pdf',
    fileSize: 17500,
    fileHash: 'hash_vikram_singh_ghi',
    source: 'web',
    adminNotes: 'Mainly a Python full-stack developer. Shortlisted due to strong Flask/Django and SQL capability.'
  },
  {
    name: 'Karan Malhotra',
    email: 'karan.malhotra@email.com',
    phone: '+91-9123456789',
    skills: ['html', 'css', 'javascript', 'figma', 'ui/ux'],
    education: 'bfa',
    experience: 2,
    similarity: 0.12,
    score: 0.18,
    matchPercentage: 18,
    result: 'REJECT',
    status: 'rejected',
    missingSkills: ['python', 'machine learning', 'sql', 'nlp', 'data analysis'],
    suggestions: ['Apply for UI/UX Design positions instead.'],
    strengths: ['UI/UX design portfolio'],
    weaknesses: ['No developer background or programming/ML knowledge match'],
    fileName: 'karan_designer.pdf',
    fileSize: 12000,
    fileHash: 'hash_karan_malhotra_jkl',
    source: 'web',
    adminNotes: 'Rejected. Frontend/UI designer, complete mismatch for AI screening role.'
  }
];

const DEFAULT_CONFIG = {
  job_description: 'Looking for a Python developer with knowledge in machine learning, data analysis, and SQL. Experience with NLP is a plus.',
  skills: ['python', 'machine learning', 'sql', 'nlp', 'data analysis'],
  skillWeightage: {
    python: 30,
    'machine learning': 25,
    sql: 20,
    nlp: 15,
    'data analysis': 10
  },
  min_experience: 1,
  education: 'btech',
  atsThresholds: {
    qualified: 75,
    shortlist: 40,
    reject: 0
  },
  experiencePriority: 'medium'
};

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arss_db';
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear existing candidates and configs
    await Candidate.deleteMany({});
    console.log('Cleared existing candidates collection.');

    // Insert mock candidates
    const seeded = await Candidate.insertMany(MOCK_CANDIDATES);
    console.log(`Successfully seeded ${seeded.length} mock candidates.`);

    // Seed config
    await Config.deleteMany({ key: 'job_requirements' });
    await Config.create({
      key: 'job_requirements',
      value: DEFAULT_CONFIG,
      description: 'AI matching requirements and thresholds'
    });
    console.log('Successfully seeded default job requirements configuration.');

    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();
