import { useState, useEffect, useCallback} from "react";
import {auth,db} from '@/firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, addDoc, getDocs } from "firebase/firestore";

type Slot = {
  date: string;
  time: string;
};

type Appointment = {
  id: string;
  tutorId: string;
  docenteId: string;
  docenteName?: string;
  date: string;
  time: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
};

export const useSchedule = (teacherId: string) => {
    const [slots,setSlots] = useState<Slot[]>([]);
    const [userAppointments,setAppointments] = useState<Appointment[]>([]);
    const [loading,setLoading] = useState(false);

    // Cargar horarios profesores
    useEffect(() => {
        const fetchSlots = async() => {
            if (!teacherId) {
                setSlots([]);
                return;
            }

            setLoading(true);
            try {
                const docRef = doc(db, 'users', teacherId);
                const docSnap = await getDoc(docRef);

                if(docSnap.exists()){
                    const availableSlots = docSnap.data()?.availableSlots || [];
                    
                    // Obtener horarios reservados
                    const bookedSlotsQuery = query(
                        collection(db, 'appointments'),
                        where('docenteId', '==', teacherId),
                        where('status', 'in', ['pending', 'confirmed'])
                    );

                    const bookedSlotsSnap = await getDocs(bookedSlotsQuery);
                    const bookedSlots = bookedSlotsSnap.docs.map(doc => {
                        const data = doc.data();
                        return `${data.date} ${data.time}`;
                    });

                    const filteredSlots = availableSlots.filter((slot: Slot) => 
                        !bookedSlots.includes(`${slot.date} ${slot.time}`)
                    );

                    setSlots(filteredSlots);
                } else {
                    console.log("No such document!");
                    setSlots([]);
                }
            } catch (error) {
                console.log("Error cargar horarios", error);
                setSlots([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSlots();
    } , [teacherId]);


    // Cargar citas actuales
    useEffect(() => {
        if (!auth.currentUser) return;
        const q= query(
            collection(db,'appointments'),
            where('tutorId','==',auth.currentUser.uid)
        );
        const unsubscribe = onSnapshot(q, snapshot => {
            const data = snapshot.docs.map(doc => ({id:doc.id, ...doc.data()})) as Appointment[];
            setAppointments(data);
        }, (error) => {
            console.error('Error al cargar citas:', error);
        });
        return () => unsubscribe();
    }, []);

    // Agendar cita
    const scheduleAppointment = useCallback(
        async(date: string, time:string, reason:string, directorRequested:boolean = false) =>{
            if (!auth.currentUser){
                alert('Usuario no autenticado');
                return false;
            }

            if (!teacherId) {
                alert('No se ha seleccionado un docente');
                return false;
            }
            try{
                // Verifica el horario del docente
                const q = query(
                    collection(db,'appointments'),
                    where('userId','==',auth.currentUser.uid),
                    where('date','==',date),
                    where('time','==',time),
                    where('status','in',['pending','confirmed'])
                );
                const snap = await getDocs(q);
                if(!snap.empty){
                    alert('Horario no disponible');
                    return false;
                }

                const teacherDoc = await getDoc(doc(db, 'users', teacherId));
                const teacherName = teacherDoc.data()?.name || 'Docente';

                const appointmentData = {
                    tutorId: auth.currentUser.uid,
                    docenteId: teacherId,
                    docenteName: teacherName,
                    date,
                    time,
                    reason: reason.trim(),
                    status: 'pending' as const,
                    createdAt: new Date().toISOString(),
                };

                const docRef = await addDoc(collection(db,'appointments'), appointmentData);
                return true;
            } catch(error){
                alert('Error al agendar cita');
                return false;
            }
        },[teacherId]
            
    );

    // Guardar o actualizar horarios docente
    const updateAvailableSlots = useCallback(
        async(newSlots:Slot[])=>{
            if (!teacherId) {
                alert('No se ha seleccionado un docente');
                return false;
            }
            try{
                const docRef = doc(db, 'users', teacherId);
                await updateDoc(docRef, {
                    availableSlots: newSlots,
                });
                setSlots(newSlots);
                return true;
            }catch(error){
                alert('Error al actualiar horarios');
                return false;
            }
        },[teacherId]
    );

    // Cancelar cita
    const cancelAppointment = useCallback(
        async(appointmentId: string) => {
            try {
                const appointmentRef = doc(db, 'appointments', appointmentId);
                await updateDoc(appointmentRef, {
                    status: 'cancelled',
                    cancelledAt: new Date().toISOString(),
                });
                return true;
            } catch (error) {
                console.error('Error al cancelar cita:', error);
                alert('Error al cancelar cita');
                return false;
            }
        }, []
    );


    return{
        slots,
        appointments:userAppointments,
        loading,
        scheduleAppointment,
        updateAvailableSlots,
        cancelAppointment
    };

};