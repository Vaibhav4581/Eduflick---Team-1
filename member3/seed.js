require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Mentor = require('../models/Mentor');
const Student = require('../models/Student');
const Submission = require('../models/Submission');

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([Mentor.deleteMany(), Student.deleteMany(), Submission.deleteMany()]);

  console.log('Creating mentor...');
  const mentor = await Mentor.create({
    name: 'Arjun Mehta',
    email: 'arjun@eduapp.ai',
    role: 'Senior Mentor',
    initials: 'AM',
    track: 'Agentic Automation',
  });

  console.log('Creating students...');
  const studentsData = [
    {
      name: 'Priya Rajan', email: 'priya@email.com', initials: 'PR', track: 'Agentic Automation',
      progress: 82, lessonsCompleted: 18, lessonsTotal: 22, modulesCompleted: 3, modulesTotal: 4,
      streakDays: 12, avgScore: 88, submissionsCount: 2, status: 'On track',
      avatarBg: '#E6F1FB', avatarColor: '#185FA5', progressColor: '#185FA5',
      modules: [
        { name: 'Module 1 — Intro to Agents', score: 91, status: 'passed' },
        { name: 'Module 2 — Tool Use & Chains', score: 85, status: 'passed' },
        { name: 'Module 3 — Memory Systems', score: 88, status: 'passed' },
        { name: 'Module 4 — Deployment', score: null, status: 'in progress' },
      ],
    },
    {
      name: 'Rohan Kumar', email: 'rohan@email.com', initials: 'RK', track: 'AI Software Dev',
      progress: 70, lessonsCompleted: 14, lessonsTotal: 20, modulesCompleted: 2, modulesTotal: 4,
      streakDays: 7, avgScore: 75, submissionsCount: 1, status: 'Review pending',
      avatarBg: '#EAF3DE', avatarColor: '#3B6D11', progressColor: '#3B6D11',
      modules: [
        { name: 'Module 1 — Python & APIs', score: 80, status: 'passed' },
        { name: 'Module 2 — System Integration', score: 70, status: 'passed' },
        { name: 'Module 3 — Capstone Project', score: null, status: 'pending review' },
        { name: 'Module 4 — Deploy & Scale', score: null, status: 'locked' },
      ],
    },
    {
      name: 'Deepa Sharma', email: 'deepa@email.com', initials: 'DS', track: 'AI Foundations',
      progress: 55, lessonsCompleted: 11, lessonsTotal: 20, modulesCompleted: 2, modulesTotal: 4,
      streakDays: 4, avgScore: 79, submissionsCount: 1, status: 'On track',
      avatarBg: '#FAEEDA', avatarColor: '#854F0B', progressColor: '#BA7517',
      modules: [
        { name: 'Module 1 — ML Basics', score: 82, status: 'passed' },
        { name: 'Module 2 — Neural Networks', score: 76, status: 'passed' },
        { name: 'Module 3 — Large Language Models', score: null, status: 'in progress' },
        { name: 'Module 4 — Applied Projects', score: null, status: 'locked' },
      ],
    },
    {
      name: 'Kavya Nair', email: 'kavya@email.com', initials: 'KN', track: 'AI Foundations',
      progress: 30, lessonsCompleted: 6, lessonsTotal: 20, modulesCompleted: 1, modulesTotal: 4,
      streakDays: 0, avgScore: 64, submissionsCount: 0, status: 'Stuck',
      avatarBg: '#FCEBEB', avatarColor: '#A32D2D', progressColor: '#E24B4A',
      modules: [
        { name: 'Module 1 — ML Basics', score: 68, status: 'passed' },
        { name: 'Module 2 — Neural Networks', score: null, status: 'stuck', statusDetail: 'stuck on lesson 3' },
        { name: 'Module 3 — Large Language Models', score: null, status: 'locked' },
        { name: 'Module 4 — Applied Projects', score: null, status: 'locked' },
      ],
    },
    {
      name: 'Aditya Menon', email: 'aditya@email.com', initials: 'AM', track: 'AI Content Creation',
      progress: 65, lessonsCompleted: 13, lessonsTotal: 20, modulesCompleted: 2, modulesTotal: 4,
      streakDays: 5, avgScore: 81, submissionsCount: 1, status: 'Review pending',
      avatarBg: '#EEEDFE', avatarColor: '#534AB7', progressColor: '#7F77DD',
      modules: [
        { name: 'Module 1 — Prompt Engineering', score: 86, status: 'passed' },
        { name: 'Module 2 — Content Strategy', score: 76, status: 'passed' },
        { name: 'Module 3 — Multimedia AI', score: null, status: 'pending review' },
        { name: 'Module 4 — Publishing & Scale', score: null, status: 'locked' },
      ],
    },
    {
      name: 'Siddharth Varma', email: 'sid@email.com', initials: 'SV', track: 'Agentic Automation',
      progress: 20, lessonsCompleted: 4, lessonsTotal: 22, modulesCompleted: 0, modulesTotal: 4,
      streakDays: 2, avgScore: 48, submissionsCount: 0, status: 'Failed assessment',
      avatarBg: '#EAF3DE', avatarColor: '#3B6D11', progressColor: '#E24B4A',
      modules: [
        { name: 'Module 1 — Intro to Agents', score: 48, status: 'failed', statusDetail: 'failed — 2 attempts' },
        { name: 'Module 2 — Tool Use', score: null, status: 'locked' },
        { name: 'Module 3 — Memory Systems', score: null, status: 'locked' },
        { name: 'Module 4 — Deployment', score: null, status: 'locked' },
      ],
    },
    {
      name: 'Rahul Chandra', email: 'rahul@email.com', initials: 'RC', track: 'AI Software Dev',
      progress: 45, lessonsCompleted: 9, lessonsTotal: 20, modulesCompleted: 1, modulesTotal: 4,
      streakDays: 0, avgScore: 72, submissionsCount: 1, status: 'Inactive',
      avatarBg: '#E1F5EE', avatarColor: '#0F6E56', progressColor: '#1D9E75',
      modules: [
        { name: 'Module 1 — Python & APIs', score: 74, status: 'passed' },
        { name: 'Module 2 — System Integration', score: null, status: 'in progress' },
        { name: 'Module 3 — Capstone Project', score: null, status: 'locked' },
        { name: 'Module 4 — Deploy & Scale', score: null, status: 'locked' },
      ],
    },
    {
      name: 'Neha Agarwal', email: 'neha@email.com', initials: 'NA', track: 'Agentic Automation',
      progress: 100, lessonsCompleted: 22, lessonsTotal: 22, modulesCompleted: 4, modulesTotal: 4,
      streakDays: 21, avgScore: 94, submissionsCount: 3, status: 'Completed', completed: true,
      avatarBg: '#E6F1FB', avatarColor: '#185FA5', progressColor: '#185FA5',
      modules: [
        { name: 'Module 1 — Intro to Agents', score: 95, status: 'passed' },
        { name: 'Module 2 — Tool Use & Chains', score: 92, status: 'passed' },
        { name: 'Module 3 — Memory Systems', score: 96, status: 'passed' },
        { name: 'Module 4 — Deployment', score: 93, status: 'passed' },
      ],
    },
  ];

  const students = await Student.insertMany(
    studentsData.map((s) => ({ ...s, mentor: mentor._id }))
  );

  const byName = Object.fromEntries(students.map((s) => [s.name, s]));

  console.log('Creating submissions...');
  await Submission.insertMany([
    {
      student: byName['Rohan Kumar']._id, project: 'Capstone API Project', module: 'Module 3',
      links: { github: 'https://github.com/rohan/capstone-api', portfolio: 'https://rohan.dev', file: 'capstone_report.pdf' },
      status: 'pending',
    },
    {
      student: byName['Aditya Menon']._id, project: 'Multimedia AI Pipeline', module: 'Module 3',
      links: { github: 'https://github.com/aditya/multimedia-ai', portfolio: null, file: 'pipeline_deck.pdf' },
      status: 'pending',
    },
    {
      student: byName['Rahul Chandra']._id, project: 'API Integration Demo', module: 'Module 2',
      links: { github: 'https://github.com/rahul/api-demo', portfolio: 'https://rahulchandra.io', file: null },
      status: 'pending',
    },
    {
      student: byName['Priya Rajan']._id, project: 'Agent Memory System', module: 'Module 3',
      links: { github: 'https://github.com/priya/agent-mem', portfolio: null, file: 'memory_system.zip' },
      status: 'reviewed', verdict: 'approved', score: '92%',
      feedback: { verdict: 'approved', ratings: { code: 5, problem: 4, doc: 5, creativity: 4 }, reviewedAt: new Date() },
    },
    {
      student: byName['Priya Rajan']._id, project: 'Tool Use Demo', module: 'Module 2',
      links: { github: 'https://github.com/priya/tool-use', portfolio: null, file: null },
      status: 'reviewed', verdict: 'approved', score: '88%',
      feedback: { verdict: 'approved', ratings: { code: 4, problem: 4, doc: 4, creativity: 5 }, reviewedAt: new Date() },
    },
    {
      student: byName['Neha Agarwal']._id, project: 'Final Capstone Agent', module: 'Module 4',
      links: { github: 'https://github.com/neha/capstone', portfolio: 'https://neha.ai', file: 'final_report.pdf' },
      status: 'reviewed', verdict: 'approved', score: '96%',
      feedback: { verdict: 'approved', ratings: { code: 5, problem: 5, doc: 5, creativity: 4 }, reviewedAt: new Date() },
    },
    {
      student: byName['Deepa Sharma']._id, project: 'LLM Prompt Engineering Project', module: 'Module 2',
      links: { github: 'https://github.com/deepa/llm-prompts', portfolio: null, file: 'project.pdf' },
      status: 'reviewed', verdict: 'revision', score: '71%',
      feedback: { verdict: 'revision', ratings: { code: 3, problem: 3, doc: 4, creativity: 4 }, reviewedAt: new Date() },
    },
  ]);

  console.log('Seed complete.');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
