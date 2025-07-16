// lib/judge0.ts

const JUDGE0_API = "http://47.128.245.74:2358"
const API_TOKEN = "ZHVvdGhhbjUuMA=="

export interface Judge0Submission {
  source_code: string
  language_id: number
}

export async function runJudge0Code({ source_code, language_id }: Judge0Submission) {
  try {
    const res = await fetch(`${JUDGE0_API}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": API_TOKEN,
      },
      body: JSON.stringify({
        source_code: btoa(source_code),
        language_id,
      }),
    })

    const result = await res.json()

    return {
      stdout: result.stdout ? atob(result.stdout) : null,
      stderr: result.stderr ? atob(result.stderr) : null,
      compile_output: result.compile_output ? atob(result.compile_output) : null,
      status: result.status,
      time: result.time,
      memory: result.memory,
    }
  } catch (err) {
    console.error("Judge0 API error:", err)
    throw new Error("Failed to execute code")
  }
}