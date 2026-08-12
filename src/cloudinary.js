const CLOUD  = "eh28qyb1";
const PRESET = "No-login-task-collab";

export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file",          file);
  fd.append("upload_preset", PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
    { method: "POST", body: fd }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}
