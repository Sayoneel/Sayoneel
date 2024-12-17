import { writeAll } from "https://deno.land/std@0.216.0/io/write_all.ts";
import { Queue } from "./messenger.ts";

export function collectMetrics() {
    return {
        pid: Deno.pid,
        queueSize: Queue.getCurrentSize(),
    }
};

const encoder = new TextEncoder();

export async function sendMetrics() {
    const metrics = collectMetrics();

    await writeAll(Deno.stderr, encoder.encode(JSON.stringify(metrics)));
}

export function startMetricsReport() {
    setInterval(sendMetrics, 5000);
}
