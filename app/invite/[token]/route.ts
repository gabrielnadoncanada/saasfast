import { acceptInvitationAction } from "@/features/tenant/invite/actions/accept.action";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  return await acceptInvitationAction(params.token);
}