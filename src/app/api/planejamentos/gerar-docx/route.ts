import {
  handleOfficialPlanningDocxGet,
  handleOfficialPlanningDocxPost,
} from "../../../../server/planejamentos/official-planning-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleOfficialPlanningDocxGet;
export const POST = handleOfficialPlanningDocxPost;
