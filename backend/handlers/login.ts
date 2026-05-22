
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const redirect = url.searchParams.get("redirect") || "/checkout";
  const loginUrl = new URL("/auth/login", url.origin);
  loginUrl.searchParams.set("redirect", redirect);
  return Response.redirect(loginUrl, 302);
}
