import { mkdtemp, rm, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from 'node-qpdf2';
import { tmpdir } from 'os';
import { join } from 'path';

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    // Create temporary directory
    tempDir = await mkdtemp(join(tmpdir(), 'pdf-unlock-'));

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'No password provided' }, { status: 400 });
    }

    // Write uploaded file to temp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const inputPath = join(tempDir, 'input.pdf');
    const outputPath = join(tempDir, 'output.pdf');

    await writeFile(inputPath, buffer);

    // Decrypt using node-qpdf2
    // If the password logic is tricky, sometimes just passing input, output and password works to remove it
    try {
      await decrypt({
        input: inputPath,
        output: outputPath,
        password: password
      });
    } catch (decryptError) {
      console.error('Decryption failed:', decryptError);
      // Depending on the error from qpdf, we might want to return a specific "wrong password" message
      // But for now generic error is safer
      throw new Error('Invalid password or failed to decrypt');
    }

    // Read the unlocked PDF
    const { readFile } = await import('fs/promises');
    const unlockedPdf = await readFile(outputPath);

    // Clean up temp files
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;

    // Return the unlocked PDF
    return new NextResponse(unlockedPdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="unlocked-${file.name}"`,
      },
    });

  } catch (error) {
    console.error('Error unlocking PDF:', error);

    // Clean up on error
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Error cleaning up temp files:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to unlock PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
