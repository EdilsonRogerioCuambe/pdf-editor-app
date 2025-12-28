import { mkdtemp, rm, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from 'node-qpdf2';
import { tmpdir } from 'os';
import { join } from 'path';

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    // Create temporary directory
    tempDir = await mkdtemp(join(tmpdir(), 'pdf-protect-'));

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const settingsJson = formData.get('settings') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const settings = JSON.parse(settingsJson);

    // Write uploaded file to temp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const inputPath = join(tempDir, 'input.pdf');
    const outputPath = join(tempDir, 'output.pdf');

    await writeFile(inputPath, buffer);

    // Build qpdf options
    const options: any = {
      input: inputPath,
      output: outputPath,
    };

    // Add passwords if provided
    if (settings.useUserPassword && settings.userPassword) {
      options.password = settings.userPassword;
    }

    if (settings.useOwnerPassword && settings.ownerPassword) {
      options.ownerPassword = settings.ownerPassword;
    }

    // Add encryption level
    switch (settings.encryptionLevel) {
      case '40-bit-rc4':
        options.keyLength = 40;
        break;
      case '128-bit-rc4':
        options.keyLength = 128;
        break;
      case '128-bit-aes':
        options.keyLength = 128;
        options.encryptionFileFormat = 'aes';
        break;
      case '256-bit-aes':
        options.keyLength = 256;
        options.encryptionFileFormat = 'aes';
        break;
      default:
        options.keyLength = 128;
        options.encryptionFileFormat = 'aes';
    }

    // Add permissions - restrictions array should only contain DENIED permissions
    const restrictions: string[] = [];

    // Printing restrictions
    if (settings.permissions.printing === 'none') {
      restrictions.push('print');
    } else if (settings.permissions.printing === 'lowResolution') {
      // For low-res, we need to deny high-quality printing
      // This may require a different approach depending on qpdf version
      restrictions.push('print=top');
    }
    // If 'full', don't add any print restriction

    // Other restrictions (only add if permission is FALSE)
    if (!settings.permissions.modifying) {
      restrictions.push('modify');
    }

    if (!settings.permissions.copying) {
      restrictions.push('extract');
    }

    if (!settings.permissions.annotating) {
      restrictions.push('annotate');
    }

    if (!settings.permissions.fillingForms) {
      restrictions.push('form');
    }

    if (!settings.permissions.contentAccessibility) {
      restrictions.push('accessibility');
    }

    if (!settings.permissions.documentAssembly) {
      restrictions.push('assemble');
    }

    if (restrictions.length > 0) {
      options.restrictions = restrictions;
    }

    // Encrypt PDF
    await encrypt(options);

    // Read the protected PDF
    const { readFile } = await import('fs/promises');
    const protectedPdf = await readFile(outputPath);

    // Clean up temp files
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;

    // Return the protected PDF
    return new NextResponse(protectedPdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protected-${file.name}"`,
      },
    });

  } catch (error) {
    console.error('Error protecting PDF:', error);

    // Clean up on error
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Error cleaning up temp files:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to protect PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
