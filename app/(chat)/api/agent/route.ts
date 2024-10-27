import { auth } from "@/app/(auth)/auth";
export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  return Response.json("status", { status: 200 })
}
