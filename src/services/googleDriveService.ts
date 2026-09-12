import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import { app } from '../firebase/config';

// Primary OAuth Scope for Google Drive file creation
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

const auth = getAuth(app);
const driveProvider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach((scope) => driveProvider.addScope(scope));

// In-memory access token cache (MANDATORY: never stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  createdTime?: string;
}

/**
 * Initializes the auth listener to keep session state in sync
 */
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Prompt user to sign in with Google to grant Drive permissions
 */
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google authentication succeeded, but an access token was not returned.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[Google Drive Auth Error]:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutDrive = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Generates the official Alberta Vulnerable Sector Check (VSC / PIC-VS)
 * organization confirmation letter text.
 */
export const generateAlbertaVscLetterContent = (options?: {
  applicantName?: string;
  dateOfBirth?: string;
  isVolunteer?: boolean;
  city?: string;
}): string => {
  const applicantName = options?.applicantName?.trim() || '[Caregiver / Companion Full Legal Name]';
  const dob = options?.dateOfBirth?.trim() || '[YYYY-MM-DD]';
  const isVolunteer = options?.isVolunteer ?? true;
  const today = new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const city = options?.city || 'Calgary / Edmonton, Alberta';

  return `================================================================================
COMPASSIONATE CARE SENIOR NETWORK — ALBERTA REGIONAL BRANCH
800 6th Avenue SW, Suite 1400, Calgary, AB T2P 3G3
10180 101 Street NW, Suite 1900, Edmonton, AB T5J 3S4
Phone: 1-800-555-CARE (2273) | Direct: (403) 555-0192 / (780) 555-0194
Email: alberta-credentials@compassionatecare.app | Web: https://compassionatecare.app
================================================================================

DATE: ${today}

TO:
Officer in Charge / Police Information Check & Vulnerable Sector Screening Section
- Calgary Police Service (CPS) — ePIC Unit (Westwinds Campus, Calgary, AB)
- Edmonton Police Service (EPS) — Police Information Check Section (Nexus Building, Edmonton, AB)
- Royal Canadian Mounted Police (RCMP "K" Division Detachments — Red Deer, Lethbridge, Medicine Hat, St. Albert, Strathcona County, Wood Buffalo)
- Municipal Police Services of Alberta, Canada

SUBJECT: REQUEST FOR POLICE INFORMATION CHECK WITH VULNERABLE SECTOR CHECK (PIC-VS)
APPLICANT / CAREGIVER: ${applicantName}
DATE OF BIRTH: ${dob}
MUNICIPAL RESIDENCE: ${city}
ROLE APPLIED FOR: Senior Companion & Respite Caregiver (${isVolunteer ? 'Volunteer Companion Track' : 'Professional Companion Track'})
AGENCY REGISTRATION NO: CC-AB-2026-VET982

Dear Officer in Charge,

This letter certifies that the above-named individual has registered with the Compassionate Care Senior Network to serve as a Senior Companion in the Province of Alberta. 

Pursuant to Section 6.3 of the Criminal Records Act (R.S.C., 1985, c. C-47) and the Alberta Police Act, we formally request that a Police Information Check with a Vulnerable Sector Check (PIC-VS) be conducted for this individual.

1. NATURE OF POSITION & DIRECT CONTACT WITH VULNERABLE PERSONS:
The applicant will occupy a position of trust, care, and authority directly with vulnerable individuals (seniors aged 65 and older, including frail elders, individuals living with dementia, Alzheimer's, Parkinson's disease, and physical mobility limitations). 

Caregiver responsibilities include:
• One-on-one social companion visits in private residential homes and seniors' living suites
• Accompanied neighborhood walks, garden recreation, and transport to medical appointments
• Providing non-medical respite care to relieve overwhelmed primary family caregivers
• Dedicated listening, reading aloud, memory stimulation, and observation of elder safety

These duties require unsupervised, direct physical and emotional interaction with vulnerable persons in private household environments without continuous constant third-party supervision. Therefore, an in-depth Vulnerable Sector Check is an indispensable safety prerequisite under our provincial elder-protection standards.

2. VOLUNTEER STATUS & FEE SCHEDULE DECLARATION:
${isVolunteer 
  ? `[X] VOLUNTEER CONFIRMATION: The applicant is enrolled as a bona fide UNPAID VOLUNTEER under our Alberta Community Senior Companionship Initiative. They receive zero financial compensation, wage, or stipend for these hours. We respectfully request that your police detachment apply the reduced volunteer fee schedule or volunteer fee waiver (e.g., Calgary Police Service $15 volunteer fee / Edmonton Police Service Volunteer rate / RCMP Volunteer free processing) as authorized by this agency confirmation.`
  : `[ ] PROFESSIONAL CARE TRACK: The applicant is applying for professional vetted companion placement. The applicant is responsible for the standard non-volunteer employment screening fee.`
}

3. AGENCY VERIFICATION CONTACT:
Should you require any verification or additional details regarding this applicant's pending placement, please contact our Alberta Credentials Verification Office:

Officer: Sarah MacIntyre, BSW, RSW
Title: Provincial Director of Vetting & Companion Standards (Alberta)
Compassionate Care Senior Network
Toll-Free: 1-800-555-CARE (Ext. 402)
Calgary Direct: (403) 555-0192 | Edmonton Direct: (780) 555-0194
Email: verification.alberta@compassionatecare.app

Thank you for your dedicated partnership in keeping Alberta seniors safe, connected, and protected.

Respectfully submitted,

Sarah MacIntyre
Director of Vetting & Companion Standards
Compassionate Care Senior Network (Alberta Division)
Agency Authorization Code: AB-VSC-SEC63-COMPASSIONATE
================================================================================
INSTRUCTIONS FOR CAREGIVER / VOLUNTEER APPLICANT:
1. Calgary residents: Submit this letter online via Calgary Police Service ePIC (policeinformationcheck.calgary.ca).
2. Edmonton residents: Submit this letter online via Edmonton Police Service ePIC (edmontonpolice.ca/pic).
3. RCMP jurisdictions (e.g., Strathcona, Airdrie, Cochrane, St. Albert): Print this letter and present it in person at your local RCMP detachment along with two (2) pieces of government-issued identification (one must be photo ID).
================================================================================`;
};

/**
 * Uploads the VSC letter template directly to the user's Google Drive.
 * Uses the Drive v3 multipart upload endpoint.
 */
export const uploadVscLetterToGoogleDrive = async (
  accessToken: string,
  options?: {
    applicantName?: string;
    dateOfBirth?: string;
    isVolunteer?: boolean;
    city?: string;
  }
): Promise<DriveUploadResult> => {
  const content = generateAlbertaVscLetterContent(options);
  const applicantName = options?.applicantName ? `_${options.applicantName.replace(/\s+/g, '_')}` : '';
  const fileName = `Alberta_VSC_Template_Letter${applicantName}_CompassionateCare.txt`;

  const metadata = {
    name: fileName,
    description: 'Alberta Canada Vulnerable Sector Check (VSC / PIC-VS) Organization Confirmation Letter for Caregiver Certification',
    mimeType: 'text/plain',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Failed to create file in Google Drive (${response.status})`;
    throw new Error(message);
  }

  const result = await response.json();
  return {
    fileId: result.id,
    fileName: result.name || fileName,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    createdTime: result.createdTime,
  };
};
