import { NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function GET() {
  try {
    console.log("Testing Groq API connection...")

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "GROQ_API_KEY not found in environment variables",
        },
        { status: 500 },
      )
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    console.log("Groq client created, testing with simple prompt...")

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

    console.log("Groq API response:", response)

    return NextResponse.json({
      success: true,
      message: "Groq API is working!",
      response: response,
      apiKeyPresent: !!process.env.GROQ_API_KEY,
      apiKeyLength: process.env.GROQ_API_KEY?.length || 0,
    })
  } catch (error) {
    console.error("Groq API test error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        apiKeyPresent: !!process.env.GROQ_API_KEY,
        apiKeyLength: process.env.GROQ_API_KEY?.length || 0,
      },
      { status: 500 },
    )
  }
}
