// POST /api/admin/upload-url
//
// Body: { filename: string, slug?: string }
// Response: { uploadUrl, token, path, publicUrl }
//
// The browser PUTs the file directly to Supabase Storage using `uploadUrl`.
// This avoids piping large files (up to 50MB) through our serverless
// function, which has a body-size cap. The file is immediately public
// since the `content-files` bucket is public.
import { createServerSupabase } from "../../../backend/lib/supabase";
import { requireAdmin } from "../lib/adminAuth";


const BUCKET = "content-files";

function safeName(name: string): string {
  // strip path separators, keep alphanum + dot + dash + underscore
  return name
    .replace(/[\\/]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 120);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const filename = safeName(String(body.filename || "")).trim();
  const slug = body.slug ? safeName(String(body.slug)) : "content";
  if (!filename) {
    return Response.json({ error: "filename required" }, { status: 422 });
  }

  const path = `${slug}-${Date.now()}-${filename}`;

  const supabase = createServerSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return Response.json(
      { error: error?.message || "Failed to create upload URL" },
      { status: 500 }
    );
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return Response.json({
    uploadUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl: pub.publicUrl,
  });
}
