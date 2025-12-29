import { mkdtemp, rm, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from 'node-qpdf2';
import { tmpdir } from 'os';
import { join } from 'path';

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    // Create temporary directory
    tempDir = await mkdtemp(join(tmpdir(), 'pdf-lock-'));

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userPassword = formData.get('userPassword') as string;
    const ownerPassword = formData.get('ownerPassword') as string;
    const keyLength = formData.get('keyLength') as string;

    // Parse permissions
    const permissions = formData.get('permissions') as string;
    const permissionsObj = permissions ? JSON.parse(permissions) : {};

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userPassword && !ownerPassword) {
      return NextResponse.json({ error: 'At least one password is required' }, { status: 400 });
    }

    // Write uploaded file to temp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const inputPath = join(tempDir, 'input.pdf');
    const outputPath = join(tempDir, 'output.pdf');

    await writeFile(inputPath, buffer);

    // Map UI permissions to qpdf restrictions format
    const restrictions: Record<string, string> = {
      useAes: 'y', // Always use AES encryption
    };

    // Printing permission
    if (permissionsObj.printing === 'none') {
      restrictions.print = 'none';
    } else if (permissionsObj.printing === 'lowResolution') {
      restrictions.print = 'low';
    } else {
      restrictions.print = 'full';
    }

    // Modify permission
    if (!permissionsObj.modifying) {
      restrictions.modify = 'none';
    } else if (permissionsObj.annotating && permissionsObj.fillingForms) {
      restrictions.modify = 'annotate';
    } else if (permissionsObj.fillingForms) {
      restrictions.modify = 'form';
    } else if (permissionsObj.documentAssembly) {
      restrictions.modify = 'assembly';
    } else {
      restrictions.modify = 'all';
    }

    // Extract/copy permission
    restrictions.extract = permissionsObj.copying ? 'y' : 'n';

    // Annotate permission
    restrictions.annotate = permissionsObj.annotating ? 'y' : 'n';

    // Accessibility permission
    restrictions.accessibility = permissionsObj.contentAccessibility ? 'y' : 'n';

    // Prepare password object - qpdf requires owner password when user password is set
    // To avoid "insecure" error, we use the same password for both if only one is provided
    let finalUserPassword = userPassword || '';
    let finalOwnerPassword = ownerPassword || '';

    // If only user password is set, use it for owner too (qpdf requirement)
    if (userPassword && !ownerPassword) {
      finalOwnerPassword = userPassword;
    }
    // If only owner password is set, use it for user too
    else if (ownerPassword && !userPassword) {
      finalUserPassword = ownerPassword;
    }

    const passwordConfig: { user: string; owner: string } = {
      user: finalUserPassword,
      owner: finalOwnerPassword
    };

    // Determine key length with proper type
    const encryptKeyLength = parseInt(keyLength) || 128;
    const validKeyLength: 40 | 128 | 256 =
      encryptKeyLength === 40 ? 40 :
      encryptKeyLength === 256 ? 256 : 128;

    // Encrypt using node-qpdf2
    try {
      await encrypt({
        input: inputPath,
        output: outputPath,
        password: passwordConfig,
        keyLength: validKeyLength,
        restrictions: restrictions,
      });
    } catch (encryptError) {
      console.error('Encryption failed:', encryptError);
      throw new Error('Failed to encrypt PDF');
    }

    // Read the encrypted PDF
    const { readFile } = await import('fs/promises');
    const encryptedPdf = await readFile(outputPath);

    // Clean up temp files
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;

    // Return the encrypted PDF
    return new NextResponse(encryptedPdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protected-${file.name}"`,
      },
    });

  } catch (error) {
    console.error('Error encrypting PDF:', error);

    // Clean up on error
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Error cleaning up temp files:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to encrypt PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
