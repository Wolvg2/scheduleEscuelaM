import { useState,useEffect,useCallback, use } from "react";
import { collection, query,where,onSnapshot,orderBy,getDocs,doc, getDoc,updateDoc, } from "firebase/firestore";
import { db } from '@/firebase/config';


export type Teacher = {
  id: string;
  name: string;
  email: string;
  subject: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  availableSlots?: Array<{ date: string; time: string }>;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'docente' | 'tutor' | 'admin';
  subject?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
};

export type AppointmentWithDetails = {
  id: string;
  tutorId: string;
  docenteId: string;
  docenteName: string;
  tutorName?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  reason: string;
  subject?: string;
  observations?: string;
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
};

export type UserStats = {
  totalUsers: number;
  totalTeachers: number;
  totalTutors: number;
  totalAdmins: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeUsers: number;
  inactiveUsers: number;
};

export type AppointmentStats = {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  todayAppointments: number;
  thisWeekAppointments: number;
  thisMonthAppointments: number;
};

export type TeacherAppointmentSummary = {
  teacherId: string;
  teacherName: string;
  subject: string;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  appointments: AppointmentWithDetails[];
};

export const useAdmin = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [allAppointments, setAllAppointments] = useState<AppointmentWithDetails[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [teacherAppointments, setTeacherAppointments] = useState<AppointmentWithDetails[]>([]);
    const [userStats, setUserStats] = useState<UserStats>({
      totalUsers: 0,
      totalTeachers: 0,
      totalTutors: 0,
      totalAdmins: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
    });

    const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        cancelledAppointments: 0,
        todayAppointments: 0,
        thisWeekAppointments: 0,
        thisMonthAppointments: 0,
    });

    const [loading, setLoading] = useState(true);
    const [loadingStates, setLoadingStates] = useState({
        teachers: true,
        users: true,
        appointments: true
    });

    // Helper function to check if all data is loaded
    const checkAllLoaded = useCallback(() => {
        const allLoaded = !loadingStates.teachers && !loadingStates.users && !loadingStates.appointments;
        if (allLoaded && loading) {
            console.log('✅ All data loaded, setting loading to false');
            setLoading(false);
        }
    }, [loadingStates, loading]);

    // Load teachers
    useEffect(() => {
        console.log('🔄 Loading teachers...');
        const teachersQuery = query(
            collection(db, 'users'),
            where('role', '==', 'docente'),
            orderBy('name', 'desc')
        );

        const unsubscribe = onSnapshot(teachersQuery, (snapshot) => {
            console.log('📚 Teachers loaded:', snapshot.docs.length);
            const teachersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isActive: doc.data().isActive ?? true
            })) as Teacher[];
            
            setTeachers(teachersData);
            setLoadingStates(prev => ({ ...prev, teachers: false }));
        }, (error) => {
            console.error("❌ Error fetching teachers:", error);
            setLoadingStates(prev => ({ ...prev, teachers: false }));
        });

        return unsubscribe; // ✅ Fixed: removed parentheses
    }, []);

    // Load all users
    useEffect(() => {
        console.log('🔄 Loading users...');
        const usersQuery = query(
            collection(db,'users'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            console.log('👥 Users loaded:', snapshot.docs.length);
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isActive: doc.data().isActive ?? true
            })) as User[];
            
            setUsers(usersData);
            setLoadingStates(prev => ({ ...prev, users: false }));
        }, (error) => {
            console.error("❌ Error fetching users:", error);
            setLoadingStates(prev => ({ ...prev, users: false }));
        });

        return unsubscribe; // ✅ Fixed: removed parentheses
    }, []);

    // Load appointments with tutor names
    useEffect(() => {
        console.log('🔄 Loading appointments...');
        const appointmentsQuery = query(
            collection(db, 'appointments'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(appointmentsQuery, async (snapshot) => {
            try {
                console.log('📅 Appointments loaded:', snapshot.docs.length);
                const appointmentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AppointmentWithDetails[];
 
                // Load tutor names in parallel
                const appointmentWithTutorNames = await Promise.all(
                    appointmentsData.map(async (appointment) => {
                        try {
                            const tutorDoc = await getDoc(doc(db, 'users', appointment.tutorId));
                            const tutorData = tutorDoc.data();
                            return {
                                ...appointment,
                                tutorName: tutorData ? tutorData.name : 'Usuario desconocido'
                            };
                        } catch (error) {
                            console.error('❌ Error fetching tutor name for appointment:', appointment.id, error);
                            return {
                                ...appointment,
                                tutorName: 'Usuario desconocido'
                            };
                        }
                    })
                );

                setAllAppointments(appointmentWithTutorNames);
                setLoadingStates(prev => ({ ...prev, appointments: false }));
            } catch (error) {
                console.error("❌ Error processing appointments:", error);
                setLoadingStates(prev => ({ ...prev, appointments: false }));
            }
        }, (error) => {
            console.error("❌ Error fetching appointments:", error);
            setLoadingStates(prev => ({ ...prev, appointments: false }));
        });

        return unsubscribe; // ✅ Fixed: removed parentheses
    }, []);

    // Check if all data is loaded whenever loading states change
    useEffect(() => {
        checkAllLoaded();
    }, [checkAllLoaded]);

    // Calculate user statistics
    useEffect(() => {
        if (users.length === 0) return;

        const stats: UserStats = {
            totalUsers: users.length,
            totalTeachers: users.filter(u => u.role === 'docente').length,
            totalTutors: users.filter(u => u.role === 'tutor').length,
            totalAdmins: users.filter(u => u.role === 'admin').length,
            verifiedUsers: users.filter(u => u.emailVerified === true).length,
            unverifiedUsers: users.filter(u => u.emailVerified === false).length,
            activeUsers: users.filter(u => u.isActive === true).length,
            inactiveUsers: users.filter(u => u.isActive === false).length,
        };

        setUserStats(stats);
    }, [users]);

    // Calculate appointment statistics
    useEffect(() => {
        if (allAppointments.length === 0) return;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const stats: AppointmentStats = {
            totalAppointments: allAppointments.length,
            pendingAppointments: allAppointments.filter(a => a.status === 'pending').length,
            confirmedAppointments: allAppointments.filter(a => a.status === 'confirmed').length,
            cancelledAppointments: allAppointments.filter(a => a.status === 'cancelled').length,
            todayAppointments: allAppointments.filter(a => {
                const appointmentDate = new Date(a.date);
                return appointmentDate >= today && appointmentDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
            }).length,
            thisWeekAppointments: allAppointments.filter(a => {
                const appointmentDate = new Date(a.date);
                return appointmentDate >= startOfWeek;
            }).length,
            thisMonthAppointments: allAppointments.filter(a => {
                const appointmentDate = new Date(a.date);
                return appointmentDate >= startOfMonth;
            }).length,
        };

        setAppointmentStats(stats);
    },[allAppointments]);

    // Select teacher and filter appointments
    const selectTeacher = useCallback((teacher: Teacher) => {
        setSelectedTeacher(teacher);
        const filtered = allAppointments.filter(appointment =>
            appointment.docenteId === teacher.id
        );
        setTeacherAppointments(filtered);
    }, [allAppointments]);

    // Generate teacher report
    const generateTeacherReport = useCallback((teacherId?: string): TeacherAppointmentSummary[] => {
        const teachersToReport = teacherId ? 
        teachers.filter(t => t.id === teacherId) 
        : teachers;
        return teachersToReport.map(teacher => {
            const teacherAppts= allAppointments.filter(a => a.docenteId === teacher.id);

            return {
                teacherId: teacher.id,
                teacherName: teacher.name,
                subject: teacher.subject,
                totalAppointments: teacherAppts.length,
                pendingAppointments: teacherAppts.filter(a => a.status === 'pending').length,
                confirmedAppointments: teacherAppts.filter(a => a.status === 'confirmed').length,
                cancelledAppointments: teacherAppts.filter(a => a.status === 'cancelled').length,
                appointments: teacherAppts,
            };
        });
    }, [teachers, allAppointments]);

    // Generate appointments report 
    const generateAppointmentsReport = useCallback((
        startDate?: string,
        endDate?: string,
        status?: 'pending' |'confirmed' | 'cancelled'
    ): AppointmentWithDetails[] => {
        let filtered = [...allAppointments];

        if(startDate) {
            filtered = filtered.filter(a => a.date >= startDate);
        }
        if(endDate) {
            filtered = filtered.filter(a => a.date <= endDate);
        }

        if(status){
            filtered = filtered.filter(a => a.status === status);
        }
        return filtered. sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },[allAppointments]);

    const getAppointmentsByStatus = useCallback((status: 'pending' | 'confirmed'|'cancelled') => {
        return allAppointments.filter(appointment => appointment.status === status);
    },[allAppointments]);

    //Get recent appointments 
    const getRecentAppointments = useCallback((days:number = 7): AppointmentWithDetails[] => {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);

        return allAppointments.filter(appointment => {
            const createdDate = new Date(appointment.createdAt);
            return createdDate >= daysAgo;
        }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [allAppointments]);

    // User management
    const toggleUserStatus = useCallback(async(userId:string,newStatus:boolean): Promise<boolean> =>{
        try{
            const userRef = doc(db, 'users',userId);
            await updateDoc(userRef, {
                isActive: newStatus,
                updatedAt: new Date().toISOString(),
            });
            return true;
        } catch(error){
            console.error('❌ Error al actualizar status',error);
            return false;
        }
    },[]);

    const getUsersByRole = useCallback((role: 'docente' | 'tutor' | 'admin') => {
        return users.filter(user => user.role === role);
    }, [users]);

    const getUsersByStatus = useCallback((isActive: boolean) => {
        return users.filter(user => user.isActive === isActive);
    },[users]);

    const getInactiveUsers = useCallback(() => {
        return users.filter(user => user.isActive === false);
    }, [users]);

    const getUnverifiedUsers = useCallback(() =>{
        return users.filter(user => user.emailVerified === false);
    },[users]);

    return {
    // Data
    teachers,
    users,
    allAppointments,
    selectedTeacher,
    teacherAppointments,
    userStats,
    appointmentStats,
    loading,
    loadingStates, // ✅ Added for debugging

    // Actions
    selectTeacher,
    generateTeacherReport,
    generateAppointmentsReport,
    getAppointmentsByStatus,
    getRecentAppointments,

    // User Management
    toggleUserStatus,
    getUsersByRole,
    getUsersByStatus,
    getInactiveUsers,
    getUnverifiedUsers,
  };
};