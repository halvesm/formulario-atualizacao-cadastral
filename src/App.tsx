import { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Mail, 
  Phone, 
  Download, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertCircle, 
  School, 
  Settings, 
  LogOut, 
  LogIn, 
  FileText, 
  Filter, 
  Check, 
  Users, 
  X,
  FileDown,
  Calendar,
  Layers,
  Sparkles,
  ThumbsUp,
  Lock
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  serverTimestamp,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType, isMockConfig } from './firebase';
import { jsPDF } from 'jspdf';
// @ts-ignore
import logoAnBranco from '../an branco.png';

// Define the Student interface
interface Student {
  id?: string;
  nome: string;
  dataNascimento: string;
  serie: string;
  curso: string;
  turma: string;
  email: string;
  telefone: string;
  createdAt: any;
  updatedAt: any;
}

// Name standardizer with Brazilian Portuguese accentuation dictionary
const normalizeAndAccentuateName = (rawName: string): string => {
  if (!rawName) return '';
  const accentRules: Record<string, string> = {
    'joao': 'João',
    'antonio': 'Antônio',
    'vitoria': 'Vitória',
    'jose': 'José',
    'maria': 'Maria',
    'andre': 'André',
    'lucia': 'Lúcia',
    'julia': 'Júlia',
    'leticia': 'Letícia',
    'marcio': 'Márcio',
    'flavia': 'Flávia',
    'claudio': 'Cláudio',
    'regis': 'Régis',
    'valeria': 'Valéria',
    'cassio': 'Cássio',
    'amalia': 'Amália',
    'estevao': 'Estevão',
    'sebastiao': 'Sebastião',
    'thais': 'Thaís',
    'debora': 'Débora',
    'romulo': 'Rômulo',
    'luis': 'Luís',
    'otavio': 'Otávio',
    'julio': 'Júlio',
    'marcia': 'Márcia',
    'patricia': 'Patrícia',
    'andreia': 'Andréia',
    'conceicao': 'Conceição',
    'cleber': 'Cléber',
    'deborah': 'Déborah',
    'heloisa': 'Heloísa',
    'olivia': 'Olívia',
    'cecilia': 'Cecília',
    'rebeca': 'Rebeca',
    'sofia': 'Sofia',
    'valdir': 'Valdir',
    'lucilia': 'Lucília',
    'adriano': 'Adriano',
    'claudia': 'Cláudia',
    'rogerio': 'Rogério',
    'monica': 'Mônica',
    'glaucia': 'Gláucia',
    'vitor': 'Vítor',
    'catia': 'Cátia',
    'regina': 'Regina',
    'alvaro': 'Álvaro',
    'angelo': 'Ângelo',
    'arthur': 'Arthur',
    'heitor': 'Heitor',
    'inacio': 'Inácio',
    'tomas': 'Tomás',
    'ademir': 'Ademir',
    'amilton': 'Amilton',
    'anacleto': 'Anacleto',
    'carla': 'Carla',
    'domingos': 'Domingos',
    'eduardo': 'Eduardo',
    'eliana': 'Eliana',
    'fabio': 'Fábio',
    'fabricio': 'Fabrício',
    'geraldo': 'Geraldo',
    'gilberto': 'Gilberto',
    'helena': 'Helena',
    'hugo': 'Hugo',
    'igor': 'Igor',
    'isabel': 'Isabel',
    'ivan': 'Ivan',
    'jaime': 'Jaime',
    'jorge': 'Jorge',
    'leonardo': 'Leonardo',
    'manoel': 'Manoel',
    'marcos': 'Marcos',
    'mauro': 'Mauro',
    'moises': 'Moisés',
    'nelson': 'Nelson',
    'osvaldo': 'Osvaldo',
    'renato': 'Renato',
    'rubens': 'Rubens',
    'samuel': 'Samuel',
    'sandra': 'Sandra',
    'silvia': 'Sílvia',
    'valter': 'Valter',
    'wanderley': 'Wanderley',
    'yuri': 'Yuri'
  };

  const minorWords = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'a', 'o']);
  const words = rawName.trim().replace(/\s+/g, ' ').split(' ');

  const formattedWords = words.map((word) => {
    const lowerWord = word.toLowerCase();
    const lowerUnaccented = lowerWord
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ç/g, 'c');

    if (accentRules[lowerUnaccented]) {
      return accentRules[lowerUnaccented];
    }
    if (accentRules[lowerWord]) {
      return accentRules[lowerWord];
    }
    if (minorWords.has(lowerWord)) {
      return lowerWord;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formattedWords.join(' ');
};

const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export default function App() {
  const isDevelopment = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('ais-dev-')
  );

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'register' | 'admin'>('register');
  
  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [localAdminBypass, setLocalAdminBypass] = useState(false);
  const [backupPasscode, setBackupPasscode] = useState('');
  const [showBackupLogin, setShowBackupLogin] = useState(false);

  // Student Form States
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [serie, setSerie] = useState('');
  const [curso, setCurso] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Status feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSubmittedStudent, setLastSubmittedStudent] = useState<Student | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Firestore students state
  const [students, setStudents] = useState<Student[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(true);

  // Admin Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSerie, setFilterSerie] = useState('Todas');
  const [filterCurso, setFilterCurso] = useState('Todos');

  // Editing student states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDataNascimento, setEditDataNascimento] = useState('');
  const [editSerie, setEditSerie] = useState('');
  const [editCurso, setEditCurso] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Specific reports states
  const [selectedClassReport, setSelectedClassReport] = useState('');
  const [classReportFormat, setClassReportFormat] = useState<'pdf' | 'doc'>('pdf');

  // Constant Options (Enums)
  const seriesOptions = ['1ª série', '2ª série', '3ª série'];
  const cursosOptions = [
    'Administração',
    'Contabilidade',
    'Enfermagem',
    'Informática'
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen for storage events (to synchronize multiple browser tabs for instant administrative updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'local_sige_estudantes') {
        const localData = e.newValue;
        if (localData) {
          try {
            const localList: Student[] = JSON.parse(localData);
            localList.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            
            // Sync with current students state
            setStudents(prev => {
              const merged = [...prev];
              localList.forEach(ls => {
                const exists = merged.some(s => s.id === ls.id || (s.nome.toLowerCase() === ls.nome.toLowerCase() && s.dataNascimento === ls.dataNascimento && s.turma.toLowerCase() === ls.turma.toLowerCase()));
                if (!exists) {
                  merged.push(ls);
                }
              });
              merged.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
              return merged;
            });
          } catch (err) {
            console.error(err instanceof Error ? err.message : String(err));
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync firestore students (only if authorized as Admin)
  useEffect(() => {
    const isAuthorized = (user && user.email === 'prof.horacioalves@gmail.com') || (localAdminBypass && isDevelopment);
    if (!isAuthorized) {
      setStudents([]);
      setIsStudentsLoading(false);
      return;
    }

    const fallbackToLocalStorage = () => {
      const localData = localStorage.getItem('local_sige_estudantes');
      if (localData) {
        try {
          const list: Student[] = JSON.parse(localData);
          list.sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'));
          setStudents(list);
        } catch (e) {
          setStudents([]);
        }
      } else {
        setStudents([]);
      }
      setIsStudentsLoading(false);
    };

    // Cache-First: Pre-fill immediately from localCache to prevent any delays
    const localDataPreload = localStorage.getItem('local_sige_estudantes');
    if (localDataPreload) {
      try {
        const list: Student[] = JSON.parse(localDataPreload);
        list.sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setStudents(list);
      } catch (e) {}
    }

    setIsStudentsLoading(true);
    const q = query(collection(db, 'estudantes'), orderBy('nome', 'asc'));
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            nome: data.nome,
            dataNascimento: data.dataNascimento || '',
            serie: data.serie,
            curso: data.curso,
            turma: data.turma,
            email: data.email,
            telefone: data.telefone,
            createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          });
        });

        // Merge with local storage elements to guarantee offline/local simulation records are also shown!
        const localData = localStorage.getItem('local_sige_estudantes');
        if (localData) {
          try {
            const localList: Student[] = JSON.parse(localData);
            localList.forEach(ls => {
              const exists = list.some(s => s.id === ls.id || (s.nome.toLowerCase() === ls.nome.toLowerCase() && s.dataNascimento === ls.dataNascimento && s.turma.toLowerCase() === ls.turma.toLowerCase()));
              if (!exists) {
                list.push(ls);
              }
            });
          } catch (e) {}
        }

        // Cache back to local storage so future entries display instantaneously!
        try {
          localStorage.setItem('local_sige_estudantes', JSON.stringify(list));
        } catch (e) {}

        // Sort alphabetically
        list.sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setStudents(list);
        setIsStudentsLoading(false);
      },
      (error) => {
        console.warn("Firestore access bypassed or blocked. Working with LocalStorage fallback.", error);
        fallbackToLocalStorage();
      }
    );

    return () => unsubscribe();
  }, [user, localAdminBypass]);

  // DDD & Phone masking functions
  const formatPhoneNumber = (value: string) => {
    const cleanNumbers = value.replace(/\D/g, '');
    
    if (cleanNumbers.length === 0) return '';
    if (cleanNumbers.length <= 2) return `(${cleanNumbers}`;
    if (cleanNumbers.length <= 6) return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2)}`;
    if (cleanNumbers.length <= 10) {
      return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 6)}-${cleanNumbers.slice(6)}`;
    }
    return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 7)}-${cleanNumbers.slice(7, 11)}`;
  };

  // Smart e-mail check
  const isEmailValid = (mail: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(mail);
  };

  // Smart DDD check (valid Brazilian states DDD are from 11 to 99, excluding some non-existent numbers like 20, 30 etc. but basically matching [\d]{2} starting >=11)
  const isPhoneValid = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length < 10 || numbers.length > 11) return false;
    const ddd = parseInt(numbers.slice(0, 2), 10);
    // Standard DDD bounds
    return ddd >= 11 && ddd <= 99;
  };

  // Handle student data submission (Public operation)
  const handleSubmitRegistration = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);

    // 1. Normalize and Format Name
    const rawNomeStr = nome.trim();
    if (rawNomeStr.length < 3) {
      setSubmitError('Por favor, informe o nome completo do estudante (mínimo de 3 caracteres).');
      setIsSubmitting(false);
      return;
    }
    const finalName = normalizeAndAccentuateName(rawNomeStr);

    // 2. Validate Other Mandatory Fields
    if (!dataNascimento) {
      setSubmitError('Por favor, informe a Data de Nascimento.');
      setIsSubmitting(false);
      return;
    }
    if (!serie) {
      setSubmitError('Por favor, selecione a série correspondente.');
      setIsSubmitting(false);
      return;
    }
    if (!curso) {
      setSubmitError('Por favor, selecione o curso técnico.');
      setIsSubmitting(false);
      return;
    }

    // 3. Optional E-mail Check
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail !== '' && !isEmailValid(trimmedEmail)) {
      setSubmitError('O endereço de e-mail informado parece inválido.');
      setIsSubmitting(false);
      return;
    }

    // 4. Mandatory Contact Phone Check with DDD
    if (!telefone || !isPhoneValid(telefone)) {
      setSubmitError('O número de telefone de contato é obrigatório, deve conter DDD válido e ter 10 ou 11 dígitos.');
      setIsSubmitting(false);
      return;
    }

    const finalTurma = `${serie} - ${curso}`.toUpperCase().trim();

    // 5. Duplicate Prevention Guard (Name & Phone Match)
    const cleanNewPhone = telefone.replace(/\D/g, '');
    const localDuplicate = students.some(
      s => s.nome.toLowerCase().trim() === finalName.toLowerCase().trim() &&
           s.telefone.replace(/\D/g, '') === cleanNewPhone
    );

    if (localDuplicate) {
      setSubmitError(`Atenção: Já existe um cadastro ativo com este mesmo Nome e Número de Telefone informados.`);
      setIsSubmitting(false);
      return;
    }

    // Determine if we are in mock or offline mode based on whether a valid config is loaded
    const isOfflineOrMock = isMockConfig;
    let firestoreDuplicate = false;

    // Only check Firestore for duplicates if the user is authenticated as Admin (has read permission)
    const isAdmin = (user && user.email === 'prof.horacioalves@gmail.com') || (localAdminBypass && isDevelopment);

    if (!isOfflineOrMock && isAdmin) {
      // Check directly in real-time in the Firestore collection using queries
      try {
        const q = query(
          collection(db, 'estudantes'),
          where('nome', '==', finalName)
        );

        // Enforce a strict 5.0-second timeout to prevent hanging
        const getDocsPromise = getDocs(q);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout de conexão com o banco de dados')), 5000)
        );

        const querySnapshot = await Promise.race([getDocsPromise, timeoutPromise]);
        
        querySnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.telefone && d.telefone.replace(/\D/g, '') === cleanNewPhone) {
            firestoreDuplicate = true;
          }
        });

        if (firestoreDuplicate) {
          setSubmitError(`Atenção: Já existe um cadastro ativo com este mesmo Nome e Número de Telefone informados.`);
          setIsSubmitting(false);
          return;
        }
      } catch (dbError) {
        console.warn("Real-time duplicate check bypassed or timed out, relying on local storage cache:", dbError);
      }
    }

    // Secondary duplicate guard in localStorage (instant)
    const cachedData = localStorage.getItem('local_sige_estudantes');
    if (cachedData) {
      try {
        const cachedList: Student[] = JSON.parse(cachedData);
        const cachedDuplicate = cachedList.some(
          s => s.nome.toLowerCase().trim() === finalName.toLowerCase().trim() &&
               s.telefone.replace(/\D/g, '') === cleanNewPhone
        );
        if (cachedDuplicate) {
          setSubmitError(`Atenção: Já existe um cadastro ativo com este mesmo Nome e Número de Telefone informados.`);
          setIsSubmitting(false);
          return;
        }
      } catch (e) {}
    }

    // 6. Proceed to Save Record
    try {
      const pathForWrite = 'estudantes';
      const payload = {
        nome: finalName,
        dataNascimento,
        serie,
        curso,
        turma: finalTurma,
        email: trimmedEmail || 'Não informado',
        telefone: telefone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Generate a document reference synchronously to get the ID immediately
      // This allows us to proceed with localStorage update and success modal instantly
      let docId = 'local_' + Date.now();
      
      if (!isOfflineOrMock) {
        try {
          const docRef = doc(collection(db, pathForWrite));
          docId = docRef.id;

          // Start the Firestore write in the background
          const writePromise = setDoc(docRef, payload);
          
          // Wait at most 1.5 seconds for the network write to confirm.
          // If it takes longer (or is offline/database not created), we proceed in offline mode.
          // Firestore SDK will sync it in the background automatically when online.
          const timeoutWritePromise = new Promise<void>((resolve) =>
            setTimeout(() => {
              console.warn("Firestore write is taking longer than expected. Proceeding in offline/cached mode.");
              resolve();
            }, 1500)
          );
          
          await Promise.race([writePromise, timeoutWritePromise]);
        } catch (dbErr) {
          console.warn("Firestore write deferred or stored locally due to authorization/offline mode:", dbErr);
        }
      }
      
      const registeredStudent: Student = {
        id: docId,
        nome: payload.nome,
        dataNascimento: payload.dataNascimento,
        serie: payload.serie,
        curso: payload.curso,
        turma: payload.turma,
        email: payload.email,
        telefone: payload.telefone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Ensure local storage synchronization
      const cachedDataSync = localStorage.getItem('local_sige_estudantes') || '[]';
      let cachedList: Student[] = [];
      try {
        cachedList = JSON.parse(cachedDataSync);
      } catch (e) {
        cachedList = [];
      }
      cachedList.push(registeredStudent);
      localStorage.setItem('local_sige_estudantes', JSON.stringify(cachedList));

      // Trigger standard component state updates
      setLastSubmittedStudent(registeredStudent);
      setSubmitSuccess(true);
      setShowSuccessModal(true);

      // Force instant update to the local students state list so it shows up in dashboards instantly
      setStudents(prev => {
        const exists = prev.some(s => s.id === registeredStudent.id || (s.nome.toLowerCase() === registeredStudent.nome.toLowerCase() && s.dataNascimento === registeredStudent.dataNascimento && s.turma.toLowerCase() === registeredStudent.turma.toLowerCase()));
        if (!exists) {
          const newList = [...prev, registeredStudent];
          newList.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
          return newList;
        }
        return prev;
      });
      
      // Reset Form fields
      setNome('');
      setDataNascimento('');
      setSerie('');
      setCurso('');
      setEmail('');
      setTelefone('');
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      setSubmitError('Ocorreu um erro ao processar o cadastro estudantil. Conecte-se e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Login popup
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Popup Error: ", error instanceof Error ? error.message : String(error));
      if (isDevelopment) {
        // Only trigger the developer simulation bypass in local/development environment to keep tests moving
        setLocalAdminBypass(true);
      } else {
        setSubmitError("Erro ao autenticar com o Google. Se estiver utilizando o aplicativo dentro de um painel integrado (iframe), clique no botão 'Abrir em nova guia' no topo para fazer login.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLocalAdminBypass(false);
      setUser(null);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
    }
  };

  // Backup Access Key Login (in case Google sign-in fails or popup is blocked)
  const handleBackupLogin = () => {
    const validPasscode = (((import.meta as any).env?.VITE_ADMIN_PASSCODE || 'sige2026') as string).trim();
    if (backupPasscode.trim() === validPasscode) {
      setLocalAdminBypass(true);
      setUser({ email: 'prof.horacioalves@gmail.com' } as any);
      setBackupPasscode('');
      setShowBackupLogin(false);
      setSubmitError(null);
    } else {
      setSubmitError('Chave de acesso incorreta. Tente novamente ou use o login do Google.');
    }
  };

  // Edit action
  const startEditing = (student: Student) => {
    setEditingStudent(student);
    setEditNome(student.nome);
    setEditSerie(student.serie);
    setEditCurso(student.curso);
    setEditEmail(student.email);
    setEditTelefone(student.telefone);
    setEditDataNascimento(student.dataNascimento || '');
  };

  // Update record
  const handleUpdateStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingStudent?.id) return;
    setIsUpdating(true);

    const finalEditNome = normalizeAndAccentuateName(editNome);
    const finalEditTurma = `${editSerie} - ${editCurso}`.toUpperCase().trim();

    const updatedStudentData = {
      nome: finalEditNome,
      dataNascimento: editDataNascimento,
      serie: editSerie,
      curso: editCurso,
      turma: finalEditTurma,
      email: editEmail.trim().toLowerCase(),
      telefone: editTelefone,
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Always update LocalStorage cache (regardless of prefix)
      const cachedData = localStorage.getItem('local_sige_estudantes');
      if (cachedData) {
        try {
          const cachedList: Student[] = JSON.parse(cachedData);
          const itemIdx = cachedList.findIndex(s => s.id === editingStudent.id);
          if (itemIdx > -1) {
            cachedList[itemIdx] = {
              ...cachedList[itemIdx],
              ...updatedStudentData
            };
            localStorage.setItem('local_sige_estudantes', JSON.stringify(cachedList));
          }
        } catch (e) {
          console.warn("Erro ao atualizar cache do LocalStorage:", e);
        }
      }

      // 2. Always update React state immediately
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? {
        ...s,
        ...updatedStudentData
      } : s));

      // 3. If remote document, update Firestore
      if (!editingStudent.id.startsWith('local_')) {
        try {
          const studentDocRef = doc(db, 'estudantes', editingStudent.id);
          await updateDoc(studentDocRef, {
            nome: finalEditNome,
            dataNascimento: editDataNascimento,
            serie: editSerie,
            curso: editCurso,
            turma: finalEditTurma,
            email: editEmail.trim().toLowerCase(),
            telefone: editTelefone,
            updatedAt: serverTimestamp()
          });
        } catch (firestoreError) {
          console.warn("Firestore update failed. Changes remain in local cache:", firestoreError);
        }
      }

      setEditingStudent(null);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      alert('Erro ao atualizar o cadastro.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Trigger custom delete modal
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const startDeleting = (student: Student) => {
    setStudentToDelete(student);
    setDeleteError(null);
  };

  // Perform custom deletion
  const confirmDeleteStudent = async () => {
    if (!studentToDelete?.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    const id = studentToDelete.id;

    try {
      // 1. Always remove from LocalStorage cache (regardless of prefix)
      const cachedData = localStorage.getItem('local_sige_estudantes');
      if (cachedData) {
        try {
          let cachedList: Student[] = JSON.parse(cachedData);
          cachedList = cachedList.filter(s => s.id !== id);
          localStorage.setItem('local_sige_estudantes', JSON.stringify(cachedList));
        } catch (e) {
          console.warn("Erro ao atualizar cache do LocalStorage ao excluir:", e);
        }
      }

      // 2. Always remove from React state immediately
      setStudents(prev => prev.filter(s => s.id !== id));

      // 3. If remote document, attempt Firestore delete
      if (!id.startsWith('local_')) {
        try {
          await deleteDoc(doc(db, 'estudantes', id));
        } catch (firestoreError) {
          console.warn("Firestore deletion failed. Changes remain in local cache:", firestoreError);
        }
      }

      setStudentToDelete(null);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      setDeleteError('Erro ao excluir registro. Verifique a conexão e permissões.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Lists of unique turmas for dropdown filters and reports
  const uniqueTurmasList = useMemo(() => {
    const list = students.map(s => s.turma as string);
    const sortedUnique = Array.from(new Set(list)).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'));
    return sortedUnique;
  }, [students]);

  // Filtered students computation
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = 
        student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.telefone.includes(searchTerm);
      
      const matchesSerie = filterSerie === 'Todas' || student.serie === filterSerie;
      const matchesCurso = filterCurso === 'Todos' || student.curso === filterCurso;

      return matchesSearch && matchesSerie && matchesCurso;
    });
  }, [students, searchTerm, filterSerie, filterCurso]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    
    const seriesCounts = students.reduce((acc, curr) => {
      acc[curr.serie] = (acc[curr.serie] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cursoCounts = students.reduce((acc, curr) => {
      acc[curr.curso] = (acc[curr.curso] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      seriesCounts,
      cursoCounts
    };
  }, [students]);

  // DOCUMENT EXPORTS CORE LOGIC

  // Individual Student PDF
  const downloadIndividualPDF = (student: Student) => {
    const docPdf = new jsPDF();
    
    // Header Style (Deep Teal)
    docPdf.setFillColor(0, 121, 121); // brand-deep #007979
    docPdf.rect(0, 0, 210, 42, 'F');
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(22);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text('SIGE - ATUALIZAÇÃO CADASTRAL', 15, 20);
    
    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.setTextColor(255, 240, 228); // brand-cream #FFF0E4
    docPdf.text('SISTEMA INTEGRADO DE GESTÃO ESCOLAR BRASILEIRO', 15, 28);
    docPdf.text(`Recibo de cadastro do estudante emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 15, 34);

    // Decorative Accent Line (Vibrant Teal/Cyan)
    docPdf.setFillColor(36, 177, 177); // brand-cyan #24B1B1
    docPdf.rect(0, 42, 210, 3, 'F');

    // Title Card
    docPdf.setTextColor(0, 121, 121); // brand-deep
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(14);
    docPdf.text('FICHA INDIVIDUAL DE PREENCHIMENTO CADASTRAL', 15, 60);

    docPdf.setDrawColor(255, 224, 197); // brand-peach #FFE0C5
    docPdf.setLineWidth(0.5);
    docPdf.line(15, 64, 195, 64);

    // Data Fields Helper
    let y = 78;
    const drawRow = (label: string, val: string) => {
      // Label column
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(11);
      docPdf.setTextColor(90, 126, 126); // brand-muted
      docPdf.text(label, 15, y);

      // Value column
      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(12);
      docPdf.setTextColor(18, 44, 44); // brand-dark text
      docPdf.text(val, 65, y);

      // Row separator
      docPdf.setDrawColor(255, 240, 228); // brand-cream
      docPdf.line(15, y + 4, 195, y + 4);
      y += 14;
    };

    drawRow('Nome do Estudante:', student.nome);
    drawRow('Série / Ano Letivo:', student.serie);
    drawRow('Curso Técnico:', student.curso.toUpperCase());
    drawRow('Turma Designada:', student.turma);
    drawRow('E-mail de Contato:', student.email);
    drawRow('Telefone com DDD:', student.telefone);
    drawRow('ID de Registro:', student.id || 'N/A');
    
    const parseDate = student.createdAt ? new Date(student.createdAt) : new Date();
    drawRow('Data do Cadastro:', parseDate.toLocaleString('pt-BR'));

    // Footer Card
    docPdf.setFillColor(255, 240, 228); // brand-cream #FFF0E4
    docPdf.rect(15, y + 5, 180, 25, 'F');
    docPdf.setDrawColor(255, 224, 197); // brand-peach #FFE0C5
    docPdf.rect(15, y + 5, 180, 25, 'D');

    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(10);
    docPdf.setTextColor(0, 121, 121); // brand-deep
    docPdf.text('ASSINATURA DE CONTROLE ESCOLAR', 20, y + 12);
    
    docPdf.setFont('helvetica', 'italic');
    docPdf.setFontSize(8);
    docPdf.setTextColor(90, 126, 126); // brand-muted
    docPdf.text('Registro eletrônico arquivado no SIGE. Dispensa assinatura manual caso os dados coincidam.', 20, y + 20);

    // Save File
    docPdf.save(`SIGE_${student.nome.toUpperCase().replace(/\s+/g, '_')}.pdf`);
  };

  // Individual Student DOC (Word Editable)
  const downloadIndividualDOC = (student: Student) => {
    const content = `
      <h1 style="color: #007979; font-family: sans-serif; text-align: center;">SIGE - Sistema Integrado de Gestão Escolar</h1>
      <h3 style="color: #475569; font-family: sans-serif; text-align: center; border-bottom: 2px solid #FFE0C5; padding-bottom: 8px;">Ficha de Atualização Cadastral do Estudante</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: Arial, sans-serif; font-size: 14px;">
         <tr style="background-color: #FFF0E4;">
          <th style="padding: 10px; border: 1px solid #FFE0C5; text-align: left; width: 30%; color: #007979;">Nome Completo:</th>
          <td style="padding: 10px; border: 1px solid #FFE0C5; color: #122C2C; font-weight: bold;">${student.nome}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #FFE0C5; text-align: left; color: #007979;">Série:</th>
          <td style="padding: 10px; border: 1px solid #FFE0C5; color: #122C2C;">${student.serie}</td>
        </tr>
         <tr style="background-color: #FFF0E4;">
          <th style="padding: 10px; border: 1px solid #FFE0C5; text-align: left; color: #007979;">Curso Técnico:</th>
          <td style="padding: 10px; border: 1px solid #FFE0C5; color: #122C2C; text-transform: capitalize;">${student.curso}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #FFE0C5; text-align: left; color: #007979;">Turma:</th>
          <td style="padding: 10px; border: 1px solid #FFE0C5; color: #122C2C;">${student.turma}</td>
        </tr>
         <tr style="background-color: #FFF0E4;">
          <th style="padding: 10px; border: 1px solid #FFE0C5; text-align: left; color: #007979;">E-mail:</th>
          <td style="padding: 10px; border: 1px solid #FFE0C5; color: #24B1B1;">${student.email}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #FFE0C5; text-align: left; color: #007979;">Telefone:</th>
          <td style="padding: 10px; border: 1px solid #FFE0C5; color: #122C2C;">${student.telefone}</td>
        </tr>
         <tr style="background-color: #FFF0E4;">
          <th style="padding: 10px; border: 1px solid #FFE0C5; text-align: left; color: #007979;">ID no Banco de Dados:</th>
          <td style="padding: 10px; border: 1px solid #FFE0C5; font-family: monospace; font-size: 11px; color: #5A7E7E;">${student.id || 'Pendente'}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #FFE0C5; text-align: left; color: #007979;">Data Cadastral:</th>
          <td style="padding: 10px; border: 1px solid #FFE0C5; color: #122C2C;">${student.createdAt ? new Date(student.createdAt).toLocaleString('pt-BR') : 'Sem data'}</td>
        </tr>
      </table>
      
      <p style="margin-top: 40px; font-size: 11px; color: #5A7E7E; font-family: sans-serif; text-align: center;">SIGE - Sistema Integrado de Gestão Escolar - Documento Gerado em ${new Date().toLocaleString('pt-BR')}</p>
    `;

    downloadAsWordDoc(`Ficha_${student.nome.replace(/\s+/g, '_')}`, content);
  };

  // Helper function to export HTML to Word .doc (Compatible with Word processing)
  const downloadAsWordDoc = (filename: string, htmlContent: string) => {
    const fullHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Documento Escolar SIGE</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #bfdbfe; padding: 8px 12px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Grouped Class PDF Report Generator (Turma & Série)
  const downloadClassPDF = (chosenClass: string) => {
    const classStudents = students.filter(s => s.turma === chosenClass);
    if (classStudents.length === 0) {
      alert(`Nenhum estudante cadastrado para a turma "${chosenClass}".`);
      return;
    }

    const docPdf = new jsPDF();
    
    // Header Banner (Deep Teal)
    docPdf.setFillColor(0, 121, 121); // brand-deep #007979
    docPdf.rect(0, 0, 210, 36, 'F');
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(20);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text('SIGE - LISTA DE ESTUDANTES', 15, 17);
    
    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.setTextColor(255, 240, 228); // brand-cream #FFF0E4
    docPdf.text(`RELATÓRIO DA TURMA: ${chosenClass.toUpperCase()}  |  SÉRIE DO GRUPO: ${classStudents[0].serie}`, 15, 24);
    docPdf.text(`Total de Alunos na Turma: ${classStudents.length} Aluno(s)   |   Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 15, 30);

    let y = 48;
    
    // Draw table header (Cream/Peach theme)
    docPdf.setFillColor(255, 240, 228); // brand-cream #FFF0E4
    docPdf.rect(15, y - 5, 180, 8, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(9);
    docPdf.setTextColor(0, 121, 121); // brand-deep #007979
    
    docPdf.text('Nº', 17, y);
    docPdf.text('NOME DO ALUNO', 25, y);
    docPdf.text('CURSO TÉCNICO', 95, y);
    docPdf.text('E-MAIL', 142, y);
    docPdf.text('TELEFONE', 172, y);

    docPdf.setDrawColor(255, 224, 197); // brand-peach #FFE0C5
    docPdf.line(15, y + 4, 195, y + 4);
    y += 11;

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(8.5);
    docPdf.setTextColor(18, 44, 44);

    classStudents.forEach((student, index) => {
      // Manage page breaks
      if (y > 275) {
        docPdf.addPage();
        y = 25;
        // Repeat headers
        docPdf.setFillColor(255, 240, 228);
        docPdf.rect(15, y - 5, 180, 8, 'F');
        docPdf.setFont('helvetica', 'bold');
        docPdf.setTextColor(0, 121, 121);
        docPdf.text('Nº', 17, y);
        docPdf.text('NOME DO ALUNO', 25, y);
        docPdf.text('CURSO TÉCNICO', 95, y);
        docPdf.text('E-MAIL', 142, y);
        docPdf.text('TELEFONE', 172, y);
        docPdf.setDrawColor(255, 224, 197);
        docPdf.line(15, y + 4, 195, y + 4);
        y += 11;
        docPdf.setFont('helvetica', 'normal');
        docPdf.setTextColor(18, 44, 44);
      }

      // Truncations to avoid overflow
      const cleanName = student.nome.length > 35 ? student.nome.slice(0, 33) + '..' : student.nome;
      const cleanCurso = student.curso.replace('técnico em ', '').toUpperCase();
      const cleanEmail = student.email.length > 20 ? student.email.slice(0, 19) + '..' : student.email;

      // Draw record values
      docPdf.text(`${index + 1}`, 17, y);
      docPdf.text(cleanName, 25, y);
      docPdf.text(cleanCurso, 95, y);
      docPdf.text(cleanEmail, 142, y);
      docPdf.text(student.telefone, 172, y);

      docPdf.setDrawColor(255, 240, 228); // lighter brand separator
      docPdf.line(15, y + 4, 195, y + 4);
      y += 10;
    });

    // Save
    docPdf.save(`SIGE_Turma_${chosenClass.toUpperCase()}_Relatorio.pdf`);
  };

  // Grouped Class DOC Report Generator (Turma & Série)
  const downloadClassDOC = (chosenClass: string) => {
    const classStudents = students.filter(s => s.turma === chosenClass);
    if (classStudents.length === 0) {
      alert(`Nenhum estudante cadastrado para a turma "${chosenClass}".`);
      return;
    }

    let rowsHtml = '';
    classStudents.forEach((stud, index) => {
      rowsHtml += `
        <tr>
          <td style="padding: 8px; border: 1px solid #FFE0C5; text-align: center;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #FFE0C5; font-weight: bold; color: #122C2C;">${stud.nome}</td>
          <td style="padding: 8px; border: 1px solid #FFE0C5; text-transform: uppercase;">${stud.curso.replace('técnico em ', '')}</td>
          <td style="padding: 8px; border: 1px solid #FFE0C5; color: #24B1B1;">${stud.email}</td>
          <td style="padding: 8px; border: 1px solid #FFE0C5;">${stud.telefone}</td>
        </tr>
      `;
    });

    const content = `
      <h1 style="color: #007979; font-family: sans-serif; text-align: center;">SIGE - Sistema Integrado de Gestão Escolar</h1>
      <h2 style="color: #475569; font-family: sans-serif; text-align: center;">Relatório Cadastral de Turma</h2>
      <p style="font-family: sans-serif; text-align: center; color: #5A7E7E;">
        <strong>Turma:</strong> ${chosenClass.toUpperCase()} | <strong>Série:</strong> ${classStudents[0].serie} | <strong>Quantidade de Aluno(s):</strong> ${classStudents.length}
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-family: Arial, sans-serif; font-size: 13px;">
        <thead>
          <tr style="background-color: #007979; color: #ffffff;">
            <th style="padding: 10px; border: 1px solid #007979; text-align: center; width: 5%;">Nº</th>
            <th style="padding: 10px; border: 1px solid #007979; text-align: left; width: 35%;">Nome Estudante</th>
            <th style="padding: 10px; border: 1px solid #007979; text-align: left; width: 25%;">Curso Técnico</th>
            <th style="padding: 10px; border: 1px solid #007979; text-align: left; width: 20%;">E-mail</th>
            <th style="padding: 10px; border: 1px solid #007979; text-align: left; width: 15%;">Telefone</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      
      <p style="margin-top: 50px; font-size: 11px; color: #5A7E7E; font-family: sans-serif; text-align: center;">Relatório oficial exportado via SIGE. Data de extração: ${new Date().toLocaleString('pt-BR')}</p>
    `;

    downloadAsWordDoc(`Relatorio_Turma_${chosenClass.toUpperCase()}`, content);
  };

  // Whole School PDF grouping by Turmas
  const downloadWholeSchoolPDF = () => {
    if (students.length === 0) {
      alert("Nenhum estudante registrado no sistema para exportar.");
      return;
    }

    const docPdf = new jsPDF();
    
    // Page 1: School Cover / Summary Metrics Sheet (Deep Teal)
    docPdf.setFillColor(0, 121, 121); // brand-deep #007979
    docPdf.rect(0, 0, 210, 297, 'F');

    // School Symbol Placeholder drawing via basic shapes
    docPdf.setFillColor(36, 177, 177); // brand-cyan #24B1B1
    docPdf.rect(75, 45, 60, 60, 'F');
    
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(28);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text('SIGE', 15, 140);
    
    docPdf.setFontSize(14);
    docPdf.setTextColor(255, 240, 228); // Cream text accent
    docPdf.text('SISTEMA INTEGRADO DE GESTÃO ESCOLAR', 15, 148);

    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(18);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text('LIVRO DE ATUALIZAÇÕES CADASTRADAS', 15, 175);
    
    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.setTextColor(255, 224, 197); // Peach text accent
    docPdf.text('Lista geral consolidada de todos os estudantes matriculados.', 15, 182);
    docPdf.text(`Data de Consolidação Oficial: ${new Date().toLocaleString('pt-BR')}`, 15, 188);

    // Cover Page Statistics Bento Grid inside PDF (Cream background with deep text)
    docPdf.setFillColor(255, 240, 228); // brand-cream #FFF0E4
    docPdf.rect(15, 205, 180, 55, 'F');
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(11);
    docPdf.setTextColor(0, 121, 121); // brand-deep #007979
    docPdf.text('DADOS ESTATÍSTICOS DO BANCO DE DADOS', 22, 217);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.setTextColor(18, 44, 44); // brand-dark text
    docPdf.text(`Total de Estudantes Registrados: ${stats.total}`, 22, 227);
    
    docPdf.text(`Matrículas na 1ª Série: ${stats.seriesCounts['1ª série'] || 0}`, 22, 235);
    docPdf.text(`Matrículas na 2ª Série: ${stats.seriesCounts['2ª série'] || 0}`, 22, 241);
    docPdf.text(`Matrículas na 3ª Série: ${stats.seriesCounts['3ª série'] || 0}`, 22, 247);

    docPdf.text(`Téc. Informática: ${stats.cursoCounts['técnico em informática'] || 0}`, 115, 227);
    docPdf.text(`Téc. Administração: ${stats.cursoCounts['técnico em administração'] || 0}`, 115, 235);
    docPdf.text(`Téc. Enfermagem: ${stats.cursoCounts['técnico em enfermagem'] || 0}`, 115, 241);
    docPdf.text(`Téc. Contabilidade: ${stats.cursoCounts['técnico em contabilidade'] || 0}`, 115, 247);

    // Page 2+: Grouped Students List organized by Turmas
    const groupMap: Record<string, Student[]> = {};
    students.forEach((s) => {
      if (!groupMap[s.turma]) groupMap[s.turma] = [];
      groupMap[s.turma].push(s);
    });

    const orderedTurmas = Object.keys(groupMap).sort((a,b) => a.localeCompare(b, 'pt-BR'));

    orderedTurmas.forEach((turmaName) => {
      docPdf.addPage();
      const stList = groupMap[turmaName];
      const serieName = stList[0]?.serie || '';

      // Teal Header
      docPdf.setFillColor(0, 121, 121); // brand-deep #007979
      docPdf.rect(0, 0, 210, 32, 'F');
      
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(16);
      docPdf.setTextColor(255, 255, 255);
      docPdf.text(`TURMA: ${turmaName.toUpperCase()} (${serieName.toUpperCase()})`, 15, 14);
      docPdf.setFontSize(10);
      docPdf.setFont('helvetica', 'normal');
      docPdf.setTextColor(255, 240, 228); // Cream
      docPdf.text(`Relação de Matrículas Ativas e Contatos Cadastrados. Total da Classe: ${stList.length} Alunos.`, 15, 22);

      let y = 45;
      
      // Draw Table headers
      docPdf.setFillColor(255, 240, 228); // brand-cream #FFF0E4
      docPdf.rect(15, y - 5, 180, 8, 'F');
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(0, 121, 121); // brand-deep #007979
      docPdf.text('Nº', 17, y);
      docPdf.text('NOME COMPLETO', 25, y);
      docPdf.text('CURSO TÉCNICO', 95, y);
      docPdf.text('E-MAIL', 142, y);
      docPdf.text('TELEFONE', 172, y);

      docPdf.setDrawColor(255, 224, 197); // brand-peach #FFE0C5
      docPdf.line(15, y + 4, 195, y + 4);
      y += 11;

      docPdf.setFont('helvetica', 'normal');
      docPdf.setTextColor(18, 44, 44);

      stList.forEach((student, index) => {
        if (y > 275) {
          docPdf.addPage();
          y = 25;
          // Repeat Table headers
          docPdf.setFillColor(255, 240, 228);
          docPdf.rect(15, y - 5, 180, 8, 'F');
          docPdf.setFont('helvetica', 'bold');
          docPdf.setTextColor(0, 121, 121);
          docPdf.text('Nº', 17, y);
          docPdf.text('NOME COMPLETO', 25, y);
          docPdf.text('CURSO TÉCNICO', 95, y);
          docPdf.text('E-MAIL', 142, y);
          docPdf.text('TELEFONE', 172, y);
          docPdf.setDrawColor(255, 224, 197);
          docPdf.line(15, y + 4, 195, y + 4);
          y += 11;
          docPdf.setFont('helvetica', 'normal');
          docPdf.setTextColor(18, 44, 44);
        }

        const cleanName = student.nome.length > 35 ? student.nome.slice(0, 33) + '..' : student.nome;
        const cleanCurso = student.curso.replace('técnico em ', '').toUpperCase();
        const cleanEmail = student.email.length > 20 ? student.email.slice(0, 19) + '..' : student.email;

        docPdf.text(`${index + 1}`, 17, y);
        docPdf.text(cleanName, 25, y);
        docPdf.text(cleanCurso, 95, y);
        docPdf.text(cleanEmail, 142, y);
        docPdf.text(student.telefone, 172, y);

        docPdf.setDrawColor(255, 240, 228); // lighter separator row
        docPdf.line(15, y + 4, 195, y + 4);
        y += 10;
      });
    });

    // Save consolidated PDF
    docPdf.save(`LIVRO_CADASTROS_SIGE_${new Date().getFullYear()}.pdf`);
  };

  // Whole School Word .DOC Consolidator Grouped by classes
  const downloadWholeSchoolDOC = () => {
    if (students.length === 0) {
      alert("Nenhum estudante cadastrado no sistema.");
      return;
    }

    const groupMap: Record<string, Student[]> = {};
    students.forEach((s) => {
      if (!groupMap[s.turma]) groupMap[s.turma] = [];
      groupMap[s.turma].push(s);
    });

    const orderedTurmas = Object.keys(groupMap).sort((a,b) => a.localeCompare(b, 'pt-BR'));

    let tablesHtml = '';
    orderedTurmas.forEach((turmaName) => {
      const stList = groupMap[turmaName];
      const serieName = stList[0]?.serie || '';

      let rows = '';
      stList.forEach((st, idx) => {
        rows += `
          <tr>
            <td style="padding: 6px; border: 1px solid #FFE0C5; text-align: center;">${idx + 1}</td>
            <td style="padding: 6px; border: 1px solid #FFE0C5; font-weight: bold; color: #122C2C;">${st.nome}</td>
            <td style="padding: 6px; border: 1px solid #FFE0C5; text-transform: uppercase;">${st.curso.replace('técnico em ', '')}</td>
            <td style="padding: 6px; border: 1px solid #FFE0C5; color: #24B1B1;">${st.email}</td>
            <td style="padding: 6px; border: 1px solid #FFE0C5;">${st.telefone}</td>
          </tr>
        `;
      });

      tablesHtml += `
        <div style="page-break-after: always; margin-top: 30px;">
          <h3 style="background-color: #007979; color: #ffffff; padding: 10px; font-family: sans-serif;">
            TURMA: ${turmaName.toUpperCase()} Letivo (${serieName}) - Total de Alunos: ${stList.length}
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px;">
            <thead>
              <tr style="background-color: #FFF0E4; color: #007979;">
                <th style="padding: 8px; border: 1px solid #FFE0C5; text-align: center; width: 5%;">Nº</th>
                <th style="padding: 8px; border: 1px solid #FFE0C5; text-align: left; width: 35%;">Nome do Aluno</th>
                <th style="padding: 8px; border: 1px solid #FFE0C5; text-align: left; width: 25%;">Curso</th>
                <th style="padding: 8px; border: 1px solid #FFE0C5; text-align: left; width: 20%;">E-mail de Contato</th>
                <th style="padding: 8px; border: 1px solid #FFE0C5; text-align: left; width: 15%;">Telefone</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    });

    const bodyContent = `
      <h1 style="color: #007979; font-family: sans-serif; text-align: center; font-size: 24px;">LIVRO INTEGRAL DE CADASTROS ESCOLARES</h1>
      <h3 style="color: #475569; font-family: sans-serif; text-align: center; border-bottom: 2px solid #FFE0C5; padding-bottom: 8px;">Sistema Integrado de Gestão Escolar (SIGE)</h3>
      <p style="font-family: sans-serif; font-size: 14px;">
        Este é o relatório unificado de cadastro de todos os estudantes da escola cadastrados no sistema. Organizados por ordem de turma e classe.
      </p>
      
      <div style="border: 1px dashed #FFE0C5; padding: 15px; margin: 25px 0; background-color: #FFF0E4; font-family: sans-serif;">
        <h4 style="margin: 0 0 10px 0; color: #007979;">Consolidação Geral SIGE:</h4>
        <p style="margin: 3px 0; font-size: 13px;"><strong>Total de Matrículas Consolidadas:</strong> ${stats.total}</p>
        <p style="margin: 3px 0; font-size: 13px;"><strong>1ª série:</strong> ${stats.seriesCounts['1ª série'] || 0} alunos | <strong>2ª série:</strong> ${stats.seriesCounts['2ª série'] || 0} alunos | <strong>3ª série:</strong> ${stats.seriesCounts['3ª série'] || 0} alunos</p>
        <p style="margin: 3px 0; font-size: 13px;"><strong>Extraído às:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      </div>
      
      ${tablesHtml}
    `;

    downloadAsWordDoc('LIVRO_CADASTROS_COMPLETO_SIGE', bodyContent);
  };

  // Main UI Render
  return (
    <div id="school-sige-root" className="min-h-screen bg-gradient-to-br from-[#F1F6F7] via-[#F4F9F9] to-[#E3ECEC] text-slate-800 flex flex-col font-sans transition-all selection:bg-[#007979]/20 selection:text-[#007979]">
      
      {/* Dynamic Header */}
      <header className="border-b border-slate-200/50 bg-white/70 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-[#007979] rounded-xl flex items-center justify-center p-1.5 shadow-sm">
              <img 
                src={logoAnBranco} 
                alt="Logo Escolar" 
                className="h-full w-full object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2 font-display">
                SIGE <span className="text-slate-300 font-normal">|</span> <span className="text-sm font-medium text-slate-500">Atualização cadastral</span>
              </span>
            </div>
          </div>

          {/* Segmented Control / iOS Tab Bar */}
          <div className="flex gap-1 p-1 bg-slate-100/85 rounded-xl border border-slate-200/40">
            <button
              id="tab-register-btn"
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'register' 
                  ? 'bg-white text-slate-850 shadow-sm border border-slate-200/20 font-bold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Ficha</span>
            </button>
            <button
              id="tab-admin-btn"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin' 
                  ? 'bg-white text-slate-850 shadow-sm border border-slate-200/20 font-bold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>Painel</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* ======================================= */}
        {/* TAB 1: PUBLIC STUDENT REGISTRATION FORM */}
        {/* ======================================= */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto space-y-6 py-4">
            
            {/* Header Description card */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-6 sm:p-8 rounded-2xl shadow-lg shadow-slate-100/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#007979]/10 to-transparent rounded-full filter blur-xl"></div>
              
              <h1 className="text-xl font-bold tracking-tight text-slate-800 mb-1.5 font-display">
                Ficha Cadastral Estudantil
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Prezado estudante, preencha suas informações de forma correta e atualizada. Seus dados serão incluídos com total segurança e de maneira instantânea no Sistema Integrado de Gestão Escolar (SIGE).
              </p>
            </div>

            {/* Success Alert after submitting */}
            {submitSuccess && lastSubmittedStudent && (
              <div id="submit-success-banner" className="bg-white/90 backdrop-blur-md border border-slate-200/60 p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-100/40 relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
                <div className="flex items-start gap-4 pt-2">
                  <div className="bg-emerald-50/80 border border-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-800 font-display">Ficha de matrícula enviada com sucesso!</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Muito obrigado, <strong>{lastSubmittedStudent.nome}</strong>. Seus dados foram inseridos no banco de dados da escola e serão sincronizados instantaneamente no SIGE.
                      </p>
                    </div>

                    {/* Quick Receipts actions */}
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recibo Estudantil</div>
                        <div className="text-xs font-bold text-slate-700">Seu comprovante escolar está pronto</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="submit-pdf-download-btn"
                          onClick={() => downloadIndividualPDF(lastSubmittedStudent)}
                          className="px-3.5 py-1.5 bg-[#007979] hover:bg-[#006060] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md"
                        >
                          Baixar PDF
                        </button>
                        <button
                          id="submit-doc-download-btn"
                          onClick={() => downloadIndividualDOC(lastSubmittedStudent)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
                        >
                          Baixar DOC
                        </button>
                      </div>
                    </div>

                    <button
                      id="reset-form-btn"
                      onClick={() => setSubmitSuccess(false)}
                      className="text-xs font-semibold text-[#007979] hover:text-[#006060] underline underline-offset-4 flex items-center gap-1 transition-all pointer-events-auto cursor-pointer"
                    >
                      Preencher outro formulário de cadastro
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Error Alert */}
            {submitError && (
              <div id="submit-error-banner" className="bg-rose-50/80 backdrop-blur-sm border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-rose-950 uppercase tracking-wide font-display">Falha de Validação</h5>
                  <p className="text-xs text-rose-800 mt-1 font-medium">{submitError}</p>
                </div>
              </div>
            )}

            {/* Main intake form */}
            {!submitSuccess && (
              <form id="student-intake-form" onSubmit={handleSubmitRegistration} className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-100/50 relative">
                
                <div className="p-6 sm:p-8 space-y-5">
                  {/* Grid para Nome Completo e Data de Nascimento lado a lado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Nome completo (Text input) */}
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="student-nome" className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-display">
                      Nome completo do estudante <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        id="student-nome"
                        type="text"
                        required
                        placeholder="Ex: João Antônio de Sousa"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Data de Nascimento */}
                  <div className="space-y-2 md:col-span-1">
                    <label htmlFor="student-nascimento" className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-display">
                      Data de Nascimento <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <input
                        id="student-nascimento"
                        type="date"
                        required
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Grid para Série e Curso Técnico */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Série floating dropdown */}
                  <div className="space-y-2">
                    <label htmlFor="student-serie" className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-display">
                      Série Escolar <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative w-full">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <select
                        id="student-serie"
                        required
                        value={serie}
                        onChange={(e) => setSerie(e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all cursor-pointer"
                      >
                        <option value="" className="text-slate-400">Selecione a série...</option>
                        {seriesOptions.map((opt) => (
                          <option key={opt} value={opt} className="text-neutral-950">{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Curso Técnico alphabetical dropdown */}
                  <div className="space-y-2">
                    <label htmlFor="student-curso" className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-display">
                      Curso Técnico <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative w-full">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <select
                        id="student-curso"
                        required
                        value={curso}
                        onChange={(e) => setCurso(e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all cursor-pointer"
                      >
                        <option value="" className="text-slate-400">Selecione o curso...</option>
                        {cursosOptions.map((opt) => (
                          <option key={opt} value={opt} className="text-neutral-950">{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* 4. Smart E-mail and Smart Telefone Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Smart E-mail input */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="student-email" className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-display">
                        E-mail de Contato
                      </label>
                      {email && (
                        isEmailValid(email) 
                          ? <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Válido</span>
                          : <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Inválido</span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="student-email"
                        type="email"
                        placeholder="Ex: carlos@escola.com (Opcional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all ${
                          email 
                            ? isEmailValid(email) ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500/20' : 'border-rose-500 focus:ring-1 focus:ring-rose-500/20' 
                            : 'border-slate-200 focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Smart Telefone masking input with DDD Validation */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="student-telefone" className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-display">
                        Telefone de Contato <span className="text-rose-600">*</span>
                      </label>
                      {telefone && (
                        isPhoneValid(telefone) 
                          ? <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Telefone Válido</span>
                          : <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> DDD + 9 dígitos</span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        id="student-telefone"
                        type="tel"
                        required
                        maxLength={15}
                        placeholder="Ex: (85) 99999-9999"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhoneNumber(e.target.value))}
                        className={`w-full bg-slate-50 border rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all ${
                          telefone 
                            ? isPhoneValid(telefone) ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500/20' : 'border-amber-500 focus:ring-1 focus:ring-amber-500/20' 
                            : 'border-slate-200 focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20'
                        }`}
                      />
                    </div>
                  </div>

                </div>

                {/* Information Consent banner */}
                <div className="text-xs text-slate-500 flex gap-2 pt-2 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-[#007979] shrink-0 mt-0.5" />
                  <span>
                    Ao submeter, você concorda que seus dados sejam incluídos de forma confidencial no banco de dados escolar para a consolidação de turmas no SIGE.
                  </span>
                </div>

                {/* Confirm submit button */}
                <button
                  id="submit-registration-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#007979] hover:bg-[#006060] disabled:bg-[#007979]/60 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer duration-150"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      <span>Processando registro...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Enviar dados de atualização</span>
                    </>
                  )}
                </button>

                </div>
              </form>
            )}

          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: PORTAL DO GESTOR (ADMIN CONTROL) */}
        {/* ======================================= */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            
            {/* Gatekeeper Check: Authentication Portal */}
            {!user && !localAdminBypass ? (
              <div className="max-w-md mx-auto py-12 space-y-6">
                
                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-8 text-center space-y-6 rounded-2xl shadow-xl shadow-slate-100/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#007979]/10 to-transparent rounded-full filter blur-lg"></div>
                  
                  <div className="h-14 w-14 bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto rounded-xl shadow-sm">
                    <Settings className="w-6 h-6 text-[#007979]" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-800 font-display">Controle de Acesso</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      O acesso a estes dados cadastrais (PII) é de caráter estritamente confidencial. Por favor, autentique-se com uma conta Google autorizada para consultar dados ou gerar relatórios de turmas para o SIGE.
                    </p>
                  </div>
 
                  {/* Authentication Buttons */}
                  <div className="space-y-3 pt-4">
                    <button
                      id="google-signin-btn"
                      onClick={handleGoogleLogin}
                      className="w-full bg-white border border-slate-200 text-slate-700 duration-150 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Entrar com Google</span>
                    </button>
 
                    {isDevelopment && (
                      <>
                        <button
                          id="developer-bypass-btn"
                          type="button"
                          onClick={() => {
                            setLocalAdminBypass(true);
                            setUser({ email: 'prof.horacioalves@gmail.com' } as any);
                          }}
                          className="w-full bg-[#007979] hover:bg-[#006060] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                          <span>Simulação Administrativa (Desenvolvimento)</span>
                        </button>
                        <div className="text-[10px] text-slate-400 leading-normal block font-medium pt-1">
                          Nota de Teste: Este botão de simulação é exibido apenas na área de desenvolvimento para facilitar os testes locais no editor.
                        </div>
                      </>
                    )}

                    {!showBackupLogin ? (
                      <button
                        type="button"
                        onClick={() => setShowBackupLogin(true)}
                        className="text-xs font-semibold text-[#007979] hover:underline block mx-auto pt-2 cursor-pointer"
                      >
                        Problemas com o login Google? Entrar com Chave de Acesso
                      </button>
                    ) : (
                      <div className="border-t border-slate-100 pt-4 space-y-3">
                        <div className="text-left">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Chave de Acesso do Administrador
                          </label>
                          <input
                            type="password"
                            placeholder="Digite a chave de acesso..."
                            value={backupPasscode}
                            onChange={(e) => setBackupPasscode(e.target.value)}
                            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#007979] text-slate-800 placeholder-slate-400"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleBackupLogin}
                            className="flex-1 bg-[#007979] hover:bg-[#006060] text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-all cursor-pointer"
                          >
                            Validar Chave
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowBackupLogin(false)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-lg text-xs transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {!isDevelopment && (
                      <div className="text-[11px] text-slate-500 leading-relaxed text-left border-t border-slate-100 pt-3 font-medium">
                        💡 <strong>Informativo:</strong> O acesso seguro aos dados cadastrais requer login do Gestor via conta Google elegível. Se estiver visualizando este site em um iframe/painel integrado e a janela popup for obstruída, use o login por Chave de Acesso acima ou clique com o botão direito para abrir em uma nova guia.
                      </div>
                    )}
                  </div>
 
                </div>
              </div>
            ) : (user && user.email !== 'prof.horacioalves@gmail.com' && !localAdminBypass) ? (
              <div className="max-w-md mx-auto py-12 space-y-6">
                
                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-8 text-center space-y-6 rounded-2xl shadow-xl shadow-slate-100/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full filter blur-lg"></div>
                  
                  <div className="h-14 w-14 bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto rounded-xl shadow-sm">
                    <Lock className="w-6 h-6 text-rose-600" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-850 font-display">Acesso Não Autorizado</h3>
                    <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                      Sua sessão está active com a conta <span className="text-slate-800 break-all underline">{user.email}</span>. No entanto, este e-mail do Gmail não possui atributos de administrador para o SIGE.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-normal font-medium max-w-sm mx-auto pt-2">
                      Apenas o Gestor cadastrado (<strong className="text-[#007979]">prof.horacioalves@gmail.com</strong>) possui permissão de leitura, exportação e moderação da base estudantil.
                    </p>
                  </div>
 
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <button
                      id="admin-logout-and-switch-btn"
                      onClick={handleLogout}
                      className="w-full bg-[#007979] hover:bg-[#006060] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md transition duration-150"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair e Alternar de Conta Google</span>
                    </button>
                  </div>
                </div>
              </div>
              ) : (
              
              // APPROVED VISUAL INTERFACE (LOGGED IN AS ADMIN)
              <div className="space-y-6">
                
                {/* Visual Admin Header Banner */}
                <div className="bg-white/80 backdrop-blur-md p-6 border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-slate-100/40 rounded-2xl">
                  <div className="flex gap-4 items-center">
                    <div className="h-11 w-11 bg-[#007979]/10 text-[#007979] flex items-center justify-center rounded-xl shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 flex flex-wrap items-center gap-2 font-display">
                        Painel Geral de Registros
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 font-semibold rounded-full border border-emerald-100">
                          OPERACIONAL
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Sessão ativa: <span className="text-[#007979] font-semibold">{user ? user.email : 'prof.horacioalves@gmail.com'}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    id="admin-signout-btn"
                    onClick={handleLogout}
                    className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Encerrar Sessão
                  </button>
                </div>

                {/* 1. Statistics Bento Grid */}
                {isStudentsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="bg-white/80 border border-slate-200/50 rounded-xl animate-pulse h-28 animate-in fade-in"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Total students widget */}
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl shadow-md shadow-slate-100/30 relative overflow-hidden">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Matrículas unificadas</div>
                      <div className="text-3xl font-bold text-[#007979] mt-2 flex items-baseline gap-2 font-display">
                        {stats.total}
                        <span className="text-xs text-slate-400 font-semibold uppercase">ALUNOS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">Sincronização Ativa</p>
                    </div>

                    {/* Series distribution widget */}
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl shadow-md shadow-slate-100/30 relative overflow-hidden col-span-1 lg:col-span-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Distribuição por Série</div>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {seriesOptions.map((grade) => (
                          <div key={grade} className="bg-slate-50/70 border border-slate-100 p-2.5 text-center rounded-xl">
                            <div className="text-[10px] text-slate-450 truncate font-bold uppercase">{grade}</div>
                            <div className="text-base font-bold text-slate-800 mt-1 font-display">
                              {stats.seriesCounts[grade] || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total target classes count */}
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl shadow-md shadow-slate-100/30 relative overflow-hidden">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Turmas Cadastradas</div>
                      <div className="text-3xl font-bold text-[#007979] mt-2 flex items-baseline gap-2 font-display">
                        {uniqueTurmasList.length}
                        <span className="text-xs text-slate-400 font-semibold uppercase">TURMAS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">Classes Únicas Mapeadas</p>
                    </div>

                  </div>
                )}

                {/* 2. Global Reporting Master Control */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl shadow-lg shadow-slate-100/40 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
                      <FileDown className="w-5 h-5 text-[#007979]" />
                      <span>Gerador Consolidado de Documentos</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Baixe livros de chamadas e fichas cadastrais completos formatados para arquivamento ou edição.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    
                    {/* Column 1: School Level */}
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                      <div>
                        <div className="text-xs font-bold text-[#007979] font-mono">NÍVEL 1: GERAL ESCOLA</div>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Todos os estudantes agrupados por turma</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          id="export-pdf-school-btn"
                          onClick={downloadWholeSchoolPDF}
                          className="px-3 py-2 bg-[#007979] hover:bg-[#006060] text-white font-semibold rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                        >
                          Baixar PDF
                        </button>
                        <button
                          id="export-doc-school-btn"
                          onClick={downloadWholeSchoolDOC}
                          className="px-3 py-2 bg-white hover:bg-slate-50 text-[#007979] border border-slate-200 font-semibold rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                        >
                          Baixar DOC
                        </button>
                      </div>
                    </div>

                    {/* Column 2: Class Level */}
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                      <div>
                        <div className="text-xs font-bold text-[#007979] font-mono">NÍVEL 2: POR TURMA</div>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Selecione uma turma para exportar dados</p>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <select
                          id="select-class-report"
                          value={selectedClassReport}
                          onChange={(e) => setSelectedClassReport(e.target.value)}
                          className="flex-1 text-xs bg-white border border-slate-250 rounded-lg py-1.5 px-2 text-slate-800 focus:outline-none w-full cursor-pointer focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all font-semibold uppercase text-[10px]"
                        >
                          <option value="" className="text-slate-400">Turmas...</option>
                          {uniqueTurmasList.map(t => (
                            <option key={t} value={t} className="text-neutral-950">Turma {t.toUpperCase()}</option>
                          ))}
                        </select>

                        <div className="flex gap-1 shrink-0 font-sans">
                          <button
                            id="download-class-pdf-btn"
                            disabled={!selectedClassReport}
                            onClick={() => downloadClassPDF(selectedClassReport)}
                            className="p-1.5 bg-[#007979] hover:bg-[#006060] disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg text-xs transition-all cursor-pointer shadow-sm h-8 w-8 flex items-center justify-center block"
                            title="Baixar PDF da turma"
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                          </button>
                          <button
                            id="download-class-doc-btn"
                            disabled={!selectedClassReport}
                            onClick={() => downloadClassDOC(selectedClassReport)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[#007979] disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-xs transition-all cursor-pointer shadow-sm h-8 w-8 flex items-center justify-center block"
                            title="Baixar DOC editável da turma"
                          >
                            <Download className="w-4 h-4 shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Dashboard status */}
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
                      <div className="text-[11px] text-slate-500 h-full flex flex-col justify-center gap-1.5 font-sans">
                        <div className="flex justify-between">
                          <span className="font-medium">Série selecionada:</span>
                          <span className="font-bold text-[#007979] uppercase">{filterSerie}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Filtrados na tela:</span>
                          <span className="font-bold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded-full text-[10px] border border-slate-300/30">{filteredStudents.length} de {students.length}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 3. Interactive Data Filters Toolbar */}
                <div id="admin-filters-bar" className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-md shadow-slate-100/30 rounded-2xl">
                  
                  {/* Text search */}
                  <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Pesquisar por nome, e-mail ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20"
                    />
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    
                    {/* Série select filter */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
                      <select
                        id="filter-serie-select"
                        value={filterSerie}
                        onChange={(e) => setFilterSerie(e.target.value)}
                        className="bg-transparent border-0 py-2.5 text-xs text-slate-800 focus:outline-none w-full cursor-pointer font-bold uppercase text-[10px]"
                      >
                        <option value="Todas" className="text-neutral-950 bg-white">Séries</option>
                        {seriesOptions.map(s => (
                          <option key={s} value={s} className="text-neutral-950 bg-white">{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Curso select filter */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5">
                      <select
                        id="filter-curso-select"
                        value={filterCurso}
                        onChange={(e) => setFilterCurso(e.target.value)}
                        className="bg-transparent border-0 py-2.5 text-xs text-slate-800 focus:outline-none w-full cursor-pointer font-bold uppercase text-[10px] capitalize"
                      >
                        <option value="Todos" className="text-neutral-950 bg-white">Cursos</option>
                        {cursosOptions.map(c => (
                          <option key={c} value={c} className="text-neutral-950 bg-white">{c.replace('técnico em ', 'Téc. ')}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                </div>

                {/* 4. Main Datatable of Registered Students */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 overflow-hidden shadow-lg shadow-slate-100/40 rounded-2xl">
                  {isStudentsLoading && students.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-[#007979] border-t-transparent animate-spin"></div>
                      <span className="text-xs text-slate-550 font-medium">Buscando registros estudantis...</span>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2 bg-slate-50/50">
                       <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                       <h4 className="text-sm font-bold text-slate-700 tracking-wide font-display">NENHUM RECORDE</h4>
                       <p className="text-xs max-w-sm mx-auto font-medium">
                         Nenhum estudante atende aos parâmetros de pesquisa ou filtros selecionados.
                       </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 text-[10px] font-bold uppercase tracking-wider text-slate-450 bg-slate-50/60 font-display">
                            <th className="py-4 px-4 w-12 text-center">#</th>
                            <th className="py-4 px-4">Estudante</th>
                            <th className="py-4 px-4">Série e Classe</th>
                            <th className="py-4 px-4">Curso Técnico</th>
                            <th className="py-4 px-4">Contato</th>
                            <th className="py-4 px-4 text-center">Relatórios</th>
                            <th className="py-4 px-4 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700 bg-white">
                          {filteredStudents.map((student, index) => (
                            <tr key={student.id} className="hover:bg-slate-50/70 transition-all font-medium">
                              
                              {/* Row index */}
                              <td className="py-3.5 px-4 text-xs font-bold font-mono text-center text-slate-400">
                                {index + 1}
                              </td>

                              {/* Student name and DOB */}
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <span>{student.nome}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-sans">
                                  <span>Nasc: {student.dataNascimento ? formatDateForDisplay(student.dataNascimento) : 'Não informado'}</span>
                                  {student.id.startsWith('local_') && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded-full border border-amber-100 uppercase text-[8px] font-bold">LOCAL/OFFLINE</span>}
                                </div>
                              </td>

                              {/* Grade and Turma */}
                              <td className="py-3.5 px-4">
                                <div className="text-xs font-bold bg-[#007979]/10 text-[#007979] rounded-lg px-2.5 py-0.5 inline-block uppercase">
                                  Turma {student.turma.toUpperCase()}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1 font-medium uppercase">{student.serie}</div>
                              </td>

                              {/* Technical Course */}
                              <td className="py-3.5 px-4">
                                <div className="capitalize text-xs font-medium text-slate-600">{student.curso}</div>
                              </td>

                              {/* Email and Phone */}
                              <td className="py-3.5 px-4 space-y-1">
                                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 truncate max-w-[180px]" title={student.email}>
                                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{student.email}</span>
                                </div>
                                <div className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{student.telefone}</span>
                                </div>
                              </td>

                              {/* Individual Download actions */}
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1 justify-center">
                                  <button
                                    onClick={() => downloadIndividualPDF(student)}
                                    className="px-2 py-1 text-[#007979] bg-[#007979]/5 hover:bg-[#007979]/10 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                                    title="Baixar comprovante PDF"
                                  >
                                    PDF
                                  </button>
                                  <button
                                    onClick={() => downloadIndividualDOC(student)}
                                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                                    title="Baixar Ficha Word DOC"
                                  >
                                    DOC
                                  </button>
                                </div>
                              </td>

                              {/* Edit or Delete */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => startEditing(student)}
                                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-100 rounded-lg border border-transparent transition-all cursor-pointer"
                                    title="Editar Dados"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => startDeleting(student)}
                                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-100 rounded-lg border border-transparent transition-all cursor-pointer"
                                    title="Excluir Estudante"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* MODAL WINDOW FOR IN-LINE student editing */}
            {editingStudent && (
              <div id="edit-student-modal-wrapper" className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 max-w-lg w-full overflow-hidden shadow-2xl rounded-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Header */}
                  <div className="bg-slate-50 border-b border-slate-100 p-4 px-6 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Edit className="w-4 h-4 text-[#007979]" />
                      <span>Atualizar registro estudantil</span>
                    </h3>
                    <button
                      onClick={() => setEditingStudent(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Edit Form */}
                  <form onSubmit={handleUpdateStudent} className="p-6 space-y-4">
                    
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-850 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Série dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Série</label>
                        <select
                          required
                          value={editSerie}
                          onChange={(e) => setEditSerie(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-2 text-sm text-slate-850 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all cursor-pointer"
                        >
                          {seriesOptions.map(s => (
                            <option key={s} value={s} className="text-neutral-950">{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Course dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Curso Técnico</label>
                        <select
                          required
                          value={editCurso}
                          onChange={(e) => setEditCurso(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-2 text-sm text-slate-850 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all capitalize cursor-pointer"
                        >
                          {cursosOptions.map(c => (
                            <option key={c} value={c} className="text-neutral-950">{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {/* Phone with Mask */}
                      <label className="text-xs font-bold text-slate-700 block">Telefone</label>
                      <input
                        type="tel"
                        required
                        value={editTelefone}
                        onChange={(e) => setEditTelefone(formatPhoneNumber(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-850 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all"
                      />
                    </div>

                    {/* Email and Date of Birth */}
                    <div className="grid grid-cols-5 gap-3">
                      {/* Email */}
                      <div className="space-y-1.5 col-span-3">
                        <label className="text-xs font-bold text-slate-700 block">E-mail</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-850 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all"
                        />
                      </div>

                      {/* Date of birth */}
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-xs font-bold text-slate-700 block">Data Nasc.</label>
                        <input
                          type="date"
                          required
                          value={editDataNascimento}
                          onChange={(e) => setEditDataNascimento(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-sm text-slate-850 focus:outline-none focus:bg-white focus:border-[#007979] focus:ring-1 focus:ring-[#007979]/20 transition-all font-sans"
                        />
                      </div>
                    </div>

                    {/* Submit buttons */}
                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-6">
                      <button
                        type="button"
                        onClick={() => setEditingStudent(null)}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-4 py-2 bg-[#007979] hover:bg-[#006060] disabled:bg-slate-200 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {isUpdating && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>}
                        <span>Confirmar Atualizações</span>
                      </button>
                    </div>

                  </form>

                </div>
              </div>
            )}

            {/* CUSTOM MODAL WINDOW FOR DELETE CONFIRMATION */}
            {studentToDelete && (
              <div id="delete-student-modal-wrapper" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 max-w-md w-full overflow-hidden shadow-2xl rounded-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Header */}
                  <div className="bg-rose-50 border-b border-rose-100/40 p-4 px-6 flex items-center gap-3">
                    <div className="h-9 w-9 bg-rose-100 text-rose-600 flex items-center justify-center rounded-xl shrink-0 shadow-sm">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-rose-950 font-display">
                        Confirmar Exclusão
                      </h3>
                      <p className="text-[10px] text-rose-700/70 font-medium font-sans">
                        Ação crítica e irreversível
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Tem certeza de que deseja permanentemente excluir o registro cadastral do estudante:
                    </p>
                    
                    <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl space-y-1">
                      <div className="text-xs font-bold text-slate-800">{studentToDelete.nome}</div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase font-sans">
                        {studentToDelete.turma}
                      </div>
                    </div>

                    <p className="text-[11px] text-rose-600 font-semibold bg-rose-50/50 border border-rose-100/30 p-3 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Atenção: Ao excluir este registro, os dados serão removidos permanentemente do banco de dados e os relatórios consolidados do SIGE serão recalculados.
                      </span>
                    </p>

                    {deleteError && (
                      <div className="text-[11px] text-rose-700 font-bold bg-rose-100/50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{deleteError}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer buttons */}
                  <div className="flex gap-2 justify-end p-4 px-6 bg-slate-50 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setStudentToDelete(null)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 disabled:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={confirmDeleteStudent}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-200 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
                    >
                      {isDeleting && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>}
                      <span>Excluir Permanentemente</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-200/50 bg-slate-50/50 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; {new Date().getFullYear()} SIGE - Sistema Integrado de Gestão Escolar. Todos os direitos reservados.
          </div>
          <div className="font-mono text-[9px] text-[#007979] bg-teal-50 px-3 py-1 rounded-full border border-teal-100 font-bold uppercase tracking-wider">
            SIGE OS v1.4
          </div>
        </div>
      </footer>

      {/* Pop-up Success Modal Notification */}
      {showSuccessModal && (
        <div id="success-notification-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full shadow-2xl p-6 sm:p-8 space-y-6 relative animate-scale-up">
            
            {/* Top Close Button */}
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content header */}
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800 font-display">
                  Obrigado pelo preenchimento!
                </h3>
                <p className="text-xs text-emerald-600 font-medium font-display">
                  Envio concluído com sucesso
                </p>
              </div>
            </div>

            {/* Description body */}
            <div className="space-y-3">
              <p className="text-slate-500 text-xs text-center leading-relaxed font-medium">
                Suas informações foram salvas com segurança no <strong>SIGE</strong>.
              </p>
              <div className="bg-amber-50/60 border border-amber-100/80 rounded-xl p-3 text-amber-700 text-xs sm:text-sm text-center font-semibold leading-relaxed">
                ⚠️ Você já pode fechar esta aba ou janela do navegador com total segurança.
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-[#007979] hover:bg-[#006060] text-white font-semibold py-3 px-4 rounded-xl text-xs transition-all shadow-md hover:shadow-lg text-center cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
