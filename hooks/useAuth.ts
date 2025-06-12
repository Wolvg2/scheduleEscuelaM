import { useState } from "react";
import { auth,db } from "@/firebase/config";
import {collection, doc, setDoc, getDoc, updateDoc} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, reload } from "firebase/auth";


// Registro de usuarios 
export const registerUser = async(email: string, password:string,name: string, role:string,subject?:string) => {
    try{
        if (password.length < 12 || 
            !/[A-Z]/.test(password) ||
            !/[0-9]/.test(password) ||
            !/[!@#$%^&*/.-_]/.test(password)
        ){
            alert("Contraseña debe tener al menos 12 caracteres, una mayúscula, un número y un caracter !@#$%^&*/.-_ ");
            return null;
        }

        const userCredential = await createUserWithEmailAndPassword(auth,email,password);
        const user =userCredential.user;

        await sendEmail(user);

        const baseUserData = {
            email,
            name,
            role,
            emailVerified:false,
            isActive: true,
            createdAt: new Date().toISOString(),
        };

        const userData = role === 'docente' && subject 
        ? { ...baseUserData, subject }
        : baseUserData;

      
        const usuarios = doc(db,"users",user.uid);
        await setDoc(usuarios,userData);

        console.log("Usuario registrado exitosamente");

        await auth.signOut(); // Verificar email


        return userCredential;
    } catch(error) {
        console.log("Error al registrar usuario", error);
        alert("Error al registrar usuario ");
        return null;
    }
}

// Login de usuario
export const loginUser = async(email:string, password:string) => {
    try{
        const userCredential = await signInWithEmailAndPassword(auth, email,password);
        const user = userCredential.user;

        await reload(user); // Recargar para verificar email

        if(!user.emailVerified){
            alert("Verifica tu cuenta antes de continuar");
            await auth.signOut();
            return null;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (!userData) {
            alert("Usuario no encontrado en la base de datos");
            await auth.signOut();
            return null;
        }

        if (userData.isActive === false) {
            alert("Tu cuenta está desactivada. Contacta al administrador.");
            await auth.signOut();
            return null;
        }

        if(userData && !userData.emailVerified) {
            await updateDoc(doc(db, "users", user.uid), {
                emailVerified: true
            });
        }
        
        return {user, role:userData?.role};
    } catch(error) {
        console.log("Error al iniciar sesion", error);
        alert("Error al iniciar sesion");
        return null;
    }
}

// Enviar email de verificacion
export const sendEmail = async(user:any) =>{
    try{
        await sendEmailVerification(user);
        console.log("Email enviado");
        alert("Revisa tu correo para confirmar tu cuenta");
        return true;
    } catch(error){
        console.log("Error al mandar email", error);
        return false;
    }
}

// Verificar mail
export const checkEmail = async(user:any) => {
    try{
        await reload(user);
        return user.emailVerified;
    }catch(error){
        console.error("Error al verificar", error);
        return false;
    }
}

// Reenviar email de verificacion
export const resendEmail = async() => {
    try{
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
            await sendEmailVerification(user);
            alert("Email de verificación reenviado. Revisa tu correo.");
            return true;
        } else if (!user) {
            alert("No hay usuario autenticado para reenviar el email.");
            return false;
        } else {
            alert("El email ya ha sido verificado.");
            return true;
        }
    } catch(error){
        console.log("Error al reenviar email", error);
        return false;
    }
}