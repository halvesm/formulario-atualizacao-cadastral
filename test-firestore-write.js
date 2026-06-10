import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyCy1P1P7M-6h5mJ9FLpPIz1Jqau3guXOkI",
  authDomain: "ficha-cadastral-an.firebaseapp.com",
  projectId: "ficha-cadastral-an",
  storageBucket: "ficha-cadastral-an.firebasestorage.app",
  messagingSenderId: "511589405179",
  appId: "1:511589405179:web:46ed32c7738fccaaa63b5e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testWrite() {
  try {
    console.log("Iniciando teste de gravação no Firestore para o projeto ficha-cadastral-an...");
    const docRef = await addDoc(collection(db, "estudantes"), {
      nome: "Diagnostico Automatizado",
      dataNascimento: "2026-06-10",
      serie: "1ª série",
      curso: "Informática",
      turma: "1ª SÉRIE - INFORMÁTICA",
      email: "teste@diagnostico.com",
      telefone: "(85) 99999-9999",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log("✅ SUCEsSO! O documento foi gravado com sucesso no Firebase.");
    console.log("ID do documento gravado:", docRef.id);
  } catch (error) {
    console.error("❌ ERRO NA GRAVAÇÃO DO FIRESTORE:", error);
  } finally {
    process.exit(0);
  }
}

testWrite();
