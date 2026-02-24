import { supabase } from "./supabase";

const PET_BUCKET = "pet-photos";
const AVATAR_BUCKET = "user-avatars";

function getExt(file: File) {
  const t = file.type;
  if (t === "image/png") return "png";
  if (t === "image/webp") return "webp";
  return "jpg";
}

function makeRandomName(ext: string) {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
}

/** ------------------ PET PHOTOS ------------------ */
export async function uploadPetPhoto(file: File, ownerId: string) {
  const ext = getExt(file);
  const name = makeRandomName(ext);
  const path = `${ownerId}/${name}`;

  const { error } = await supabase.storage
    .from(PET_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(PET_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, storagePath: path };
}

export async function deletePetPhoto(storagePath: string) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(PET_BUCKET).remove([storagePath]);
  if (error) throw new Error(error.message);
}

/** ------------------ USER AVATARS ------------------ */
export async function uploadUserAvatar(file: File, uid: string) {
  const ext = getExt(file);
  const name = makeRandomName(ext);
  const path = `${uid}/${name}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, storagePath: path };
}

export async function deleteUserAvatar(storagePath: string) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
  if (error) throw new Error(error.message);
}