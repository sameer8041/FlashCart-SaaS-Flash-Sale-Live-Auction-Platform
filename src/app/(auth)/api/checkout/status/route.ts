import { NextResponse } from "next/server";
import { orderQueue } from "@/lib/queue";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
        return NextResponse.json({ success: false, message: "Job ID required" }, { status: 400 });
    }

    try {
        const job = await orderQueue.getJob(jobId);

        if (!job) {
            return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
        }

        const state = await job.getState(); // returns 'waiting', 'active', 'completed', 'failed'
        const reason = job.failedReason;

        return NextResponse.json({
            success: true,
            state,
            reason
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Error fetching job" }, { status: 500 });
    }
}