import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name;
    let content: string;

    if (filename.endsWith(".pdf")) {
      // Import the lib directly to avoid pdf-parse's index.js which loads a test file
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buffer);
      content = data.text;
    } else if (filename.endsWith(".txt")) {
      content = await file.text();
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use .txt or .pdf" },
        { status: 400 }
      );
    }

    return NextResponse.json({ filename, content: content.trim() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Upload error:", message);
    return NextResponse.json(
      { error: `Failed to process file: ${message}` },
      { status: 500 }
    );
  }
}
