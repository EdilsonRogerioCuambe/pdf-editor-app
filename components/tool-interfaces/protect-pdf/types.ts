export type PrintingPermission = 'none' | 'lowResolution' | 'highResolution';

export type EncryptionLevel = '40-bit-rc4' | '128-bit-rc4' | '128-bit-aes' | '256-bit-aes';

export interface ProtectionPermissions {
  printing: PrintingPermission;
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
  fillingForms: boolean;
  contentAccessibility: boolean;
  documentAssembly: boolean;
}

export interface ProtectionSettings {
  userPassword: string;
  ownerPassword: string;
  useUserPassword: boolean;
  useOwnerPassword: boolean;
  permissions: ProtectionPermissions;
  encryptionLevel: EncryptionLevel;
}

export interface PasswordStrength {
  strength: number; // 0-100
  level: 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  color: string;
  feedback: string[];
}

export interface PermissionPreset {
  name: string;
  description: string;
  permissions: ProtectionPermissions;
}

export const PERMISSION_PRESETS: Record<string, PermissionPreset> = {
  readOnly: {
    name: 'Read Only',
    description: 'Users can only view the PDF',
    permissions: {
      printing: 'none',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false
    }
  },
  viewAndPrint: {
    name: 'View and Print',
    description: 'Users can view and print, but not modify',
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false
    }
  },
  noPrinting: {
    name: 'No Printing',
    description: 'Prevent printing while allowing other actions',
    permissions: {
      printing: 'none',
      modifying: true,
      copying: true,
      annotating: true,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: true
    }
  },
  formFillOnly: {
    name: 'Form Fill Only',
    description: 'Only allow filling forms',
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false
    }
  },
  fullAccess: {
    name: 'Full Access',
    description: 'No restrictions (password protected only)',
    permissions: {
      printing: 'highResolution',
      modifying: true,
      copying: true,
      annotating: true,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: true
    }
  }
};
