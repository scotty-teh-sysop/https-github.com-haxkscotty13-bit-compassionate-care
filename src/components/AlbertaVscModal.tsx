import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, Download, ExternalLink, CheckCircle2, 
  Copy, Check, AlertCircle, Sparkles, Building2, MapPin, 
  HelpCircle, User as UserIcon, X, Loader2, FileUp
} from 'lucide-react';
import { 
  generateAlbertaVscLetterContent, 
  uploadVscLetterToGoogleDrive, 
  signInWithGoogleDrive, 
  getDriveAccessToken, 
  DriveUploadResult 
} from '../services/googleDriveService';

interface AlbertaVscModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultApplicantName?: string;
  defaultTrack?: 'volunteer' | 'professional';
  defaultCity?: string;
}

export const AlbertaVscModal: React.FC<AlbertaVscModalProps> = ({
  isOpen,
  onClose,
  defaultApplicantName = '',
  defaultTrack = 'volunteer',
  defaultCity = 'Calgary, AB',
}) => {
  const [applicantName, setApplicantName] = useState(defaultApplicantName);
  const [dateOfBirth, setDateOfBirth] = useState('1992-05-14');
  const [city, setCity] = useState(defaultCity);
  const [isTrackVolunteer, setIsTrackVolunteer] = useState(defaultTrack === 'volunteer');
  const [copied, setCopied] = useState(false);

  // Google Drive state
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<DriveUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDriveConfirmation, setShowDriveConfirmation] = useState(false);

  useEffect(() => {
    if (defaultApplicantName) setApplicantName(defaultApplicantName);
  }, [defaultApplicantName]);

  if (!isOpen) return null;

  const letterContent = generateAlbertaVscLetterContent({
    applicantName,
    dateOfBirth,
    isVolunteer: isTrackVolunteer,
    city,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(letterContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([letterContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = (applicantName || 'Caregiver').replace(/\s+/g, '_');
    a.download = `Alberta_VSC_Template_Letter_${cleanName}_CompassionateCare.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Google Drive Upload Handler (Requires explicit user confirmation)
  const confirmAndUploadToDrive = async () => {
    setShowDriveConfirmation(false);
    setIsUploadingToDrive(true);
    setUploadError(null);

    try {
      let token = getDriveAccessToken();
      if (!token) {
        // Trigger Google OAuth popup
        const authRes = await signInWithGoogleDrive();
        token = authRes.accessToken;
      }

      const result = await uploadVscLetterToGoogleDrive(token, {
        applicantName,
        dateOfBirth,
        isVolunteer: isTrackVolunteer,
        city,
      });

      setUploadSuccess(result);
    } catch (err: any) {
      console.error('Failed to upload to Google Drive:', err);
      setUploadError(err.message || 'Unable to connect to Google Drive. Please try again.');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 backdrop-blur-sm rounded-2xl border border-emerald-400/30">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold text-white">Alberta Vulnerable Sector Check (VSC) Letter</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 rounded-full">
                  Canada (Alberta)
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Official agency confirmation letter for Calgary Police, Edmonton Police & Alberta RCMP detachments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          {/* Provincial Clearance Notice Banner */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Alberta Police Act & Criminal Records Act (Sec 6.3) Compliance</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Alberta police services mandate an official agency letter on letterhead authorizing the Vulnerable Sector Check (VSC / PIC-VS) for unsupervised companion visits with elderly adults. Volunteers qualify for discounted or waived processing fees.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white text-emerald-900 font-extrabold text-[11px] rounded-xl border border-emerald-300 shadow-xs">
                {isTrackVolunteer ? 'Volunteer: Fee Waived / $15' : 'Professional: Standard Rate'}
              </span>
            </div>
          </div>

          {/* Configuration Form Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Caregiver Full Legal Name
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="e.g. Liam Henderson"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Alberta Municipality
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-600 outline-none"
              >
                <option value="Calgary, AB">Calgary (Calgary Police Service ePIC)</option>
                <option value="Edmonton, AB">Edmonton (Edmonton Police Service ePIC)</option>
                <option value="Red Deer, AB">Red Deer (RCMP "K" Division)</option>
                <option value="Lethbridge, AB">Lethbridge (Lethbridge Police)</option>
                <option value="Medicine Hat, AB">Medicine Hat (Medicine Hat Police)</option>
                <option value="St. Albert, AB">St. Albert (RCMP Detachment)</option>
                <option value="Strathcona County, AB">Sherwood Park / Strathcona (RCMP)</option>
                <option value="Airdrie, AB">Airdrie (RCMP Detachment)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Engagement Track
              </label>
              <div className="flex items-center space-x-1 bg-white p-1 border border-gray-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsTrackVolunteer(true)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                    isTrackVolunteer ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Volunteer
                </button>
                <button
                  type="button"
                  onClick={() => setIsTrackVolunteer(false)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                    !isTrackVolunteer ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>
          </div>

          {/* Action Hub (Google Drive, Download, Copy) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-emerald-950 text-white rounded-2xl">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Save to Google Drive or Export</span>
              </div>
              <p className="text-[11px] text-emerald-300/90">
                Directly save this official document to your Google Drive, download as text, or copy for online ePIC upload.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Google Drive Upload Button */}
              <button
                onClick={() => setShowDriveConfirmation(true)}
                disabled={isUploadingToDrive}
                className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isUploadingToDrive ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Drive...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Save to Google Drive</span>
                  </>
                )}
              </button>

              {/* Local Download Button */}
              <button
                onClick={handleDownloadTxt}
                className="py-2 px-3.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download (.txt)</span>
              </button>

              {/* Copy Text Button */}
              <button
                onClick={handleCopy}
                className="py-2 px-3.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Google Drive Upload Success Notification */}
          {uploadSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <div className="font-extrabold text-emerald-950">Successfully Added to Your Google Drive!</div>
                  <div className="text-[11px] text-emerald-800 font-mono mt-0.5">{uploadSuccess.fileName}</div>
                </div>
              </div>
              <a
                href={uploadSuccess.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <span>Open in Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Document Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Official Agency Template Preview
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Standard Alberta Police Format
              </span>
            </div>
            <div className="p-4 bg-gray-900 text-gray-100 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto max-h-72 select-all border border-gray-800 shadow-inner">
              <pre className="whitespace-pre-wrap">{letterContent}</pre>
            </div>
          </div>

          {/* Alberta Police Service Submission Instructions */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="font-bold text-xs text-gray-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>How Caregivers Submit in Alberta:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-700">
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <div className="font-bold text-gray-900 mb-1">1. Calgary (CPS ePIC)</div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Apply online at <span className="font-semibold text-emerald-800">policeinformationcheck.calgary.ca</span>. Upload this letter to secure the $15 volunteer rate.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <div className="font-bold text-gray-900 mb-1">2. Edmonton (EPS ePIC)</div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Submit online at <span className="font-semibold text-emerald-800">edmontonpolice.ca/pic</span>. Select Vulnerable Sector Check and attach this agency confirmation.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <div className="font-bold text-gray-900 mb-1">3. RCMP Detachments</div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  For rural Alberta, Airdrie, Red Deer, and St. Albert: Print this letter and take it to your local RCMP detachment with 2 pieces of government ID.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-gray-500 text-[11px]">
            Canada Caregiver Standards • Criminal Records Act Sec 6.3
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog before mutating/creating in Google Drive */}
      {showDriveConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileUp className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">
                Save VSC Letter to Google Drive?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                This will create a new document named{' '}
                <strong className="text-gray-900 font-mono">
                  Alberta_VSC_Template_Letter_{applicantName || 'Caregiver'}_CompassionateCare.txt
                </strong>{' '}
                directly in your Google Drive with permission from your Google account.
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900">
              ✓ Ready for submission to Calgary Police, Edmonton Police, or RCMP detachments.
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowDriveConfirmation(false)}
                className="py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndUploadToDrive}
                className="py-2.5 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all"
              >
                Confirm & Save to Drive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
