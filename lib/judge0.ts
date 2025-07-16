import { toast } from "sonner";

// Judge0 API configuration
export const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "http://10.3.5.139:2358/";
export const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "ZHVvdGhhbjUuMA==";

// Supported programming languages
export const LANGUAGES = [
  { id: 71, name: "Python (3.8.1)", value: "python" },
  { id: 62, name: "Java (OpenJDK 13.0.1)", value: "java" },
  { id: 63, name: "JavaScript (Node.js 12.14.0)", value: "javascript" },
  { id: 75, name: "C++ (GCC 9.2.0)", value: "cpp" },
  { id: 50, name: "C (GCC 9.2.0)", value: "c" },
  { id: 51, name: "C# (Mono 6.6.0.161)", value: "csharp" },
  { id: 78, name: "Kotlin (1.3.70)", value: "kotlin" },
  { id: 74, name: "TypeScript (3.7.4)", value: "typescript" },
  { id: 72, name: "Ruby (2.7.0)", value: "ruby" },
  { id: 82, name: "SQL (SQLite 3.27.2)", value: "sql" },
];

// Status codes and their meanings
export const STATUS_CODES = {
  1: "In Queue",
  2: "Processing",
  3: "Accepted",
  4: "Wrong Answer",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  7: "Runtime Error (SIGSEGV)",
  8: "Runtime Error (SIGXFSZ)",
  9: "Runtime Error (SIGFPE)",
  10: "Runtime Error (SIGABRT)",
  11: "Runtime Error (NZEC)",
  12: "Runtime Error (Other)",
  13: "Internal Error",
  14: "Exec Format Error"
};

// Interface for code execution request
export interface CodeExecutionRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}

// Interface for code execution response
export interface CodeExecutionResponse {
  token: string;
  status?: {
    id: number;
    description: string;
  };
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  message?: string;
  time?: string;
  memory?: number;
  expected_output?: string;
  exit_code?: number;
  error?: string;
}

/**
 * Submit code to Judge0 API for execution
 * @param code Source code to execute
 * @param languageValue Language identifier (e.g., "python", "java")
 * @param input Optional input for the program
 * @param expectedOutput Optional expected output for validation
 * @returns Token for checking execution status
 */
export const submitCodeToJudge0 = async (
  code: string,
  languageValue: string,
  input?: string,
  expectedOutput?: string
): Promise<string> => {
  try {
    // Find language ID from the language value
    const language = LANGUAGES.find((lang) => lang.value === languageValue);
    if (!language) {
      throw new Error(`Unsupported language: ${languageValue}`);
    }

    const requestBody: CodeExecutionRequest = {
      source_code: code,
      language_id: language.id,
    };

    // Add optional parameters if provided
    if (input) requestBody.stdin = input;
    if (expectedOutput) requestBody.expected_output = expectedOutput;

    // Submit code to Judge0
    const response = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": JUDGE0_API_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit code: ${errorText}`);
    }

    const result = await response.json();
    return result.token;
  } catch (error) {
    console.error("Error submitting code:", error);
    toast.error("Failed to submit code for execution");
    throw error;
  }
};

/**
 * Get execution result from Judge0 API
 * @param token Submission token from submitCodeToJudge0
 * @returns Execution result
 */
export const getExecutionResult = async (token: string): Promise<CodeExecutionResponse> => {
  try {
    const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
      headers: {
        "X-RapidAPI-Key": JUDGE0_API_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get execution result: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting execution result:", error);
    toast.error("Failed to retrieve execution result");
    throw error;
  }
};

/**
 * Execute code and poll for results
 * @param code Source code to execute
 * @param languageValue Language identifier
 * @param input Optional input for the program
 * @param expectedOutput Optional expected output for validation
 * @returns Execution result
 */
export const executeCode = async (
  code: string,
  languageValue: string,
  input?: string,
  expectedOutput?: string
): Promise<CodeExecutionResponse> => {
  try {
    // Submit code
    const token = await submitCodeToJudge0(code, languageValue, input, expectedOutput);
    
    // Poll for result
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second between polls
      
      const result = await getExecutionResult(token);
      
      // If status is not "In Queue" or "Processing", return the result
      if (result.status && result.status.id > 2) {
        return result;
      }
      
      attempts++;
    }
    
    throw new Error("Execution timeout: Code execution took too long");
  } catch (error) {
    console.error("Error executing code:", error);
    throw error;
  }
};

/**
 * Format execution result for display
 * @param result Execution result from Judge0
 * @returns Formatted output and status
 */
export const formatExecutionResult = (result: CodeExecutionResponse): { output: string; status: string } => {
  let output = "";
  let status = "Unknown";
  
  if (result.status) {
    status = result.status.description;
  }
  
  if (result.stdout) {
    output = result.stdout;
  } else if (result.stderr) {
    output = result.stderr;
  } else if (result.compile_output) {
    output = result.compile_output;
  } else if (result.message) {
    output = result.message;
  } else if (result.error) {
    output = result.error;
  } else {
    output = "No output";
  }
  
  return { output, status };
};

/**
 * Check if execution result matches expected output
 * @param result Execution result from Judge0
 * @param expectedOutput Expected output for validation
 * @returns Whether the output matches the expected output
 */
export const validateOutput = (result: CodeExecutionResponse, expectedOutput?: string): boolean => {
  if (!expectedOutput || !result.stdout) return false;
  
  // Normalize outputs by trimming whitespace and normalizing line endings
  const normalizedExpected = expectedOutput.trim().replace(/\r\n/g, '\n');
  const normalizedActual = result.stdout.trim().replace(/\r\n/g, '\n');
  
  return normalizedExpected === normalizedActual;
};