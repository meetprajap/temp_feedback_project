export const COURSES = [
  { id: 'CS101', name: 'Blockchain Fundamentals', faculty: 'Dr. Satoshi Nakamoto', dept: 'CS', active: true, students: 120 },
  { id: 'CS102', name: 'Smart Contract Security', faculty: 'Prof. Vitalik Buterin', dept: 'CS', active: true, students: 85 },
  { id: 'ENG201', name: 'Technical Documentation', faculty: 'Ms. Ada Lovelace', dept: 'ENG', active: false, students: 200 },
];

export const INITIAL_BLOCKS = [
  { id: 1, Name: 'Jaimin Raval', hash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', prevHash: '0x00...00', studentHash: '0x99a...c1', course: 'CS101', rating: 18, timestamp: '2023-10-24 10:00' },
  { id: 2, Name: 'Smit Raval', hash: '0x3c21a4f32b1c6d9e8f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', prevHash: '0x7f...69', studentHash: '0x44b...d2', course: 'CS102', rating: 16, timestamp: '2023-10-25 14:30' },
];

export const FACULTY_STATS = [
  { name: 'Dr. Satoshi Nakamoto', score: 4.8, feedbacks: 120, trend: '+2.4%' },
  { name: 'Prof. Vitalik Buterin', score: 4.5, feedbacks: 95, trend: '-0.5%' },
  { name: 'Ms. Ada Lovelace', score: 4.9, feedbacks: 80, trend: '+5.0%' },
];