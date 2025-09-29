import React, { createContext, useContext, useState, ReactNode } from 'react';


interface StudentInfo {
  name: string;
  id: string;
  organizationId: number;
  grade: number;
  class: number;
  seat: number;
  chineseScore: number;
  mathScore: number;
  englishScore: number;
}


interface StudentContextType {
  studentInfo: StudentInfo | null;
  setStudentInfo: (info: StudentInfo) => void;
  clearStudentInfo: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};

interface StudentProviderProps {
  children: ReactNode;
}

export const StudentProvider: React.FC<StudentProviderProps> = ({ children }) => {
  const [studentInfo, setStudentInfoState] = useState<StudentInfo | null>(null);

  const setStudentInfo = (info: StudentInfo) => {
    setStudentInfoState(info);
  };

  const clearStudentInfo = () => {
    setStudentInfoState(null);
  };

  return (
    <StudentContext.Provider value={{ studentInfo, setStudentInfo, clearStudentInfo }}>
      {children}
    </StudentContext.Provider>
  );
};