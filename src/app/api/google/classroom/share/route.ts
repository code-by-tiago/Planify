import { handleGoogleClassroomShareRequest } from "@/server/google/classroom-share-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const POST = handleGoogleClassroomShareRequest;
