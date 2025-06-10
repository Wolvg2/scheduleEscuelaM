import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';


type Appointment = {
    id: string;
    docenteId: string;
    tutorId: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    reason?: string;
    subject?: string;
    observations?: string;
};

export const useAppointments = (userId: string, role: 'docente' | 'tutor') => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) {
            setAppointments([]);
            return;
        }
        setLoading(true);

        // Determinar que campo se consultara funcion del rol
        const field = role == 'docente' ? 'docenteId' : 'tutorId';
        const appointmentRef = collection(db, 'appointments');
        const q = query(
            appointmentRef,
            where(field, '==', userId),
            orderBy('date', 'desc'),
            orderBy('__name__', 'desc')

        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Appointment[];
            setAppointments(data);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching appointments:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, role]);

    return { appointments, loading };
};