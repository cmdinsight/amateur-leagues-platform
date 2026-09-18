import { put } from "@vercel/blob";

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function uploadToBlob(file: File, folder: string): Promise<string> {
  const blob = await put(`${folder}/${crypto.randomUUID()}-${file.name}`, file, {
    access: "public",
  });
  return blob.url;
}
