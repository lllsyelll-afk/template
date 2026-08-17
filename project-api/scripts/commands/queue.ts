import { api, ApiError, askMultipleChoice } from "../utils";

export const manageQueue = async (): Promise<void> => {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("       📬 ASYNC JOB QUEUE MANAGER");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const stats = await api.get<{
      pending: number;
      processing: number;
      completed: number;
      failed: number;
      total: number;
    }>("/cli/queue/stats");

    console.log("📊 Queue Statistics:");
    console.log(`   • Pending:    ${stats.pending}`);
    console.log(`   • Processing: ${stats.processing}`);
    console.log(`   • Completed:  ${stats.completed}`);
    console.log(`   • Failed:     ${stats.failed}`);
    console.log(`   • Total Jobs: ${stats.total}\n`);

    const action = await askMultipleChoice("Select an action:", [
      "🔄 Refresh Stats",
      "🔁 Retry Failed Jobs",
      "🧹 Clear Completed Jobs",
      "🔙 Back to Main Menu",
    ]);

    switch (action) {
      case "🔄 Refresh Stats":
        await manageQueue();
        break;
      case "🔁 Retry Failed Jobs": {
        const res = await api.post<{ retried: number }>("/cli/queue/retry-failed", {});
        console.log(`\n✅ Successfully re-queued ${res.retried} failed job(s).\n`);
        break;
      }
      case "🧹 Clear Completed Jobs": {
        const res = await api.post<{ cleared: number }>("/cli/queue/clear-completed", {});
        console.log(`\n✅ Successfully pruned ${res.cleared} completed job(s).\n`);
        break;
      }
      case "🔙 Back to Main Menu":
        return;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.log(`❌ Queue API Error (${error.status}):`, error.data || error.message);
    } else {
      console.log("❌ Unexpected Error:", error);
    }
  }
};
