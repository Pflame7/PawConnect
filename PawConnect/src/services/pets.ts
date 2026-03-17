import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { deletePetPhoto } from "./uploads";
import type { AnimalType } from "../constants/formOptions";

export type PetCreate = {
  ownerId: string;

  animalType: AnimalType;
  name: string;
  breed: string;

  city: string;
  area?: string;

  ageYears: number;
  ageMonths?: number;
  weightKg: number;

  gender?: string;
  size?: string;

  traits?: string[];
  friendlyWithDogs?: boolean;
  goodWithKids?: boolean;

  about?: string;

  imageUrl?: string;
  imagePath?: string;
};

export async function createPet(data: PetCreate) {
  const ref = await addDoc(collection(db, "pets"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function getPetById(petId: string) {
  const ref = doc(db, "pets", petId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return { id: snap.id, ...(snap.data() as Record<string, unknown>) };
}

export async function getPetsByOwner(ownerId: string) {
  const q = query(
    collection(db, "pets"),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deletePet(petId: string) {
  const ref = doc(db, "pets", petId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as { imagePath?: string };
    if (data.imagePath) {
      await deletePetPhoto(data.imagePath);
    }
  }

  await deleteDoc(ref);
}