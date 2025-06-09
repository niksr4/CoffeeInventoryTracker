import { NextResponse } from "next/server"

export async function GET() {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    env: {
      hasGroqKey: !!process.env.GROQ_API_KEY,
      keyLength: process.env.GROQ_API_KEY?.length || 0,
      keyPrefix: process.env.GROQ_API_KEY?.substring(0, 8) + "..." || "none",
    },
  }

  try {
    // Step 1: Basic environment check
    console.log("=== GROQ TEST DEBUG ===")
    console.log("Debug info:", JSON.stringify(debugInfo, null, 2))

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "No GROQ_API_KEY found",
        debug: debugInfo,
        step: 1,
      })
    }

    // Step 2: Try to import groq-sdk
    console.log("Step 2: Importing groq-sdk...")
    const { default: Groq } = await import("groq-sdk")
    console.log("✅ groq-sdk imported successfully")
    debugInfo.sdkImported = true

    // Step 3: Create client
    console.log("Step 3: Creating Groq client...")
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
    console.log("✅ Groq client created")
    debugInfo.clientCreated = true

    // Step 4: Simple API test
    console.log("Step 4: Testing API call...")
    const startTime = Date.now()

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Reply with just the word 'SUCCESS'" }],
      model: "llama-3.1-8b-instant", // Using faster model
      temperature: 0,
      max_tokens: 10,
    })

    const endTime = Date.now()
    const response = completion.choices[0]?.message?.content

    console.log("✅ API call successful:", response)
    debugInfo.apiCallTime = endTime - startTime
    debugInfo.response = response

    return NextResponse.json({
      success: true,
      message: "Groq API working!",
      response,
      debug: debugInfo,
      step: 4,
    })
  } catch (err) {
    console.error("=== ERROR CAUGHT ===")
    console.error("Error object:", err)
    console.error("Error type:", typeof err)
    console.error("Error constructor:", err?.constructor?.name)

    // Try to extract as much info as possible
    let errorInfo: any = {
      type: typeof err,
      constructor: err?.constructor?.name,
      string: String(err),
    }

    if (err instanceof Error) {
      errorInfo = {
        ...errorInfo,
        name: err.name,
        message: err.message,
        stack: err.stack,
      }
    }

    // Check if it's a specific type of error
    if (err && typeof err === "object") {
      errorInfo.keys = Object.keys(err)
      errorInfo.props = {}

      for (const key of Object.keys(err)) {
        try {
          errorInfo.props[key] = (err as any)[key]
        } catch {
          errorInfo.props[key] = "[unable to access]"
        }
      }
    }

    console.error("Processed error info:", JSON.stringify(errorInfo, null, 2))

    return NextResponse.json({
      success: false,
      error: "Detailed error captured",
      errorInfo,
      debug: debugInfo,
      rawError: err ? String(err) : "null error",
    })
  }
}
