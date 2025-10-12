interface StudentData {
  studentId: string;
  studentName: string;
  weeklyLearningHours: number;
  classRank: number;
  totalStudents: number;
  todayLearningTime: number;
  averageGrade: number;
  learningGoalProgress: number;
  subjects: {
    math: number;
    science: number;
    english: number;
    chinese: number;
  };
  recentTests: {
    subject: string;
    score: number;
    date: string;
  }[];
}

export class CSVDataService {
  private static readonly CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQxxzUxbexPBgrfd7J3Nmcw29DSJaZ7_ZQmluJdT4QZiaqk4_wmhLk1cOiCXasJ4lGdWLdBQFU4Htx9/pub?gid=89921487&single=true&output=csv';

  static async fetchStudentData(studentId: string): Promise<StudentData | null> {
    try {
      const response = await fetch(this.CSV_URL);
      const csvText = await response.text();
      
      // Parse CSV data
      const rows = csvText.split('\n').map(row => row.split(','));
      const headers = rows[0];
      
      // Find student data by ID
      const studentRow = rows.find(row => row[0] === studentId);
      
      if (!studentRow) {
        // Return mock data if student not found or CSV is unavailable
        return this.getMockStudentData(studentId);
      }
      
      // Parse student data from CSV
      return this.parseStudentData(headers, studentRow);
    } catch (error) {
      console.error('Error fetching CSV data:', error);
      // Return mock data as fallback
      return this.getMockStudentData(studentId);
    }
  }

  private static parseStudentData(headers: string[], row: string[]): StudentData {
    return {
      studentId: row[0] || '',
      studentName: row[1] || '',
      weeklyLearningHours: parseFloat(row[2]) || 0,
      classRank: parseInt(row[3]) || 0,
      totalStudents: parseInt(row[4]) || 30,
      todayLearningTime: parseFloat(row[5]) || 0,
      averageGrade: parseFloat(row[6]) || 0,
      learningGoalProgress: parseFloat(row[7]) || 0,
      subjects: {
        math: parseFloat(row[8]) || 0,
        science: parseFloat(row[9]) || 0,
        english: parseFloat(row[10]) || 0,
        chinese: parseFloat(row[11]) || 0,
      },
      recentTests: [
        { subject: '數學', score: parseFloat(row[12]) || 0, date: row[15] || '--' },
        { subject: '英文', score: parseFloat(row[13]) || 0, date: row[16] || '--' },
        { subject: '科學', score: parseFloat(row[14]) || 0, date: row[17] || '--' },
      ]
    };
  }

  private static getMockStudentData(studentId: string): StudentData {
    return {
      studentId,
      studentName: `學生${studentId}`,
      weeklyLearningHours: 0,
      classRank: 0,
      totalStudents: 30,
      todayLearningTime: 0,
      averageGrade: 0,
      learningGoalProgress: 0,
      subjects: {
        math: 0,
        science: 0,
        english: 0,
        chinese: 0,
      },
      recentTests: [
        { subject: '數學', score: 0, date: '--' },
        { subject: '英文', score: 0, date: '--' },
        { subject: '科學', score: 0, date: '--' },
      ]
    };
  }
}