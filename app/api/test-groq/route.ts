import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Starting Groq API test...")

    // Check if API key exists
    if (!process.env.GROQ_API_KEY) {
      console.log("❌ GROQ_API_KEY not found")
      return NextResponse.json(
        {
          success: false,
          error: "GROQ_API_KEY not found in environment variables",
          step: "api_key_check",
        },
        { status: 500 },
      )
    }

    console.log("✅ API key found, length:", process.env.GROQ_API_KEY.length)

    // Try to import Groq SDK
    let Groq
    try {
      const groqModule = await import("groq-sdk")
      Groq = groqModule.default
      console.log("✅ Groq SDK imported successfully")
    } catch (importError) {
      console.error("❌ Failed to import Groq SDK:", importError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to import Groq SDK: ${importError instanceof Error ? importError.message : String(importError)}`,
          step: "sdk_import",
        },
        { status: 500 },
      )
    }

    // Try to create Groq client
    let groq
    try {
      groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      })
      console.log("✅ Groq client created")
    } catch (clientError) {
      console.error("❌ Failed to create Groq client:", clientError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create Groq client: ${clientError instanceof Error ? clientError.message : String(clientError)}`,
          step: "client_creation",
        },
        { status: 500 },
      )
    }

    // Try to make API call
    try {
      console.log("🚀 Making API call to Groq...")

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: "Say 'Hello, Groq API is working!' in exactly those words.",
          },
        ],
        model: "llama-3.1-70b-versatile",
        temperature: 0,
        max_tokens: 50,
      })

      const response = completion.choices[0]?.message?.content
      console.log("✅ Groq API response received:", response)

      return NextResponse.json({
        success: true,
        message: "Groq API is working!",
        response: response,
        apiKeyPresent: true,
        apiKeyLength: process.env.GROQ_API_KEY.length,
        step: "completed",
      })
    } catch (apiError) {
      console.error("❌ Groq API call failed:", apiError)

      // More detailed error information
      const errorDetails = {
        message: apiError instanceof Error ? apiError.message : String(apiError),
        name: apiError instanceof Error ? apiError.name : "Unknown",
        stack: apiError instanceof Error ? apiError.stack : undefined,
      }

      return NextResponse.json(
        {
          success: false,
          error: `Groq API call failed: ${errorDetails.message}`,
          errorDetails,
          step: "api_call",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Unexpected error in test:", error)

    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    }

    return NextResponse.json(
      {
        success: false,
        error: `Unexpected error: ${errorDetails.message}`,
        errorDetails,
        step: "unexpected_error",
      },
      { status: 500 },
    )
  }
}
